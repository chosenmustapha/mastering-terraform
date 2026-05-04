# Terraform Complex Variables Demo

This project provisions a simple AWS infrastructure while intentionally focusing on demonstrating how to work with complex variable types in Terraform. Instead of just spinning up resources, the goal here is to show how different data structures like lists, tuples, maps, sets, and objects can be defined and used effectively in a real configuration.

At a high level, this setup:
- Creates a VPC with a custom CIDR block  
- Provisions a security group with ingress and egress rules  
- Dynamically creates subnets across multiple availability zones  
- Launches EC2 instances distributed across those subnets  

## Project Structure

```
.
├── provider.tf
├── variables.tf
├── main.tf
```

## Provider Configuration

The `provider.tf` file defines AWS as the provider and pins it to version `~> 6.0`. The region is not hardcoded. It is passed in as a variable:

```hcl
provider "aws" {
  region = var.aws_region
}
```

This is a simple example of using a primitive type (`string`) as an input variable.

## Complex Variables in Use

The main focus of this project lives in `variables.tf`. Below is a breakdown of each complex data type and how it is used in `main.tf`.

### 1. List (`list(string)`)

```hcl
variable "instance_type" {
  type    = list(string)
  default = ["t1.micro", "t2.micro", "t3.micro"]
}
```

How it is used:

```hcl
instance_type = var.instance_type[2]
```

This selects a specific instance type (`t3.micro`) from the list. It demonstrates how lists allow ordered access through indexing.

### 2. Tuple

Ingress rules tuple:

```hcl
variable "ingress_rules" {
  type    = tuple([number, string, number])
  default = [443, "tcp", 443]
}
```

Usage:

```hcl
from_port   = var.ingress_rules[0]
ip_protocol = var.ingress_rules[1]
to_port     = var.ingress_rules[2]
```

Egress rules tuple:

```hcl
variable "egress_rules" {
  type    = tuple([string, string])
  default = ["0.0.0.0/0", "-1"]
}
```

Usage:

```hcl
cidr_ipv4   = var.egress_rules[0]
ip_protocol = var.egress_rules[1]
```

Tuples are useful when the structure is fixed and positional meaning matters. Each index represents a specific part of a rule.

### 3. Map (`map(string)`)

```hcl
variable "tags" {
  type = map(string)
}
```

Usage:

```hcl
resource "aws_vpc" "my-vpc" {
  cidr_block = var.cidr_block
  tags       = var.tags
}
```

Maps are ideal for key value data like tags. This keeps tagging flexible and reusable across resources.

### 4. Object

```hcl
variable "instance_tags" {
  type = object({
    Name        = string
    environment = string
    owner       = string
  })
}
```

Usage:

```hcl
tags = var.instance_tags
```

Objects enforce a structured schema, which helps keep tagging consistent.

### 5. Set (`set(string)`)

```hcl
variable "availability_zone" {
  type = set(string)
}
```

Sets are unordered collections of unique values.

Usage in EC2 instances:

```hcl
for_each = var.availability_zone
```

Each availability zone results in one EC2 instance, ensuring no duplicates.

### 6. Locals and Derived Map

```hcl
locals {
  az_map = { for idx, az in tolist(var.availability_zone) : az => idx }
}
```

This converts the set into a map where:
- Key is the availability zone  
- Value is the index  

Usage in subnet creation:

```hcl
for_each = local.az_map

cidr_block        = cidrsubnet(var.cidr_block, 8, each.value)
availability_zone = each.key
```

This pattern allows you to:
- Use `each.key` for the availability zone name  
- Use `each.value` as a deterministic index for subnet calculation  

## Resources Created

### VPC

```hcl
resource "aws_vpc" "my-vpc" {
  cidr_block = var.cidr_block
  tags       = var.tags
}
```

### Security Group

Allows TLS (443) within the VPC and allows all outbound traffic.

### Subnets

Created dynamically using:

```hcl
for_each = local.az_map
```

Each subnet belongs to the VPC, gets a calculated CIDR block, and is tied to a specific availability zone.

### EC2 Instances

```hcl
for_each = var.availability_zone
```

Each instance is deployed in a different availability zone, attached to the corresponding subnet, uses a shared security group, and applies structured tags from the object variable.

## How to Run

```bash
terraform init
terraform plan
terraform apply
```

## Final Thoughts

This setup is intentionally simple from an infrastructure perspective, but it highlights how powerful Terraform becomes when you start modeling your inputs properly. Once you are comfortable with these data types, writing scalable and reusable configurations becomes much easier.
