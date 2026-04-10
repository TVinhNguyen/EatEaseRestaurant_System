output "vpc_id" {
  value = aws_vpc.main.id
}

output "backend_instance_id" {
  value = aws_instance.backend.id
}

output "backend_private_ip" {
  value = aws_instance.backend.private_ip
}

output "api_alb_dns_name" {
  value = aws_lb.api.dns_name
}

output "api_base_url" {
  value = var.acm_certificate_arn != "" ? "https://${aws_lb.api.dns_name}" : "http://${aws_lb.api.dns_name}"
}

output "docdb_cluster_endpoint" {
  value = aws_docdb_cluster.main.endpoint
}

output "docdb_connection_example" {
  value     = "mongodb://${var.docdb_master_username}:${urlencode(random_password.docdb_password.result)}@${aws_docdb_cluster.main.endpoint}:27017/eatease?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  sensitive = true
}

output "docdb_master_password" {
  value     = random_password.docdb_password.result
  sensitive = true
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_api_base_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
