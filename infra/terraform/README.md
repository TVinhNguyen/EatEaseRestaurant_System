# Terraform - EatEase AWS (EC2 + S3/CloudFront + DocumentDB)

## 1) Mục tiêu
Tạo hạ tầng AWS cơ bản để chạy hệ thống EatEase với:
- ALB public nhận traffic API
- EC2 private chạy backend Node.js + Nginx reverse proxy
- DocumentDB cho dữ liệu Mongo-compatible
- S3 private bucket + CloudFront để host frontend Vite

## 2) Cấu trúc file
- [versions.tf](versions.tf)
- [providers.tf](providers.tf)
- [variables.tf](variables.tf)
- [locals.tf](locals.tf)
- [main.tf](main.tf)
- [outputs.tf](outputs.tf)
- [terraform.tfvars.example](terraform.tfvars.example)

## 3) Cách chạy
1. Cài Terraform >= 1.6 và AWS CLI.
2. Cấu hình credentials AWS (`aws configure` hoặc env vars IAM role).
3. Trong thư mục này, tạo file `terraform.tfvars` từ `terraform.tfvars.example`.
4. Chạy:
   - `terraform init`
   - `terraform plan`
   - `terraform apply`

## 4) Sau khi apply
Lấy output:
- `backend_private_ip`
- `api_alb_dns_name`
- `api_base_url`
- `docdb_cluster_endpoint`
- `docdb_master_password` (sensitive)
- `frontend_bucket_name`
- `cloudfront_domain_name`

## 5) Deploy backend vào EC2
1. Dùng SSM Session Manager vào EC2 private.
2. Clone repo vào `/opt/eatease`.
3. Trong `server`, tạo `.env` production:
   - `PORT=8080`
   - `MONGODB_URL=<docdb_connection_example output>`
   - `FRONTEND_URL=https://<cloudfront_domain_name>`
   - các biến còn lại: JWT, Stripe, Email, Google, Gemini...
4. Cài package và chạy bằng pm2:
   - `npm ci`
   - `pm2 start index.js --name eatease-server`
   - `pm2 save`

## 6) Deploy frontend vào S3
1. Build frontend với env:
   - `VITE_API_URL=<api_base_url>` (hoặc domain API)
   - `VITE_SERVER_URL=<api_base_url>`
2. Sync artifact build lên S3 bucket output.
3. Invalidate CloudFront cache.

## 7) Lưu ý production
- Nên gắn ACM cert + Route53 cho ALB để dùng HTTPS domain thật cho API.
- `enable_ssm_vpc_endpoints = true` để Session Manager hoạt động không phụ thuộc internet egress từ NAT.
- Nên bật `docdb_skip_final_snapshot = false` cho production.
- Nên thêm remote state (S3 + DynamoDB lock) trước khi làm team.
