terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = var.project_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# IAM Role for App Runner to access ECR
resource "aws_iam_role" "apprunner_ecr_access" {
  name = "${var.project_name}-apprunner-ecr-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-apprunner-ecr-access"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# App Runner Service
resource "aws_apprunner_service" "app" {
  service_name = "${var.project_name}-service"

  source_configuration {
    image_repository {
      image_configuration {
        port = var.app_port
        runtime_environment_variables = var.environment_variables
      }
      image_identifier      = "${aws_ecr_repository.app.repository_url}:latest"
      image_repository_type = "ECR"
    }
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }
  }

  health_check_configuration {
    healthy_threshold   = 2
    interval            = 5
    path                = var.health_check_path
    protocol            = "HTTP"
    timeout             = 3
    unhealthy_threshold = 3
  }

  auto_scaling_configuration {
    max_concurrency = var.max_concurrency
    max_size        = var.max_size
    min_size        = var.min_size
  }

  tags = {
    Name        = "${var.project_name}-service"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Custom domain (optional)
resource "aws_apprunner_custom_domain_association" "app" {
  count = var.custom_domain != "" ? 1 : 0

  domain_name = var.custom_domain
  service_arn = aws_apprunner_service.app.arn
}

# VPC Connector (optional)
resource "aws_apprunner_vpc_connector" "app" {
  count = length(var.vpc_subnets) > 0 ? 1 : 0

  vpc_connector_name = "${var.project_name}-vpc-connector"
  subnets            = var.vpc_subnets
  security_groups    = var.vpc_security_groups

  tags = {
    Name        = "${var.project_name}-vpc-connector"
    Environment = var.environment
  }
}

# Update App Runner service to use VPC connector if provided
resource "aws_apprunner_service" "app_with_vpc" {
  count = length(var.vpc_subnets) > 0 ? 1 : 0

  service_name = "${var.project_name}-service"

  source_configuration {
    image_repository {
      image_configuration {
        port = var.app_port
        runtime_environment_variables = var.environment_variables
      }
      image_identifier      = "${aws_ecr_repository.app.repository_url}:latest"
      image_repository_type = "ECR"
    }
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.app[0].arn
    }
  }

  health_check_configuration {
    healthy_threshold   = 2
    interval            = 5
    path                = var.health_check_path
    protocol            = "HTTP"
    timeout             = 3
    unhealthy_threshold = 3
  }

  auto_scaling_configuration {
    max_concurrency = var.max_concurrency
    max_size        = var.max_size
    min_size        = var.min_size
  }

  tags = {
    Name        = "${var.project_name}-service"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}