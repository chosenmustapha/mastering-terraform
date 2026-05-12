

# Terraform Lifecycle Rules on AWS

## Overview

This project demonstrates how Terraform lifecycle rules are used to control infrastructure behavior during resource creation, modification, and deletion within AWS environments.

The infrastructure provisions a foundational AWS architecture including:

- Custom VPC
- Public Subnets across multiple Availability Zones
- Internet Gateway and Route Table
- Security Group
- RDS MySQL Database
- Launch Template
- Auto Scaling Group
- EC2 Instance

The primary objective of this project is to understand how Terraform lifecycle rules improve infrastructure reliability, prevent accidental outages, and provide safer resource management in real-world cloud environments.

---

# Architecture Components

| Resource | Purpose |
|---|---|
| VPC | Provides isolated network environment |
| Public Subnets | Hosts public-facing resources |
| Internet Gateway | Enables internet connectivity |
| Route Table | Routes outbound traffic |
| Security Group | Controls inbound and outbound traffic |
| RDS Instance | Managed MySQL database |
| Launch Template | Defines EC2 configuration |
| Auto Scaling Group | Maintains scalable compute capacity |
| EC2 Instance | Demonstrates lifecycle replacement behavior |

---

# Terraform Lifecycle Rules Demonstrated

## 1. `create_before_destroy`

### Purpose
Creates a replacement resource before destroying the existing resource.

### Why It Matters
Helps minimize downtime during infrastructure updates.

### Example

```hcl
resource "aws_security_group" "web_sg" {
  name   = "web_sg"
  vpc_id = aws_vpc.my_vpc.id

  lifecycle {
    create_before_destroy = true
  }
}
```

### Real-World Scenario
Useful for production resources where deleting first could interrupt running applications or services.

---

## 2. `prevent_destroy`

### Purpose
Protects critical infrastructure from accidental deletion.

### Why It Matters
Production databases and stateful resources should not be removed unintentionally.

### Example

```hcl
resource "aws_db_instance" "production" {

  lifecycle {
    prevent_destroy = true
  }
}
```

### Project Note
During testing, the configuration was temporarily changed to:

```hcl
prevent_destroy = false
```

This allowed the RDS instance to be destroyed after provisioning.

In production environments, enabling `prevent_destroy` is a critical safeguard against irreversible data loss and service disruption.

---

## 3. `ignore_changes`

### Purpose
Instructs Terraform to ignore updates to specific resource attributes.

### Why It Matters
Prevents Terraform from overwriting values managed dynamically outside Terraform.

### Example

```hcl
resource "aws_autoscaling_group" "web_asg" {

  lifecycle {
    ignore_changes = [desired_capacity]
  }
}
```

### Real-World Scenario
Auto Scaling Groups frequently adjust capacity automatically during workload spikes. Terraform should not continuously attempt to reset those runtime changes.

---

## 4. `replace_triggered_by`

### Purpose
Forces a resource replacement when another dependent resource changes.

### Why It Matters
Ensures infrastructure remains synchronized with dependent configuration updates.

### Example

```hcl
resource "aws_instance" "web" {

  lifecycle {
    replace_triggered_by = [aws_launch_template.web]
  }
}
```

### Real-World Scenario
If the Launch Template changes (AMI, instance type, user data, etc.), Terraform automatically replaces the EC2 instance so the updated configuration is fully applied.

---

# Project Structure

```bash
.
├── main.tf
├── provider.tf
├── variables.tf
```

| File | Description |
|---|---|
| `main.tf` | Core infrastructure resources and lifecycle rules |
| `provider.tf` | AWS provider configuration |
| `variables.tf` | Input variables used throughout the project |

---

# Prerequisites

Before deploying this project, ensure the following are installed and configured:

- Terraform
- AWS CLI
- AWS credentials configured locally

---

> Note: `prevent_destroy` must be set to `false` before Terraform can destroy the RDS instance.

---

# Key Takeaways

- Terraform lifecycle rules provide granular control over infrastructure behavior.
- They help reduce downtime and prevent destructive mistakes.
- Lifecycle management is essential when managing production-grade cloud infrastructure.
- Understanding lifecycle behavior improves reliability, scalability, and operational safety.

---

# Technologies Used

- Terraform
- AWS
- Amazon VPC
- EC2
- Auto Scaling Groups
- Launch Templates
- Amazon RDS
- Security Groups