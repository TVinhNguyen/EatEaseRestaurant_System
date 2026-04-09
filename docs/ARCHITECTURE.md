# EatEase Restaurant System - Architecture

## Tổng quan

Hệ thống EatEase được triển khai trên AWS với kiến trúc 3-tier:
- **Presentation Layer**: Frontend Vite + CloudFront CDN
- **Application Layer**: Node.js backend trên EC2 private + ALB
- **Data Layer**: DocumentDB (MongoDB-compatible)

---

## Sơ đồ kiến trúc

```
                         Internet
                             |
                    ┌────────┴────────┐
                    |                 |
              (HTTP/HTTPS)      (HTTPS CDN)
                    |                 |
            ┌───────▼────────┐   ┌────▼──────────┐
            |   ALB (port    |   | CloudFront    |
            |   80/443)      |   | Distribution  |
            └───────┬────────┘   └────┬──────────┘
                    |                 |
        ┌───────────┴───────────┐     |
        |                       |     |
    ┌───▼─────────────────┐    |     |
    | Public Subnet AZ-1  |    |  ┌──▼──────────────┐
    |  ┌──────────────┐   |    |  | S3 Private      |
    |  │ NAT Gateway  │   |    |  | Bucket          |
    |  └──────────────┘   |    |  │ (eatease-dev-   |
    └────────┬────────────┘    │  │ frontend-...)   |
             |                 │  └─────────────────┘
    ┌────────▼────────────────────────────┐
    │      VPC (10.30.0.0/16)             │
    │                                     │
    │  ┌─────────────────────────────┐   │
    │  │ Private Subnet AZ-1 & AZ-2  │   │
    │  │                             │   │
    │  │  ┌───────────────────────┐  │   │
    │  │  │ EC2 Backend Instance  │  │   │
    │  │  │ (Node.js + Nginx)     │  │   │
    │  │  │ (10.30.11.0/24)       │  │   │
    │  │  └───────────────────────┘  │   │
    │  │                             │   │
    │  │  ┌───────────────────────┐  │   │
    │  │  │ DocumentDB Cluster    │  │   │
    │  │  │ (port 27017)          │  │   │
    │  │  │ (10.30.11.0/24)       │  │   │
    │  │  └───────────────────────┘  │   │
    │  │                             │   │
    │  │  ┌───────────────────────┐  │   │
    │  │  │ VPC Endpoints         │  │   │
    │  │  │ (SSM, SSMMessages,    │  │   │
    │  │  │  EC2Messages)         │  │   │
    │  │  └───────────────────────┘  │   │
    │  └─────────────────────────────┘   │
    │                                     │
    └─────────────────────────────────────┘
```

---

## Chi tiết từng thành phần

### 1. VPC & Network

- **VPC CIDR**: `10.30.0.0/16`
- **Public Subnets**:
  - AZ-1: `10.30.1.0/24` → ALB, NAT Gateway
  - AZ-2: `10.30.2.0/24` → ALB (HA)
- **Private Subnets**:
  - AZ-1: `10.30.11.0/24` → EC2, DocumentDB
  - AZ-2: `10.30.12.0/24` → DocumentDB replicas
- **NAT Gateway**: 1 cái ở public subnet AZ-1 để private subnet outbound internet (cho pm2, npm, etc.)
- **Internet Gateway**: Cho public subnets kết nối internet

### 2. Load Balancer (ALB)

- **Loại**: Application Load Balancer
- **Vị trí**: Public subnets (AZ-1, AZ-2)
- **Listeners**:
  - Port 80 (HTTP): Redirect → 443 (HTTPS) nếu có ACM cert
  - Port 80 (HTTP): Forward đến backend target group nếu không có cert (dev)
  - Port 443 (HTTPS): Forward đến backend target group (production)
- **Target Group**:
  - Port 80 (backend Nginx)
  - Health check: `/` (matcher: 200-399)
  - Stickiness: Disabled
