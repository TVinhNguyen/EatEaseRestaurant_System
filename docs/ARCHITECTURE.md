# EatEase - Kiến trúc triển khai AWS (hiện tại)

## 1) Tổng quan

Hệ thống đang chạy theo mô hình:

- Frontend SPA (Vite/React) trên **S3 + CloudFront**
- Backend Node.js (Express + Socket.IO) trên **EC2 private subnet**
- CSDL trên **Amazon DocumentDB**
- Public entry cho API qua **ALB**
- Quản trị EC2 bằng **SSM Session Manager** (không cần SSH public)

## 2) Luồng truy cập

### 2.1 Frontend

User → `https://<cloudfront-domain>` → CloudFront → S3 (file tĩnh)

### 2.2 API (đã fix Mixed Content)

Browser (HTTPS) gọi:

- `https://<cloudfront-domain>/api/*`
- `https://<cloudfront-domain>/socket.io/*`

CloudFront sẽ route đến origin ALB (`apiAlbOrigin`) qua HTTP nội bộ AWS.

Kết quả: browser không còn gọi `http://<alb-dns>` trực tiếp nên không bị `Mixed Content`.

## 3) Network

- VPC: `10.30.0.0/16`
- Public subnets: ALB, NAT
- Private subnets: EC2 backend, DocumentDB, VPC Endpoints (SSM)

## 4) Security Groups

- ALB SG: mở `80/443` từ internet
- EC2 SG: chỉ nhận `80` từ ALB SG
- DocDB SG: chỉ nhận `27017` từ EC2 SG

## 5) Compute / Runtime

- EC2 chạy Nginx reverse proxy → Node app port `8080`
- Process manager: PM2 (`eatease-server`)
- IAM role EC2: `AmazonSSMManagedInstanceCore`

## 6) Database

- Engine: DocumentDB 5.0
- Kết nối qua `MONGODB_URL`
- URI có `tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`
- Terraform đã `urlencode()` password trong output mẫu

## 7) CDN / Routing

CloudFront hiện có:

- Default behavior: phục vụ frontend từ S3
- Ordered behavior `/api/*`: forward ALB, no-cache
- Ordered behavior `/socket.io/*`: forward ALB, no-cache, hỗ trợ realtime
- SPA fallback: lỗi `403/404` trả về `index.html`

## 8) Terraform outputs quan trọng

- `cloudfront_domain_name`
- `frontend_api_base_url` (khuyến nghị dùng cho frontend build)
- `api_alb_dns_name`
- `docdb_connection_example` (sensitive)
- `frontend_bucket_name`

## 9) Biến môi trường nên dùng

### Backend

- `PORT=8080`
- `MONGODB_URL=<terraform output -raw docdb_connection_example>`
- `FRONTEND_URL=https://<cloudfront_domain_name>`
- JWT/Stripe/Email/Google/Gemini keys

### Frontend (build time)

- `VITE_API_URL=https://<cloudfront_domain_name>`
- `VITE_SERVER_URL=https://<cloudfront_domain_name>`
- `VITE_GOOGLE_CLIENT_ID=<google-client-id>`

## 10) Ghi chú production

- Nên bật HTTPS end-to-end cho ALB (`acm_certificate_arn`)
- Nên bỏ dev fallback TLS invalid cert ở backend
- Nên thêm monitoring + alarm (CloudWatch)
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
VITE_API_URL=https://<cloudfront_domain_name>
VITE_SERVER_URL=https://<cloudfront_domain_name>
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

**Note**: Dùng CloudFront HTTPS domain để tránh Mixed Content error. Browser sẽ gửi `/api/*` qua cùng origin HTTPS.

---

## Tài liệu bổ sung

Xem [DEPLOYMENT.md](DEPLOYMENT.md) cho:
- Hướng dẫn triển khai chi tiết (Terraform, Backend, Frontend)
- Troubleshooting guide
- Production checklist
- Monitoring & logging strategy
- Scaling & cost optimization
- Next steps sau deployment
