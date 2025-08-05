output "service_url" {
  description = "URL of the App Runner service"
  value       = length(var.vpc_subnets) > 0 ? aws_apprunner_service.app_with_vpc[0].service_url : aws_apprunner_service.app.service_url
}

output "service_arn" {
  description = "ARN of the App Runner service"
  value       = length(var.vpc_subnets) > 0 ? aws_apprunner_service.app_with_vpc[0].arn : aws_apprunner_service.app.arn
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.app.arn
}

output "custom_domain_records" {
  description = "DNS records to configure for custom domain"
  value = var.custom_domain != "" ? {
    domain = var.custom_domain
    records = aws_apprunner_custom_domain_association.app[0].certificate_validation_records
  } : null
}