- **Security Group**:
  - Ingress: 80, 443 từ `0.0.0.0/0`
  - Egress: Toàn bộ

### 3. EC2 Backend

- **Loại**: t3.small (dev) → t3.medium (prod)
- **AMI**: Ubuntu 24.04 LTS (Canonical)
- **Vị trí**: Private subnet AZ-1
- **Root Volume**: 30GB gp3, encrypted
- **IAM Role**: `eatease-{env}-ec2-role`
  - Policy: `AmazonSSMManagedInstanceCore` (cho SSM Session Manager)
- **User Data Script**:
  - Cài Node.js 20 LTS
  - Cài Nginx (reverse proxy)
  - Cài PM2 (process manager)
  - Config Nginx proxy_pass → 127.0.0.1:8080
- **Security Group**:
  - Ingress: Port 80 từ ALB SG
  - Egress: Toàn bộ (outbound)

### 4. DocumentDB

- **Engine**: AWS DocumentDB (MongoDB-compatible)
- **Version**: 5.0.0
- **Vị trí**: Private subnets (AZ-1, AZ-2)
- **Instance Class**: db.t3.medium (dev) / db.r5.large (prod)
- **Instance Count**: 1 (dev) / 3 (prod + HA)
- **Storage**: Encrypted at rest
- **Backup**:
  - Retention: 7 days (dev) / 30 days (prod)
  - Window: 17:00-18:00 UTC
  - Deletion protection: Enabled (prod only)
- **Parameters**:
  - TLS enabled: `true`
  - Replica Set: `rs0`
  - Read Preference: `secondaryPreferred`
- **Security Group**:
  - Ingress: Port 27017 từ EC2 SG
  - Egress: Disabled (database không cần ra internet)
- **Connection String**:
  ```
  mongodb://user:password@cluster-endpoint:27017/eatease?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
  ```

### 5. S3 + CloudFront (Frontend)

- **S3 Bucket**: `eatease-{env}-frontend-{suffix}`
  - Public access: Blocked
  - Versioning: Enabled
  - Server-side encryption: Enabled
  - Ownership: BucketOwnerEnforced
- **CloudFront Distribution**:
  - Origin: S3 bucket (via Origin Access Control)
  - Cache behaviors:
    - Default: 200-399, compress enabled
    - Error handling: 403, 404 → /index.html (SPA fallback)
  - Viewer protocol: HTTPS redirect
  - TTL: Default CloudFront
- **Origin Access Control** (OAC):
  - Loại: Signature Version 4
  - Private DNS: Enabled
- **Deployment**:
  - Frontend build → `dist/`
  - Sync: `aws s3 sync dist/ s3://bucket/ --delete`
  - Invalidate: `aws cloudfront create-invalidation --distribution-id ID --paths "/*"`

### 6. VPC Endpoints (SSM)

- **Purpose**: SSM Session Manager để truy cập EC2 private mà không cần bastion host
- **Endpoints**:
  - `com.amazonaws.{region}.ssm` (Interface)
  - `com.amazonaws.{region}.ssmmessages` (Interface)
  - `com.amazonaws.{region}.ec2messages` (Interface)
- **Vị trí**: Private subnets
- **Security Group**: Accept HTTPS (443) từ EC2 SG
- **Private DNS**: Enabled

---

## Security

| Layer | Control |
|-------|---------|
| **Network** | Private EC2 + private DB, no public IPs |
| **ALB** | Security group: 80/443 public, forward to private backend |
| **EC2** | Security group: only HTTP from ALB, outbound via NAT |
| **DB** | Security group: only 27017 from EC2, no egress |
| **Storage** | S3 encrypted, CloudFront OAC, no public access |
| **Encryption** | EBS encrypted, DocumentDB TLS + encrypted at rest |
| **Access** | SSM Session Manager (no SSH), IAM roles |

---

## Data Flow

### 1. User → Frontend
```
Client → CloudFront CDN → S3 bucket
(HTTPS)  (cached)       (private)
```

