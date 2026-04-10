# EatEase - Quy trình deploy AWS (đã cập nhật)

## 0) Mục tiêu

Deploy stack:

- Terraform tạo hạ tầng (VPC, ALB, EC2 private, DocumentDB, S3, CloudFront)
- Backend chạy trên EC2 bằng PM2
- Frontend build local và sync lên S3
- CloudFront phục vụ frontend + proxy `/api` và `/socket.io`

---

## 1) Terraform

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
terraform output
```

Output cần dùng:

- `backend_instance_id`
- `cloudfront_domain_name`
- `frontend_bucket_name`
- `frontend_api_base_url`
- `docdb_connection_example` (sensitive)

---

## 2) Deploy backend (EC2 private qua SSM)

### 2.1 Vào EC2

```bash
aws ssm start-session --target <backend_instance_id> --region ap-southeast-1
```

### 2.2 Clone code và cài package

```bash
cd /opt/eatease
git clone <repo-url> EatEaseRestaurant_System || true
cd EatEaseRestaurant_System/server
npm ci
```

### 2.3 Tạo `.env`

```bash
cat > .env <<'EOF'
NODE_ENV=production
PORT=8080
MONGODB_URL=<terraform output -raw docdb_connection_example>
FRONTEND_URL=https://<cloudfront_domain_name>

SECRET_KEY_ACCESS_TOKEN=<random>
SECRET_KEY_REFRESH_TOKEN=<random>

GOOGLE_CLIENT_ID=<google-client-id>
STRIPE_SECRET_KEY=<stripe-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook>
EMAIL_USER=<email>
EMAIL_PASS=<email-app-pass>
GEMINI_API_KEY=<gemini-key>
EOF
```

### 2.4 Chạy PM2

```bash
pm2 start index.js --name eatease-server
pm2 save
pm2 status
pm2 logs eatease-server --lines 50
```

---

## 3) Deploy frontend (fix Mixed Content chuẩn)

### 3.1 Build frontend với HTTPS CloudFront URL

```bash
cd client
npm ci
VITE_API_URL=https://<cloudfront_domain_name> \
VITE_SERVER_URL=https://<cloudfront_domain_name> \
VITE_GOOGLE_CLIENT_ID=<google-client-id> \
npm run build
```

Ghi chú: dùng `https://<cloudfront_domain_name>` để browser gọi `/api/*` cùng origin HTTPS, không bị Mixed Content.

### 3.2 Upload build lên S3

```bash
aws s3 sync dist/ s3://<frontend_bucket_name>/ --delete
```

### 3.3 Invalidate CloudFront cache

```bash
aws cloudfront create-invalidation --distribution-id <distribution_id> --paths "/*"
```

### 3.4 Verify

- Mở: `https://<cloudfront_domain_name>`
- DevTools Network phải thấy request API dạng:
  - `https://<cloudfront_domain_name>/api/...`
- Không còn request `http://<alb-dns>/api/...`

---

## 4) Update code theo branch rồi pull về EC2

### Local

```bash
git checkout -b deploy-aws-dev
git add .
git commit -m "your message"
git push origin deploy-aws-dev
```

### EC2

```bash
cd /opt/eatease/EatEaseRestaurant_System
git fetch origin
git checkout deploy-aws-dev
git pull origin deploy-aws-dev
cd server
npm ci
pm2 restart eatease-server
```

---

## 5) Troubleshooting nhanh

### 5.1 Mixed Content

Nếu gặp lại lỗi này, kiểm tra build env của frontend:

- `VITE_API_URL=https://<cloudfront_domain_name>`
- `VITE_SERVER_URL=https://<cloudfront_domain_name>`

### 5.2 Google OAuth `Missing required parameter client_id`

Thiếu `VITE_GOOGLE_CLIENT_ID` lúc build. Build lại với biến này.

### 5.3 DocumentDB TLS lỗi cert

Kiểm tra log PM2 và cấu hình `MONGODB_URL`. Dev có thể cần workaround tạm, production phải dùng CA/TLS chuẩn.

