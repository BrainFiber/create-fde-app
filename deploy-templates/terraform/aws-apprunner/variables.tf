variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "app_port" {
  description = "Port on which the application runs"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Path for health check endpoint"
  type        = string
  default     = "/api/health"
}

variable "environment_variables" {
  description = "Environment variables for the application"
  type        = map(string)
  default = {
    NODE_ENV = "production"
  }
}

variable "max_concurrency" {
  description = "Maximum number of concurrent requests per instance"
  type        = number
  default     = 100
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
  default     = 3
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "custom_domain" {
  description = "Custom domain for the application (optional)"
  type        = string
  default     = ""
}

variable "vpc_subnets" {
  description = "VPC subnet IDs for VPC connector (optional)"
  type        = list(string)
  default     = []
}

variable "vpc_security_groups" {
  description = "VPC security group IDs for VPC connector (optional)"
  type        = list(string)
  default     = []
}