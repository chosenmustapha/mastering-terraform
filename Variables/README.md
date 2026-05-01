# Terraform Variables (Primitive Types) – Project Walkthrough

## Project Overview

This project demonstrates how primitive variable types in Terraform are used in a practical setup. The goal is to avoid hardcoding values and instead rely on variables, locals, and structured configuration.

The configuration provisions an AWS VPC while illustrating:

- How `string` variables are defined and used
- How Terraform shares variables across multiple files
- How locals help organize reusable values
- Why backend configuration cannot use variables

---

## Project Structure

```
.
├── README.md
├── backend.tf
├── locals.tf
├── main.tf
├── output.tf
├── provider.tf
├── terraform.tfstate
├── terraform.tfstate.backup
└── variables.tf
```

Terraform reads all `.tf` files in this directory as a single configuration. The separation is purely for clarity and organization.

---

## Variables (variables.tf)

```
variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "us-east-2"
}
```

These variables define inputs to the configuration. Both use the `string` primitive type.

Key points:
- Variables are declared once and used everywhere
- Defaults allow Terraform to run without additional input
- Terraform also supports `number` and `bool`, though this project focuses on `string`

---

## Using Variables Across Files

Variables are automatically available across all files in the same directory.

From `main.tf`:

```
resource "aws_vpc" "my_vpc" {
  cidr_block = var.vpc_cidr
  tags       = local.tags_used
}
```

From `provider.tf`:

```
provider "aws" {
  region = var.aws_region
}
```

There is no need to import or reference files manually. Terraform loads everything together.

---

## Locals (locals.tf)

```
locals {
  tags_used = {
    Environment = "dev"
    Project     = "terraform-variables"
    Owner       = "mustapha"
  }
}
```

Locals define reusable values within the configuration.

They are useful for:
- Avoiding repetition
- Keeping resource definitions clean
- Maintaining consistency (e.g., tagging)

---

## Provider Configuration (provider.tf)

```
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

The AWS provider uses the `aws_region` variable, showing how variables can control provider configuration.

---

## Backend Configuration (backend.tf)

```
terraform {
  backend "s3" {
    bucket       = "amzn-remote-s3-backend"
    key          = "dev/terraform.tfstate"
    region       = "us-east-2"
    use_lockfile = true
    encrypt      = true
  }
}
```

This stores Terraform state remotely in S3, which is important for collaboration and state management.

---

## Why Variables Cannot Be Used in the Backend

The following will not work:

```
bucket = var.bucket_name
```

Terraform initializes in this order:

1. Backend configuration
2. State loading
3. Variable evaluation

Because the backend is initialized first, variables are not yet available. For this reason, backend values must be hardcoded or passed in through external configuration.

---

## Resource Definition (main.tf)

```
resource "aws_vpc" "my_vpc" {
  cidr_block = var.vpc_cidr
  tags       = local.tags_used
}
```

This is where variables and locals come together:
- `var.vpc_cidr` controls the network range
- `local.tags_used` applies consistent tagging

---

## Outputs (output.tf)

```
output "vpc_id" {
  description = "The ID of the created VPC"
  value       = aws_vpc.my_vpc.id
}
```

Outputs expose useful information after deployment. In this case, the VPC ID.

---

## How Everything Fits Together

The overall flow:

1. Define inputs in `variables.tf`
2. Use variables in `provider.tf` and `main.tf`
3. Define reusable values in `locals.tf`
4. Create resources in `main.tf`
5. Expose results in `output.tf`
6. Store state remotely using `backend.tf`

---

## Why This Structure Is Used

Separating files by purpose helps:

- Improve readability
- Keep responsibilities clear
- Make the project easier to extend

This structure becomes more valuable as projects grow.

---

## Key Takeaways

- Terraform primitive types include `string`, `number`, and `bool`
- This project uses `string` variables to control infrastructure behavior
- Variables are globally accessible within the configuration
- Locals simplify repeated values
- Backend configuration cannot use variables due to initialization order

---

## Final Note

This project is intentionally simple but reflects a core Terraform pattern:

inputs → configuration → resource creation → outputs

Understanding this pattern is essential before moving on to more advanced Terraform concepts.