---

## 6) Checklist trước khi demo

- [ ] `terraform output` có đủ output mới
- [ ] Backend `pm2 status` online
- [ ] Frontend load từ CloudFront
- [ ] API request đi qua `https://<cloudfront>/api/*`
- [ ] Login Google không lỗi `client_id`
- [ ] Không còn Mixed Content trong console
# EatEase Restaurant System - AWS Deployment Guide

## Mục lục
1. [Chuẩn bị](#chuẩn-bị)
2. [Terraform - Tạo hạ tầng](#terraform---tạo-hạ-tầng)
3. [Backend - Deploy lên EC2](#backend---deploy-lên-ec2)
4. [Frontend - Deploy lên S3/CloudFront](#frontend---deploy-lên-s3cloudfront)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)
7. [Production Checklist](#production-checklist)

---

## Chuẩn bị

### 1.1 AWS Account & IAM

1. Tạo **AWS Account** (hoặc dùng tài khoản hiện có)
2. Tạo **IAM User** cho Terraform với quyền:
   - VPC, EC2, ALB, S3, CloudFront, DocumentDB, IAM, CloudWatch, etc.
   - Hoặc dùng **AdministratorAccess** policy (không khuyên cho prod)
3. Lấy **Access Key ID** và **Secret Access Key**

### 1.2 Local Machine

Cài đặt tools:

```bash
# Terraform >= 1.6
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Git (để push code)
sudo apt-get install git

# Node.js 20 (build frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install nodejs

# Verify
terraform version
aws --version
node --version
```

### 1.3 Configure AWS Credentials

```bash
aws configure
```

Nhập:
- AWS Access Key ID: `AKIAIOSFODNN7EXAMPLE`
- AWS Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- Default region: `ap-southeast-1`
- Default output format: `json`

Verify:
```bash
aws sts get-caller-identity
```

Output:
```json
{
    "UserId": "AIDAJ45Q7YFFAREXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform"
}
```

---

## Terraform - Tạo hạ tầng

### 2.1 Chuẩn bị Terraform

```bash
cd infra/terraform

# Copy biến mẫu
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars
nano terraform.tfvars
```

Nội dung `terraform.tfvars`:

```hcl
aws_region   = "ap-southeast-1"
environment  = "dev"
project_name = "eatease"

# SSH public key (optional)
ssh_public_key = ""

# EC2
ec2_instance_type    = "t3.small"
ec2_root_volume_size = 30

# DocumentDB
docdb_master_username = "eateaseadmin"
docdb_instance_class  = "db.t3.medium"
docdb_instance_count  = 1

# VPC Endpoints (SSM)
enable_ssm_vpc_endpoints = true

# ACM cert ARN (optional, leave empty for HTTP dev)
acm_certificate_arn = ""

# Skip final snapshot on destroy (dev: true, prod: false)
docdb_skip_final_snapshot = true
```

### 2.2 Terraform Init & Plan

```bash
# Download providers
terraform init

# Preview changes
terraform plan

# Review output carefully
```

### 2.3 Terraform Apply

```bash
# Create resources (takes 10-15 minutes)
terraform apply

# Type 'yes' to confirm
```

Sau khi hoàn thành, lấy outputs:

```bash
terraform output
```

Lưu lại các giá trị:
- `api_alb_dns_name`
- `api_base_url`
- `backend_instance_id`
- `backend_private_ip`
- `docdb_cluster_endpoint`
- `docdb_connection_example` (sensitive)
- `frontend_bucket_name`
- `cloudfront_domain_name`

---

## Backend - Deploy lên EC2

### 3.1 Clone Code lên EC2

Mở AWS SSM Session Manager từ Console:
1. EC2 Dashboard → Instances
2. Select: `eatease-{env}-backend`
3. Connect → Session Manager

Hoặc dùng terminal:

```bash
aws ssm start-session --target i-0af0de5f2530fa96d --region ap-southeast-1
```

Trong Session Manager terminal trên EC2:

```bash
cd /opt/eatease
git clone https://github.com/YourOrg/EatEaseRestaurant_System.git
cd EatEaseRestaurant_System/server
```

### 3.2 Tạo `.env` Backend

```bash
cat > .env <<'EOF'
NODE_ENV=production
PORT=8080

# Database
MONGODB_URL=<paste-từ-terraform-output-docdb_connection_example>

# Frontend
FRONTEND_URL=https://d1p1iohta72upr.cloudfront.net

# JWT Secrets (generate mỗi cái bằng: openssl rand -base64 64)
SECRET_KEY_ACCESS_TOKEN=generated_random_string_1
SECRET_KEY_REFRESH_TOKEN=generated_random_string_2

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_CLI_WEBHOOK_SECRET=whsec_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx

# AI (Gemini)
GEMINI_API_KEY=AIzaSyD...
EOF

# Verify
cat .env
```

### 3.3 Cài Dependencies & Start

```bash
# Install
npm ci

# Start bằng PM2
pm2 start index.js --name eatease-server

# Auto-start on reboot
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs eatease-server --lines 30
```

Nếu vẫn lỗi DocumentDB TLS, xem [Troubleshooting - DocumentDB Connection](#documentdb-connection-error).

### 3.4 Verify Backend

```bash
# Local test (từ máy local)
curl http://eatease-dev-api-alb-xxx.ap-southeast-1.elb.amazonaws.com/

# Should return:
# {"message":"EatEase Server running on port 8080"}
```

---

## Frontend - Deploy lên S3/CloudFront

### 4.1 Build Frontend

Trên máy local:

```bash
cd client
npm ci

# Build với HTTPS CloudFront URL
VITE_API_URL=https://<cloudfront_domain_name> \
VITE_SERVER_URL=https://<cloudfront_domain_name> \
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com \
npm run build

# Output: dist/
```

**Quan trọng**: Phải dùng `https://<cloudfront_domain_name>` để browser gửi API qua cùng domain HTTPS. Nếu build với HTTP ALB DNS, sẽ bị Mixed Content error.

### 4.2 Upload lên S3

```bash
# Sync dist → S3
aws s3 sync dist/ s3://eatease-dev-frontend-79ce79/ --delete --region ap-southeast-1

# Verify
aws s3 ls s3://eatease-dev-frontend-79ce79/ --recursive
```

### 4.3 Invalidate CloudFront

```bash
# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id E2QXXW0OBNDGX1 \
  --paths "/*" \
  --region ap-southeast-1

# Check status
aws cloudfront list-invalidations --distribution-id E2QXXW0OBNDGX1
```

### 4.4 Verify Frontend

1. Mở browser: `https://d1p1iohta72upr.cloudfront.net`
2. Trang nên load mà không lỗi console

---

## Testing & Validation

### 5.1 Health Check

```bash
# API endpoint
curl -v http://eatease-dev-api-alb-xxx.ap-southeast-1.elb.amazonaws.com/

# Expected: 200 OK, JSON response
```

### 5.2 Functional Testing

| Feature | Test | Expected |
|---------|------|----------|
| **Login** | Submit credentials | JWT token returned |
| **Register** | Create new account | Email verification sent |
| **Product List** | GET `/api/product` | JSON array returned |
| **Upload Image** | POST form file | URL returned, image in Cloudinary |
| **Order** | POST order data | Order created, payment flow |
| **Real-time** | Socket connection | Kitchen orders update live |

### 5.3 Performance Testing

```bash
# Check ALB latency
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --region ap-southeast-1

# Check CloudFront cache
curl -I https://d1p1iohta72upr.cloudfront.net/index.html | grep X-Cache
```

---

## Troubleshooting

### DocumentDB Connection Error

**Lỗi**: `unable to get local issuer certificate`

**Nguyên nhân**: TLS handshake không kết nối được CA certificate.

**Fix**:
```javascript
// connectDB.js - already applied
const mongooseOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true // dev only!
};
```

**Verify**:
```bash
pm2 logs eatease-server | grep "EatEase Server is running"
```

---

### CORS Error

**Lỗi**: `Access to XMLHttpRequest from origin blocked by CORS policy`

**Nguyên nhân**: `FRONTEND_URL` không khớp với ALB domain.

**Fix**:
1. Backend `.env`: `FRONTEND_URL` phải là CloudFront domain
2. Check [server/index.js](server/index.js) - CORS config
3. Restart: `pm2 restart eatease-server`

---

### Google OAuth Missing Client ID

**Lỗi**: `Missing required parameter client_id`

**Nguyên nhân**: Frontend build không có `VITE_GOOGLE_CLIENT_ID`.

**Fix**:
```bash
cd client
VITE_GOOGLE_CLIENT_ID=xxx npm run build
aws s3 sync dist/ s3://bucket/ --delete
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

---

### EC2 Cannot Connect to DocumentDB

**Lỗi**: Connection timeout

**Nguyên nhân**: Security group, network routing, hoặc DocumentDB chưa ready.

**Debug**:
```bash
# Từ EC2 terminal
nc -zv eatease-dev-docdb.cluster-cdg4o40ac1gu.ap-southeast-1.docdb.amazonaws.com 27017

# Xem DocumentDB status
aws docdb describe-db-clusters --region ap-southeast-1
```

---

### S3/CloudFront 403 Forbidden

**Lỗi**: `Access Denied` từ CloudFront

**Nguyên nhân**: S3 bucket policy hoặc OAC configuration sai.

**Fix**:
1. Verify bucket public access blocked: ✓
2. Verify CloudFront OAC attached to bucket policy: ✓
3. Invalidate cache: `aws cloudfront create-invalidation...`

---

## Production Checklist

### Infrastructure

- [ ] Region: Chọn region gần users (ap-southeast-1 cho VN/SG)
- [ ] Multi-AZ: NAT gateway 2 cái (1 per AZ)
- [ ] EC2: ASG with min=2, desired=2, max=5
- [ ] DocumentDB: 3 instances (1 primary + 2 replicas)
- [ ] ALB: ACM certificate, HTTPS listener
- [ ] S3: Versioning, lifecycle policy, logging
- [ ] CloudFront: WAF enabled, logging to S3
- [ ] VPC Endpoints: SSM, SSMMessages, EC2Messages

### Security

- [ ] Security Groups: Least privilege (closed by default)
- [ ] IAM Roles: Only required permissions
- [ ] DocumentDB: TLS enabled, deletion protection enabled
- [ ] EBS: Encrypted at rest
- [ ] S3: Block public access, encryption enabled
- [ ] RDS backups: 30 days retention
- [ ] Secrets: Use AWS Secrets Manager, not `.env`
- [ ] SSL/TLS: ACM certificate, HTTPS redirect

### Monitoring & Logging

- [ ] CloudWatch Alarms: High CPU, DB lag, ALB unhealthy targets
- [ ] ALB Logs: Enable, send to S3
- [ ] EC2 CloudWatch Agent: CPU, memory, disk metrics
- [ ] DocumentDB: Enhanced monitoring enabled
- [ ] Application Logs: Centralize to CloudWatch Logs
- [ ] VPC Flow Logs: For network troubleshooting

### CI/CD

- [ ] GitHub Actions: Auto-deploy on push to `main`
- [ ] Build: `npm ci`, `npm run build`, tests
- [ ] Deploy:
  - Backend: EC2 via SSM + pm2 restart
  - Frontend: S3 sync + CloudFront invalidation
- [ ] Rollback: Git revert + redeploy

### Disaster Recovery

- [ ] Terraform State: Remote S3 + DynamoDB lock
- [ ] Database Backups: Daily automated snapshots
- [ ] Backup to S3: DocumentDB snapshots → S3
- [ ] Documentation: README, runbooks, architecture docs
- [ ] Test Recovery: Monthly RTO/RPO test

### Performance

- [ ] CDN: CloudFront edge locations, compression enabled
- [ ] Database: Indexes optimized, slow query logs monitored
- [ ] Application: PM2 clustering, load balancing
- [ ] Cache: Browser cache, API response caching

### Cost Optimization

- [ ] Reserved Instances: EC2 on-demand → RI (50% saving)
- [ ] DocumentDB: Right-sizing instance class
- [ ] S3: Transition to Glacier after 90 days
- [ ] Data Transfer: VPC endpoints for private services
- [ ] Budget: Set AWS Budget alerts

### Documentation

- [ ] Architecture diagram: Maintained in Git
- [ ] Deployment runbook: Step-by-step guide
- [ ] Environment variables: Documented, secure storage
- [ ] API documentation: Postman/OpenAPI spec
- [ ] Troubleshooting guide: Common issues & solutions

---

## Environment Progression

### Development (dev)
```
- Terraform: Full stack
- Manual deployment
- Single instance
- No backups
- Open SSH (SSM)
```

### Staging (staging)
```
- Terraform: Multi-AZ ready
- CI/CD via GitHub Actions
- 2+ instances behind ASG
- Daily backups
- Same as production (mirror)
```

### Production (prod)
```
- Terraform: Multi-AZ + HA
- Automated CI/CD
- 3+ instances behind ASG
- 30-day backups + S3 archive
- Monitoring + Alerts
- No direct SSH (SSM only)
```

---

## Next Steps After Deployment

1. **Setup CI/CD**: GitHub Actions workflow
2. **Setup Monitoring**: CloudWatch dashboards + alerts
3. **Setup Backups**: Automated DocumentDB snapshots → S3
4. **Setup DNS**: Route53 → ALB/CloudFront
5. **Setup HTTPS**: ACM certificate → ALB listener
6. **Setup WAF**: CloudFront WAF rules
7. **Setup CDN Cache**: Optimize cache headers
8. **Performance Testing**: Load testing, chaos engineering
9. **Security Audit**: Penetration testing, compliance check
10. **Cost Optimization**: Right-sizing, reserved instances

---

## Useful AWS CLI Commands

```bash
# Get Terraform outputs
cd infra/terraform
terraform output
terraform output -raw docdb_connection_example

# SSH to EC2 via SSM
aws ssm start-session --target i-0af0de5f2530fa96d --region ap-southeast-1

# View EC2 logs
aws ec2 describe-instances --instance-ids i-0af0de5f2530fa96d --region ap-southeast-1

# Check DocumentDB status
aws docdb describe-db-clusters --region ap-southeast-1

# List S3 objects
aws s3 ls s3://eatease-dev-frontend-79ce79/ --recursive

# Create CloudFront invalidation
aws cloudfront create-invalidation --distribution-id ID --paths "/*"

# Monitor CloudWatch logs
aws logs tail /aws/ec2/eatease-dev-backend --follow

# Destroy infrastructure (⚠️ careful!)
terraform destroy
```

---

## Cost Estimation (Monthly)

| Component | Dev | Staging | Production |
|-----------|-----|---------|-----------|
| EC2 | $10-15 | $40-60 | $100-200 |
| DocumentDB | $40-60 | $150-200 | $400-600 |
| ALB | $15-20 | $15-20 | $15-20 |
| NAT Gateway | $30-45 | $30-45 | $60-90 |
| S3 + CloudFront | $5-10 | $5-10 | $20-50 |
| Data Transfer | $5-10 | $10-20 | $50-100 |
| **Total** | **$100-150** | **$250-350** | **$700-1200** |

---

## Support & Troubleshooting

- **AWS Support**: Premium support tier (prod recommended)
- **Slack/Discord**: Team notifications on deployment
- **PagerDuty**: Alert on-call engineer
- **PostMortem**: After incidents, root cause analysis

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-04-10 | Initial deployment guide |
| 2.0 | TBD | Multi-AZ HA + Auto-scaling |
| 3.0 | TBD | Full production hardened |

---

Last updated: 2026-04-10