### 2. Frontend → API
```
Browser → ALB DNS (http/https)
       ↓
    ALB Listener
       ↓
 EC2 Nginx (proxy_pass)
       ↓
  Node.js Express (8080)
       ↓
    DocumentDB (27017)
```

### 3. SSM Access
```
AWS Console / AWS CLI
       ↓
  VPC Endpoint (SSM)
       ↓
   EC2 Agent
       ↓
 Terminal Session
```

---

## Environment Variables (Backend)

```
# Server
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://d1p1iohta72upr.cloudfront.net

# Database
MONGODB_URL=mongodb://user:pass@endpoint:27017/eatease?tls=true&replicaSet=rs0&...

# JWT Secrets
SECRET_KEY_ACCESS_TOKEN=<base64_random>
SECRET_KEY_REFRESH_TOKEN=<base64_random>

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Payment
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI
GEMINI_API_KEY=...
```

---

## Environment Variables (Frontend - Build time)

```
VITE_API_URL=http://eatease-dev-api-alb-xxx.ap-southeast-1.elb.amazonaws.com
VITE_SERVER_URL=http://eatease-dev-api-alb-xxx.ap-southeast-1.elb.amazonaws.com
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## Deployment Environments

### Development (dev)
- EC2: t3.small (1 instance)
- DocumentDB: t3.medium (1 instance)
- NAT: 1 gateway
- Backup: 7 days
- Cost: ~$100-150/month

### Staging (staging)
- EC2: t3.medium (1-2 instances behind ASG)
- DocumentDB: r5.large (2-3 instances, replicated)
- NAT: 2 gateways (1 per AZ)
- Backup: 14 days
- Cost: ~$300-400/month

### Production (prod)
- EC2: t3.medium → t3.large (ASG 2-5 instances)
- DocumentDB: r5.large (3+ instances, replicated)
- NAT: 2 gateways (1 per AZ)
- ALB: Multi-AZ + ACM cert + Route53
- Backup: 30 days, deletion protection enabled
- Cost: ~$1000+/month

---

## Monitoring & Logging (Future)

- **CloudWatch**: EC2 CPU, memory, disk, network
- **RDS Enhanced Monitoring**: DocumentDB performance
- **ALB Logs**: HTTP request logs → S3
- **Application Logs**: PM2 logs, CloudWatch agent
- **Alarms**: High CPU, DB replication lag, ALB unhealthy targets

---

## Disaster Recovery

- **RTO**: 1 hour (rebuild stack via Terraform)
- **RPO**: 7-30 days (DocumentDB automated backups)
- **Multi-AZ**: ALB, DocumentDB span 2 AZ
- **Backup**: Automated daily snapshots to S3
- **IaC**: Terraform code in Git

---

## Scaling Strategy

### Horizontal
- **Frontend**: CloudFront edge locations (automatic)
- **Backend**: Auto Scaling Group (2-5 instances)
- **Database**: DocumentDB auto-scaling storage + read replicas

### Vertical
- **EC2**: Scale instance type (t3.small → t3.medium → t3.large)
- **DocumentDB**: Scale instance class or add replicas

---

## Cost Optimization

1. **On-Demand**: EC2 → Reserved instances (50% saving)
2. **DocumentDB**: Opt for smaller instance first, scale on demand
3. **NAT Gateway**: Consider NAT instance for dev (cheaper)
4. **S3**: Lifecycle policies (archive old versions)
5. **CloudFront**: Pay for data transfer (cheaper than ALB)
6. **Backup**: Adjust retention period per environment

---

## Next Steps

1. ✅ Terraform infrastructure
2. ✅ Deploy backend
3. ✅ Deploy frontend
4. 🔄 Setup CI/CD pipeline (GitHub Actions → deploy on push)
5. 🔄 Setup monitoring + alerts (CloudWatch)
6. 🔄 Setup Route53 + ACM for HTTPS domain
7. 🔄 Auto-scaling groups for backend
8. 🔄 Database backups to S3
9. 🔄 Disaster recovery plan
