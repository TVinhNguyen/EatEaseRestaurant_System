variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment phải là dev, staging, hoặc prod."
  }
}

variable "project_name" {
  description = "Project prefix used in resource naming"
  type        = string
  default     = "eatease"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.30.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.30.1.0/24", "10.30.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.30.11.0/24", "10.30.12.0/24"]
}

variable "api_domain" {
  description = "Optional API domain (for output reference only)"
  type        = string
  default     = ""
}

variable "frontend_domain" {
  description = "Optional frontend domain (for output reference only)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for ALB HTTPS listener. Leave empty to use HTTP only."
  type        = string
  default     = ""
}

variable "ec2_instance_type" {
  description = "EC2 instance type for backend"
  type        = string
  default     = "t3.small"
}

variable "ec2_root_volume_size" {
  description = "EC2 root EBS size in GB"
  type        = number
  default     = 30
}

variable "ssh_public_key" {
  description = "Public key content for EC2 key pair. Leave empty to skip key pair creation."
  type        = string
  default     = ""
  sensitive   = true
}

variable "docdb_master_username" {
  description = "DocumentDB master username"
  type        = string
  default     = "eateaseadmin"
}

variable "docdb_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "DocumentDB instance count"
  type        = number
  default     = 1
}

variable "docdb_engine_version" {
  description = "DocumentDB engine version"
  type        = string
  default     = "5.0.0"
}

variable "docdb_backup_retention_period" {
  description = "DocumentDB backup retention (days)"
  type        = number
  default     = 7
}

variable "docdb_preferred_backup_window" {
  description = "DocumentDB preferred backup window"
  type        = string
  default     = "17:00-18:00"
}

variable "docdb_skip_final_snapshot" {
  description = "Skip final snapshot on destroy (dev only)"
  type        = bool
  default     = false
}

variable "enable_ssm_vpc_endpoints" {
  description = "Create Interface VPC Endpoints for SSM, SSMMessages, EC2Messages"
  type        = bool
  default     = true
}
