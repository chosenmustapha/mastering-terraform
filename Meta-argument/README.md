

# Terraform Meta-Arguments with AWS S3

## Overview

This project demonstrates how to use Terraform meta-arguments while provisioning AWS S3 buckets. The setup focuses on four commonly used meta-arguments:

- `count`
- `for_each`
- `provider`
- `depends_on`

The goal is to provide a practical understanding of how Terraform handles dynamic resource creation, provider configuration, and resource dependencies.

---

# Project Structure

```bash
.
├── main.tf
├── provider.tf
└── variables.tf
```

---

# Meta-Arguments Demonstrated

## `count`

The `count` meta-argument creates multiple instances of a resource using a numeric value.

### Example

```hcl
resource "aws_s3_bucket" "amz-s3-bucket" {
  count  = length(var.bucket_names)
  bucket = var.bucket_names[count.index]

  depends_on = [ aws_s3_bucket.amz-s3-bucket-map ]

  tags = var.tags
}
```

### Variable Used

```hcl
variable "bucket_names" {
  type = list(string)

  default = [
    "my-amz-aws-bucket-1",
    "my-amz-aws-bucket-2",
    "my-amz-aws-bucket-3"
  ]
}
```

Terraform creates one bucket for each item in the list using `count.index`.

---

## `for_each`

The `for_each` meta-argument creates resources from maps or sets.

### Example

```hcl
resource "aws_s3_bucket" "amz-s3-bucket-map" {
  for_each = var.bucket_names_map

  bucket = each.value
  tags   = var.tags
}
```

### Variable Used

```hcl
variable "bucket_names_map" {
  type = map(string)

  default = {
    bucket1 = "my-amz-aws-bucket-11"
    bucket2 = "my-amz-aws-bucket-22"
    bucket3 = "my-amz-aws-bucket-33"
  }
}
```

Terraform iterates through the map and creates one resource per entry using `each.value`.

---

## `provider`

The provider block configures Terraform to interact with AWS.

### Example

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

### Variable Used

```hcl
variable "aws_region" {
  default = "us-east-2"
}
```

This keeps the AWS region configurable and reusable.

---

## `depends_on`

The `depends_on` meta-argument explicitly defines resource dependencies.

### Example

```hcl
depends_on = [ aws_s3_bucket.amz-s3-bucket-map ]
```

This ensures the `for_each` buckets are created before the `count` buckets.

---

# Shared Tags

Common tags are applied using a reusable variable.

```hcl
variable "tags" {
  type = map(string)

  default = {
    Environment = "Dev"
    Owner       = "Mustapha"
  }
}
```

Applied with:

```hcl
tags = var.tags
```

---

# Prerequisites

- Terraform installed
- AWS CLI configured
- Valid AWS credentials

---

# Usage

## Initialize Terraform

```bash
terraform init
```

## Validate Configuration

```bash
terraform validate
```

## Preview Changes

```bash
terraform plan
```

## Deploy Resources

```bash
terraform apply
```

## Destroy Resources

```bash
terraform destroy
```

---

# Expected Outcome

Terraform will create:

- 3 S3 buckets using `count`
- 3 S3 buckets using `for_each`

All buckets will:

- Use the configured AWS region
- Include shared tags
- Respect the defined dependency order

---

# Learning Outcomes

This project helps demonstrate:

- Dynamic resource creation with `count`
- Iteration using `for_each`
- AWS provider configuration
- Explicit resource dependencies with `depends_on`

---
