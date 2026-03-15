import type { TerraformFile } from "./terraform";

/**
 * Mock Terraform files for development and fallback when endpoint is unavailable.
 * Replace with real API call when GET /projects/:projectId/terraform is ready.
 */
export const MOCK_TERRAFORM_FILES: TerraformFile[] = [
  {
    name: "main.tf",
    content: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_s3_bucket" "app_storage" {
  bucket = "my-app-storage-\${var.environment}"

  tags = {
    Name        = "App storage"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  versioning_configuration {
    status = "Enabled"
  }
}`,
    path: "/terraform/main.tf",
  },
  {
    name: "variables.tf",
    content: `variable "environment" {
  description = "Environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}`,
    path: "/terraform/variables.tf",
  },
];
