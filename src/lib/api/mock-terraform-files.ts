

import type { TerraformFilesResponse } from "./terraform";

export const MOCK_TERRAFORM_FILES: TerraformFilesResponse = {
  project_id: "mock-project-id",
  files: {
    "main.tf": `terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "acme-commerce-tfstate-\${var.environment}"
    key            = "platform/terraform.tfstate"
    region         = var.aws_region
    dynamodb_table = "acme-commerce-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "acme-commerce"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "storefront" {
  source = "./modules/storefront"
  # ... storefront config
}

module "admin_portal" {
  source = "./modules/admin-portal"
  # ... admin config
}

module "checkout_service" {
  source = "./modules/checkout"
  # ... checkout config
}
`,

    "variables.tf": `variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project identifier"
  type        = string
  default     = "acme-commerce"
}

variable "storefront_domain" {
  description = "Storefront public domain"
  type        = string
}

variable "admin_domain" {
  description = "Admin portal domain"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class for Aurora PostgreSQL"
  type        = string
  default     = "db.r6g.large"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "enable_observability" {
  description = "Enable X-Ray, CloudWatch dashboards"
  type        = bool
  default     = true
}
`,

    "outputs.tf": `output "storefront_url" {
  description = "Storefront CloudFront URL"
  value       = module.storefront.cloudfront_url
}

output "admin_portal_url" {
  description = "Admin portal URL"
  value       = module.admin_portal.alb_dns_name
}

output "api_gateway_endpoint" {
  description = "API Gateway REST endpoint"
  value       = module.api_gateway.invoke_url
}

output "aurora_cluster_endpoint" {
  description = "Aurora PostgreSQL writer endpoint"
  value       = module.database.aurora_endpoint
  sensitive   = true
}

output "elasticache_redis_endpoint" {
  description = "Redis cluster configuration endpoint"
  value       = module.cache.redis_endpoint
  sensitive   = true
}

output "s3_assets_bucket" {
  description = "S3 bucket for product images and static assets"
  value       = module.storage.assets_bucket_name
}
`,

    "network.tf": `# VPC and networking for Acme Commerce platform

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "\${var.project_name}-\${var.environment}-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-\${var.environment}-public-\${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index + 3)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.project_name}-\${var.environment}-private-\${count.index + 1}"
  }
}

resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index + 6)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.project_name}-\${var.environment}-db-\${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "\${var.project_name}-\${var.environment}-nat"
  }
}
`,

    "compute.tf": `# ECS Fargate for storefront, admin, and API services

module "storefront_ecs" {
  source = "./modules/ecs-service"

  service_name     = "storefront"
  cluster_name     = aws_ecs_cluster.main.name
  desired_count    = var.environment == "prod" ? 4 : 2
  container_image  = "\${aws_ecr_repository.storefront.repository_url}:latest"
  container_port   = 3000
  subnets          = aws_subnet.private[*].id
  security_groups  = [aws_security_group.storefront.id]
  alb_target_group = aws_lb_target_group.storefront.arn
}

module "admin_portal_ecs" {
  source = "./modules/ecs-service"

  service_name     = "admin-portal"
  cluster_name     = aws_ecs_cluster.main.name
  desired_count    = var.environment == "prod" ? 2 : 1
  container_image  = "\${aws_ecr_repository.admin.repository_url}:latest"
  container_port   = 8080
  subnets          = aws_subnet.private[*].id
  security_groups = [aws_security_group.admin.id]
  alb_target_group = aws_lb_target_group.admin.arn
}

module "catalog_api_ecs" {
  source = "./modules/ecs-service"

  service_name     = "catalog-api"
  cluster_name     = aws_ecs_cluster.main.name
  desired_count    = var.environment == "prod" ? 6 : 2
  container_image  = "\${aws_ecr_repository.catalog_api.repository_url}:latest"
  container_port   = 8000
  subnets          = aws_subnet.private[*].id
  security_groups  = [aws_security_group.catalog_api.id]
  alb_target_group = aws_lb_target_group.catalog_api.arn
}

module "checkout_api_ecs" {
  source = "./modules/ecs-service"

  service_name     = "checkout-api"
  cluster_name     = aws_ecs_cluster.main.name
  desired_count    = var.environment == "prod" ? 4 : 2
  container_image  = "\${aws_ecr_repository.checkout_api.repository_url}:latest"
  container_port   = 8000
  subnets          = aws_subnet.private[*].id
  security_groups  = [aws_security_group.checkout_api.id]
  alb_target_group = aws_lb_target_group.checkout_api.arn
}

module "auth_service_ecs" {
  source = "./modules/ecs-service"

  service_name     = "auth-service"
  cluster_name     = aws_ecs_cluster.main.name
  desired_count    = var.environment == "prod" ? 3 : 1
  container_image  = "\${aws_ecr_repository.auth.repository_url}:latest"
  container_port   = 8080
  subnets          = aws_subnet.private[*].id
  security_groups  = [aws_security_group.auth.id]
  alb_target_group = aws_lb_target_group.auth.arn
}
`,

    "database.tf": `# Aurora PostgreSQL for catalog, orders, inventory

module "aurora_postgres" {
  source = "./modules/aurora-postgres"

  cluster_identifier = "\${var.project_name}-\${var.environment}-aurora"
  instance_class     = var.db_instance_class
  engine_version     = "15.4"
  database_name      = "acme_commerce"
  master_username    = "platform_admin"
  subnets            = aws_subnet.database[*].id
  security_groups    = [aws_security_group.database.id]
}

# Separate schemas for bounded contexts
resource "aws_db_parameter_group" "catalog" {
  family = "aurora-postgresql15"
  name   = "\${var.project_name}-\${var.environment}-catalog-params"

  parameter {
    name  = "log_statement"
    value = "all"
  }
}

# Read replica for catalog search (read-heavy)
resource "aws_rds_cluster_instance" "catalog_replica" {
  count              = var.environment == "prod" ? 2 : 0
  identifier         = "\${var.project_name}-\${var.environment}-catalog-replica-\${count.index}"
  cluster_identifier = module.aurora_postgres.cluster_id
  instance_class     = var.db_instance_class
  engine             = module.aurora_postgres.engine
  engine_version     = module.aurora_postgres.engine_version
}
`,

    "cache.tf": `# ElastiCache Redis for sessions, catalog cache, rate limiting

module "redis_cluster" {
  source = "./modules/elasticache-redis"

  cluster_id         = "\${var.project_name}-\${var.environment}-redis"
  node_type          = var.redis_node_type
  num_cache_clusters = var.environment == "prod" ? 6 : 3
  subnets            = aws_subnet.private[*].id
  security_groups   = [aws_security_group.redis.id]
}

# Separate Redis for session store (different eviction policy)
resource "aws_elasticache_parameter_group" "sessions" {
  family = "redis7"
  name   = "\${var.project_name}-\${var.environment}-sessions"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }
}

# Redis for search index cache
resource "aws_elasticache_parameter_group" "search_cache" {
  family = "redis7"
  name   = "\${var.project_name}-\${var.environment}-search-cache"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
}
`,

    "storage.tf": `# S3 for product images, static assets, order exports

module "assets_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = "\${var.project_name}-\${var.environment}-assets"
  versioning  = true
  cdn_origin  = true
}

module "order_exports_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = "\${var.project_name}-\${var.environment}-order-exports"
  versioning  = false
  lifecycle_rules = [
    {
      id      = "expire-temp"
      enabled = true
      expiration_days = 7
    }
  ]
}

# SQS queues for async processing
resource "aws_sqs_queue" "order_events" {
  name                       = "\${var.project_name}-\${var.environment}-order-events"
  visibility_timeout_seconds  = 300
  message_retention_seconds   = 1209600
  receive_wait_time_seconds   = 20
}

resource "aws_sqs_queue" "notification_dispatch" {
  name                       = "\${var.project_name}-\${var.environment}-notifications"
  visibility_timeout_seconds  = 60
}

resource "aws_sqs_queue" "inventory_updates" {
  name                       = "\${var.project_name}-\${var.environment}-inventory"
  visibility_timeout_seconds  = 120
}
`,

    "observability.tf": `# CloudWatch, X-Ray, dashboards for Acme Commerce

module "observability" {
  source = "./modules/observability"
  count  = var.enable_observability ? 1 : 0

  project_name = var.project_name
  environment   = var.environment
}

resource "aws_cloudwatch_log_group" "storefront" {
  name              = "/ecs/\${var.project_name}/\${var.environment}/storefront"
  retention_in_days = var.environment == "prod" ? 30 : 7
}

resource "aws_cloudwatch_log_group" "catalog_api" {
  name              = "/ecs/\${var.project_name}/\${var.environment}/catalog-api"
  retention_in_days = var.environment == "prod" ? 30 : 7
}

resource "aws_cloudwatch_log_group" "checkout_api" {
  name              = "/ecs/\${var.project_name}/\${var.environment}/checkout-api"
  retention_in_days = var.environment == "prod" ? 90 : 7
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "\${var.project_name}-\${var.environment}-high-errors"
  comparison_operator  = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
}
`,

    "security.tf": `# IAM roles, KMS, WAF, secrets

resource "aws_kms_key" "secrets" {
  description             = "KMS key for Acme Commerce secrets"
  deletion_window_in_days  = 30
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name       = "\${var.project_name}/\${var.environment}/aurora"
  kms_key_id = aws_kms_key.secrets.arn
}

resource "aws_secretsmanager_secret" "payment_gateway" {
  name       = "\${var.project_name}/\${var.environment}/payment-gateway"
  kms_key_id = aws_kms_key.secrets.arn
}

module "waf" {
  source = "./modules/waf"

  name_prefix = "\${var.project_name}-\${var.environment}"
  alb_arn     = aws_lb.main.arn
}

# IAM role for ECS task execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "\${var.project_name}-\${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}
`,
  },
};
