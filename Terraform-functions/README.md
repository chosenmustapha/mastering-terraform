

# Terraform Functions Mini Project

## Overview

This project demonstrates how Terraform built-in functions can simplify Infrastructure as Code (IaC) by making configurations more dynamic, reusable, and easier to maintain.

The primary goal of this project is to explore practical Terraform functions commonly used in real-world infrastructure deployments. These functions help reduce repetitive code, improve readability, enforce naming standards, and create scalable Terraform configurations.

Rather than attempting to cover every available Terraform function, this project focuses on foundational functions that are frequently used in day-to-day DevOps and cloud engineering workflows.

---

# Technologies Used

- Terraform
- AWS Provider
- Amazon EC2
- Amazon S3
- AWS IAM

---

# Project Structure

```bash
.
├── backend.tf
├── provider.tf
├── variables.tf
├── main.tf
└── outputs.tf
```

---

# Core Concepts Covered

This project demonstrates how Terraform built-in functions can be used to create cleaner and more maintainable infrastructure configurations.

The project covers:

- String manipulation
- Collection and map handling
- Conditional expressions
- Type conversion
- Iteration and loops
- Network calculations
- Local values
- Dynamic naming conventions

---

# Terraform Functions Demonstrated

## 1. `format()`

### Purpose

The `format()` function creates formatted strings using placeholders.

### Example

```hcl
bucket = lower(format("%s-%s-bucket", var.environment, var.project_name))
```

### Example Output

```bash
dev-myproject-bucket
```

### Use Case

Useful for enforcing standardized naming conventions across infrastructure resources.

---

## 2. `lower()`

### Purpose

The `lower()` function converts strings to lowercase.

### Example

```hcl
lower(format("%s-%s-bucket", var.environment, var.project_name))
```

### Use Case

Helps ensure naming compliance for resources such as Amazon S3 buckets, which require lowercase names.

---

## 3. `join()`

### Purpose

The `join()` function combines list elements into a single string using a separator.

### Example

```hcl
Name = join("-", [var.project_name, var.environment, "web"])
```

### Example Output

```bash
myproject-dev-web
```

### Use Case

Commonly used for dynamic resource naming and tagging strategies.

---

## 4. `replace()`

### Purpose

The `replace()` function replaces characters or substrings inside a string.

### Example

```hcl
name = replace(var.function_name, "_", "-")
```

### Example Output

```bash
my-lambda-function-role
```

### Use Case

Useful for sanitizing resource names to meet cloud provider naming requirements.

---

## 5. `merge()`

### Purpose

The `merge()` function combines multiple maps into a single map.

### Example

```hcl
all_tags = merge(
  { ManagedBy = "Mustapha" },
  { Environment = var.environment }
)
```

### Example Output

```hcl
{
  ManagedBy  = "Mustapha"
  Environment = "dev"
}
```

### Use Case

Helps standardize tagging across infrastructure resources.

---

## 6. `cidrsubnet()`

### Purpose

The `cidrsubnet()` function calculates subnet CIDR ranges from a larger CIDR block.

### Example

```hcl
subnets = [
  for i in range(3) : cidrsubnet(local.vpc_cidr, 8, i)
]
```

### Example Output

```bash
10.0.0.0/24
10.0.1.0/24
10.0.2.0/24
```

### Use Case

Useful for automating subnet calculations and reducing manual networking configuration.

---

## 7. `range()`

### Purpose

The `range()` function generates a sequence of numbers.

### Example

```hcl
range(3)
```

### Example Output

```bash
0, 1, 2
```

### Use Case

Frequently used with loops and iterative resource creation.

---

## 8. Conditional Expressions

### Purpose

Terraform conditional expressions provide simple if/else logic.

### Example

```hcl
instance_type = var.environment == "prod" ? "t3.large" : "t3.micro"
```

### Use Case

Allows infrastructure behavior to dynamically change based on deployment environments.

---

## 9. `lookup()`

### Purpose

The `lookup()` function safely retrieves values from a map.

### Example

```hcl
lookup(
  { dev = "1", prod = "3" },
  var.environment,
  "1"
)
```

### Use Case

Provides safe access to map values while allowing default fallback values.

---

## 10. `tonumber()`

### Purpose

The `tonumber()` function converts values into numeric types.

### Example

```hcl
instance_count = tonumber(lookup(
  { dev = "1", prod = "3" },
  var.environment,
  "1"
))
```

### Use Case

Useful when working with numeric values stored as strings.

---

## 11. `for` Expressions

### Purpose

Terraform `for` expressions enable dynamic list creation through iteration.

### Example

```hcl
server_names = [
  for i in range(local.instance_count) :
  "${local.server_name}-${i + 1}"
]
```

### Example Output

```bash
myproject-dev-server-1
myproject-dev-server-2
myproject-dev-server-3
```

### Use Case

Helps generate scalable and reusable infrastructure configurations with minimal repetition.

---

# Local Values

## Purpose

Local values centralize reusable expressions and computed values within Terraform configurations.

### Example

```hcl
locals {
  server_name = lower(join("-", [var.project_name, var.environment, "server"]))
}
```

## Benefits

- Improves readability
- Reduces duplication
- Simplifies configuration management
- Encourages reusable logic

---

# Outputs

This project also demonstrates Terraform outputs for exposing computed values and generated configurations.

### Outputs Included

- Generated server names
- Calculated subnet ranges
- Merged tags
- Dynamic instance counts
- Computed instance types

Outputs improve visibility into Terraform-generated values and help validate infrastructure logic.

---

# AWS Resources Used

The following AWS resources are included as examples for applying Terraform functions in practical infrastructure configurations:

- Amazon S3 Bucket
- Amazon EC2 Instance
- AWS IAM Role

---

# Summary

Terraform functions are essential for building scalable, maintainable, and production-ready Infrastructure as Code.

This project demonstrates how built-in functions can simplify common infrastructure tasks such as:

- Dynamic resource naming
- Conditional infrastructure logic
- Data transformation
- Tag standardization
- Network calculations
- Iterative configuration generation

Understanding these foundational functions is an important step toward writing more efficient and maintainable Terraform configurations.