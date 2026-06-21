# Terraform Expressions on AWS

## Overview

This project demonstrates how Terraform expressions can be used to build more dynamic, scalable, and maintainable infrastructure on AWS.

The infrastructure provisions:

- Multiple AWS EC2 instances
- A Security Group with dynamically generated ingress rules
- Remote Terraform state storage using an Amazon S3 backend

The primary goal of this project is to experiment with and understand three essential Terraform expression types:

1. Conditional Expressions
2. Dynamic Blocks
3. Splat Expressions

By implementing these expressions in real infrastructure configurations, this project showcases how Terraform can reduce repetition, improve flexibility, and simplify infrastructure management.

---

# Project Structure

```bash
.
├── backend.tf
├── provider.tf
├── main.tf
├── variables.tf
└── outputs.tf
```

---

# Technologies Used

- Terraform
- AWS EC2
- AWS Security Groups
- Amazon S3 Remote Backend

---

# Infrastructure Provisioned

## EC2 Instances

The project provisions multiple EC2 instances using the `count` meta-argument.

```hcl
resource "aws_instance" "my_instance" {
  count = var.instances_count
  ami   = "ami-0b75f821522bcff85"

  instance_type = var.environment[0] == "development" ? var.instance_type[1] : var.instance_type[0]

  tags = var.tags
}
```

### Key Features Demonstrated

- Resource scaling with `count`
- Dynamic instance type selection using conditional expressions
- Centralized resource tagging

---

## Security Group

The project provisions a Security Group with dynamically generated ingress rules.

```hcl
resource "aws_security_group" "asg" {
  name        = "my-security-group"
  description = "Security group for my instance using the default VPC"

  dynamic "ingress" {
    for_each = var.ingress_rules

    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }
}
```

### Key Features Demonstrated

- Dynamic nested block generation
- Iteration using `for_each`
- Reusable security group configuration

---

# Terraform Expressions Explained

## 1. Conditional Expressions

Conditional expressions evaluate a condition and return different values depending on whether the condition is true or false.

### Syntax

```hcl
condition ? true_value : false_value
```

### Implementation in This Project

```hcl
instance_type = var.environment[0] == "development" ? var.instance_type[1] : var.instance_type[0]
```

### Explanation

This expression checks whether the first value inside the `environment` variable list is equal to `development`.

- If true, Terraform selects:

```hcl
t3.micro
```

- Otherwise, Terraform selects:

```hcl
t2.micro
```

### Variables Used

```hcl
variable "environment" {
  type    = list(string)
  default = ["development", "production", "staging"]
}
```

```hcl
variable "instance_type" {
  type    = list(string)
  default = ["t2.micro", "t3.micro"]
}
```

---

## 2. Dynamic Blocks

Dynamic blocks allow Terraform to automatically generate repeated nested blocks from a list or map.

This helps eliminate repetitive code and improves configuration scalability.

### Implementation in This Project

```hcl
dynamic "ingress" {
  for_each = var.ingress_rules

  content {
    from_port   = ingress.value.from_port
    to_port     = ingress.value.to_port
    protocol    = ingress.value.protocol
    cidr_blocks = ingress.value.cidr_blocks
  }
}
```

### Explanation

Terraform loops through each object inside the `ingress_rules` variable and automatically creates a corresponding ingress rule.

### Variables Used

```hcl
variable "ingress_rules" {
  type = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
  }))

  default = [
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    },
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]
}
```

### Result

Terraform dynamically creates:

- HTTP ingress rule on port 80
- HTTPS ingress rule on port 443

without manually defining multiple ingress blocks.

---

## 3. Splat Expressions

Splat expressions are used to retrieve attributes from multiple resources and return them as a list.

### Syntax

```hcl
resource_type.resource_name[*].attribute
```

### Implementation in This Project

```hcl
output "instance_ids" {
  value = aws_instance.my_instance[*].id
}
```

### Explanation

Terraform retrieves the IDs of all EC2 instances created using:

```hcl
count = var.instances_count
```

and returns them as a list.

### Additional Example

```hcl
output "security_groups_id" {
  value = aws_security_group.asg[*].id
}
```

This retrieves the IDs of the created security groups.

---

# Remote Backend Configuration

This project uses an Amazon S3 backend for remote Terraform state management.

## backend.tf

```hcl
terraform {
  backend "s3" {
    bucket       = "amazon-remote-s3-backend"
    key          = "dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
```

## Benefits of Remote State Management

- Centralized Terraform state storage
- Improved team collaboration
- State file encryption
- State locking to prevent concurrent modifications

---

# Provider Configuration

## provider.tf

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
  region = var.region
}
```

---

# Variables

| Variable | Description |
|---|---|
| `region` | AWS deployment region |
| `tags` | Resource tags applied to EC2 instances |
| `instances_count` | Number of EC2 instances to provision |
| `ingress_rules` | Security group ingress rule definitions |
| `instance_type` | Available EC2 instance types |
| `environment` | Environment identifiers |

---

# Outputs

## EC2 Instance IDs

```hcl
output "instance_ids" {
  value = aws_instance.my_instance[*].id
}
```

Returns the IDs of all provisioned EC2 instances.

---

## Security Group IDs

```hcl
output "security_groups_id" {
  value = aws_security_group.asg[*].id
}
```

Returns the IDs of the created security groups.

---

# Prerequisites

Before running this project, ensure the following are installed and configured:

- Terraform
- AWS CLI
- AWS credentials
- Existing Amazon S3 bucket for Terraform backend storage

---

# Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/chosenmustapha/mastering-terraform.git
cd Terraform-expressions
```

---

## 2. Initialize Terraform

```bash
terraform init
```

This command:

- Downloads required providers
- Initializes the S3 backend
- Prepares the working directory

---

## 3. Validate the Configuration

```bash
terraform validate
```

---

## 4. Review the Execution Plan

```bash
terraform plan
```

---

## 5. Deploy the Infrastructure

```bash
terraform apply
```

Type:

```bash
yes
```

when prompted.

---

# Destroy Infrastructure

To remove all provisioned resources:

```bash
terraform destroy
```

---

# Key Takeaways

This project demonstrates how Terraform expressions can improve infrastructure-as-code by making configurations:

- More dynamic
- More reusable
- Easier to scale
- Easier to maintain
- Less repetitive
---
