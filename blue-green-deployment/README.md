# Blue/Green Deployment on AWS with Terraform

![Terraform](https://img.shields.io/badge/Terraform-%3E%3D1.5.0-7B42BC?logo=terraform)
![AWS Provider](https://img.shields.io/badge/AWS%20Provider-~%3E6.0-FF9900?logo=amazonaws)
![Ubuntu](https://img.shields.io/badge/Ubuntu-arm64-E95420?logo=ubuntu)
![Status](https://img.shields.io/badge/Status-Working-brightgreen)

## Table of Contents

- [Project Summary](#project-summary)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Infrastructure Breakdown](#infrastructure-breakdown)
  - [provider.tf](#providertf)
  - [backend.tf](#backendtf)
  - [variables.tf](#variablestf)
  - [main.tf](#maintf)
  - [outputs.tf](#outputstf)
  - [user_data scripts](#user_data-scripts)
- [Deployment Guide](#deployment-guide)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up Remote State Backend](#2-set-up-remote-state-backend)
  - [3. Configure Your Variables](#3-configure-your-variables)
  - [4. Deploy the Infrastructure](#4-deploy-the-infrastructure)
  - [5. Verify in the Browser](#5-verify-in-the-browser)
- [How the Traffic Switch Works](#how-the-traffic-switch-works)
  - [Promote Green to Live](#promote-green-to-live)
  - [Roll Back to Blue](#roll-back-to-blue)
- [Teardown](#teardown)
- [Key Concepts](#key-concepts)
- [Tech Stack](#tech-stack)

---

## Project Summary

This project demonstrates a **Blue/Green deployment pattern** on AWS, provisioned entirely with Terraform. Two web application environments — Blue (v1.0) and Green (v2.0) — run simultaneously behind an Application Load Balancer (ALB). A single Terraform variable controls which environment receives live user traffic. Switching between them requires no server restarts and produces zero downtime.

---

## The Problem

Traditional in-place deployments update a live server while it is serving users. During the update, the application is either down or in an unstable state. If the release contains a bug, rolling back requires re-deploying the previous version — which means more downtime on top of the original incident. In any serious production environment, this is unacceptable.

```
Traditional deploy:
Users → Server  ──► (updating... users get errors)
Rollback        ──► re-deploy old version ──► more downtime
```

---

## The Solution

Blue/Green deployment eliminates this problem by keeping two complete, independent environments running at all times. The ALB acts as a traffic switch — pointing at Blue (stable) while Green (new version) is being built and tested. Once Green passes validation, flipping traffic is a single command. If anything goes wrong, reverting is equally instant because Blue never stopped running.

```
Before switch:
Users → ALB ──► Blue (v1.0)  ← live traffic
                Green (v2.0) ← idle, being tested

After switch:
Users → ALB ──► Blue (v1.0)  ← idle, warm standby for rollback
                Green (v2.0) ← live traffic
```

---

## Architecture Overview

```
                     ┌────────────────────────────────────────────────┐
                     │               AWS VPC  10.0.0.0/16             │
                     │                                                │
Internet             │  ┌───────────────────────────────────────────┐ │
   │                 │  │       Application Load Balancer (ALB)     │ │
   ▼                 │  │              public-facing                │ │
  IGW  ─────────────►│  └───────────────────┬───────────────────────┘ │
                     │                      │                         │
                     │          ┌───────────▼───────────┐             │
                     │          │    ALB Listener :80   │             │
                     │          │ var.active_environment│             │
                     │          │    == "blue" ? ───────┼──────┐      │
                     │          └───────────────────────┘      │      │
                     │                    │                    │      │
                     │           ┌────────▼────────┐  ┌────────▼─────┐│
                     │           │  Target Group   │  │ Target Group ││
                     │           │     Blue TG     │  │   Green TG   ││
                     │           └────────┬────────┘  └──────┬───────┘│
                     │                    │                  │       │
                     │           ┌────────▼────────┐  ┌──────▼───────┐│
                     │           │   EC2: Blue     │  │  EC2: Green  ││
                     │           │    v1.0 app     │  │   v2.0 app   ││
                     │           │   Subnet-1/AZ-1 │  │ Subnet-2/AZ-2││
                     │           └─────────────────┘  └──────────────┘│
                     │                                                │
                     └────────────────────────────────────────────────┘

Remote State: S3 Bucket with S3 native locking (use_lockfile = true)
```

Both EC2 instances are **always running**. Only one Target Group receives live traffic at any given time, determined entirely by the `active_environment` variable.

---

## Project Structure

```
blue-green-deployment/
├── provider.tf           # Terraform version and AWS provider config
├── backend.tf            # S3 remote state backend
├── variables.tf          # All input variable declarations
├── terraform.tfvars      # Variable values — region, CIDRs, active env
├── main.tf               # All AWS resource definitions
├── outputs.tf            # Values printed to terminal after apply
├── user_data_blue.sh     # EC2 boot script — installs and serves Blue app
└── user_data_green.sh    # EC2 boot script — installs and serves Green app
```

---

## Prerequisites

Before you begin, ensure you have the following in place:

- **AWS Account** with programmatic access configured via `aws configure`
- **Terraform >= 1.5.0** — [install guide](https://developer.hashicorp.com/terraform/install)
- **AWS CLI** installed and authenticated
- An **S3 bucket** for remote state (see [Step 2](#2-set-up-remote-state-backend))
- IAM permissions to create: VPC, Subnets, EC2, ALB, Security Groups, S3

---

## Infrastructure Breakdown

### `provider.tf`

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

Declares the AWS provider and pins it to any `6.x` release. The region is driven by `var.region` rather than being hardcoded, keeping the project portable across AWS regions.

---

### `backend.tf`

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

Stores Terraform state remotely in S3 instead of on your local machine. Local state files are a liability in any team or CI/CD environment — they get lost, go stale, or cause conflicts if two people apply at the same time.

| Setting | Purpose |
|---|---|
| `bucket` | S3 bucket that holds the state file |
| `key` | Path within the bucket: `dev/terraform.tfstate` |
| `use_lockfile` | Prevents concurrent `apply` runs from corrupting state — uses S3 native locking, no DynamoDB required |
| `encrypt` | Encrypts the state file at rest with S3 server-side encryption |

> **Important:** The S3 bucket must exist before running `terraform init`. Terraform does not create the backend bucket for you. See [Step 2](#2-set-up-remote-state-backend) for setup commands.

---

### `variables.tf`

```hcl
variable "region" {
  description = "The AWS region to deploy resources in."
  type        = string
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
}

variable "public_subnet_cidr" {
  description = "List of CIDR blocks for public subnets (minimum 2 required for ALB)."
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t4g.micro"
}

variable "active_environment" {
  description = "The active environment receiving live traffic: 'blue' or 'green'."
  type        = string

  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "The active_environment variable must be either 'blue' or 'green'."
  }
}
```

All configurable inputs live here. The most critical is `active_environment` — it is the single variable that controls where the ALB sends traffic. The `validation` block rejects any value other than `"blue"` or `"green"` at `plan` time, before any AWS resources are touched.

`instance_type` defaults to `t4g.micro` — a Graviton (arm64) instance type that pairs with the arm64 Ubuntu AMI and is cost-effective for this workload.

---

### `main.tf`

The core of the project. Broken into sections below.

#### AMI Data Source

```hcl
data "aws_ami" "ubuntu_26_04_arm64" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["*26.04*", "*26.04 LTS*"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}
```

Rather than hardcoding an AMI ID (which is region-specific and becomes stale as new images are released), Terraform queries AWS for the latest matching Ubuntu AMI from Canonical's official account (`099720109477`). This keeps the code region-portable and always current.

---

#### VPC

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "blue-green-vpc" }
}
```

Creates the isolated network boundary for all resources. `enable_dns_hostnames` allows EC2 instances to receive human-readable DNS names — a requirement for ALB health checks and instance communication within the VPC.

---

#### Public Subnets

```hcl
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidr)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "public-subnet-${count.index + 1}" }
}
```

`count` dynamically creates one subnet per CIDR in the input list (two by default). Each is placed in a different Availability Zone — ALBs require at least two AZs for fault tolerance. `map_public_ip_on_launch = true` ensures EC2 instances automatically receive a public IP on boot without needing to assign one manually.

---

#### Internet Gateway & Route Table

```hcl
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```

The Internet Gateway is the VPC's connection to the public internet. Without it, the ALB is unreachable and EC2 instances cannot pull packages during boot. The route table rule (`0.0.0.0/0 → IGW`) tells the VPC to send all outbound traffic through it. The association applies this rule to both public subnets.

---

#### Security Groups

Two security groups implement a defence-in-depth chain:

```
Internet ──(port 80)──► ALB Security Group ──(port 80)──► EC2 Security Group ──► EC2
```

```hcl
# ALB: accepts inbound HTTP from the internet
resource "aws_security_group" "alb" {
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2: only accepts inbound from the ALB security group — not from the raw internet
resource "aws_security_group" "ec2" {
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

The EC2 security group's ingress references the ALB security group ID — not a CIDR range. This means even if someone discovers a public IP for your EC2 instance, direct connections are blocked at the security group layer. All traffic must enter through the ALB.

---

#### Target Groups

```hcl
resource "aws_lb_target_group" "blue" {
  name     = "blue-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}
```

A Target Group is a named pool of servers. The ALB routes traffic to a Target Group, which forwards it to registered instances. One is created for Blue and one for Green.

The `health_check` block defines how the ALB monitors instance health. Every 30 seconds it sends `GET /` to each registered instance. Two consecutive `200 OK` responses mark the instance **healthy** and eligible for traffic. Three consecutive failures mark it **unhealthy** and remove it from rotation — automatically, without manual intervention.

---

#### Application Load Balancer & Listener

```hcl
resource "aws_lb" "main" {
  name               = "blue-green-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = var.active_environment == "blue" ?
      aws_lb_target_group.blue.arn :
      aws_lb_target_group.green.arn
  }
}
```

The listener is the brain of the entire switch. The ternary expression evaluates `var.active_environment` and forwards traffic to either the Blue or Green Target Group accordingly. This is the **only resource that changes** when you promote or roll back — no servers restart, no configuration is reapplied to EC2, no downtime occurs.

---

#### EC2 Instances & Target Group Attachments

```hcl
resource "aws_instance" "blue" {
  ami                    = data.aws_ami.ubuntu_26_04_arm64.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  user_data              = file("user_data_blue.sh")

  tags = { Name = "blue-instance" }
}

resource "aws_lb_target_group_attachment" "blue" {
  target_group_arn = aws_lb_target_group.blue.arn
  target_id        = aws_instance.blue.id
  port             = 80
}
```

One EC2 instance per environment, each in a different subnet and AZ. The `user_data` script runs once on first boot — it installs Apache and writes the app HTML. `vpc_security_group_ids` is the correct argument for attaching security groups to EC2 instances inside a VPC (not `security_groups`, which is for the deprecated EC2-Classic platform).

`aws_lb_target_group_attachment` registers each instance into its corresponding Target Group, completing the routing chain: ALB → Listener → Target Group → EC2.

---

### `outputs.tf`

After `terraform apply` completes, these values are printed to your terminal:

| Output | Description |
|---|---|
| `alb_dns_name` | The public URL — open this in your browser |
| `active_environment` | Which environment is currently receiving live traffic |
| `blue_instance_id` | EC2 instance ID for the Blue server |
| `green_instance_id` | EC2 instance ID for the Green server |
| `blue_target_group_arn` | ARN of the Blue Target Group |
| `green_target_group_arn` | ARN of the Green Target Group |

---

### `user_data` Scripts

Both scripts follow the same structure — the only difference is the HTML content written to `/var/www/html/index.html`.

```bash
#!/bin/bash
sudo apt update -y
sudo apt install -y apache2        # Ubuntu package name (not httpd)
sudo systemctl start apache2
sudo systemctl enable apache2      # Persists Apache across reboots

cat > /var/www/html/index.html << 'EOF'
  <!-- app HTML written here -->
EOF

sudo systemctl restart apache2
```

`systemctl enable apache2` ensures the web server survives a reboot. Without it, a restarted instance would pass health checks from the OS being up but fail to serve HTTP — causing the ALB to mark it unhealthy.

> **Note:** Ubuntu uses `apt` and the package name `apache2`. Amazon Linux uses `yum` and `httpd`. Mixing these will silently fail during boot and result in a 502 from the ALB.

---

## Deployment Guide

### 1. Clone the Repository

```bash
git clone https://github.com/chosenmustapha/mastering-terraform.git
cd mastering-terraform/blue-green-deployment
```

### 2. Set Up Remote State Backend

The S3 bucket referenced in `backend.tf` must exist before running `terraform init`. Create it with versioning and encryption enabled:

```bash
# Create the bucket
aws s3api create-bucket \
  --bucket amazon-remote-s3-backend \
  --region us-east-1

# Enable versioning — allows recovery of previous state files
aws s3api put-bucket-versioning \
  --bucket amazon-remote-s3-backend \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket amazon-remote-s3-backend \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 3. Configure Your Variables

Open `terraform.tfvars` and confirm the values:

```hcl
region             = "us-east-1"
vpc_cidr           = "10.0.0.0/16"
public_subnet_cidr = ["10.0.1.0/24", "10.0.2.0/24"]
active_environment = "blue"
```

### 4. Deploy the Infrastructure

```bash
# Download the AWS provider and connect to the S3 backend
terraform init

# Preview all resources Terraform will create — no changes are made
terraform plan -var="active_environment=blue"

# Deploy — type 'yes' when prompted
terraform apply -var="active_environment=blue"
```

After a successful apply, Terraform prints your outputs:

```
Outputs:

alb_dns_name       = "blue-green-alb-1234567890.us-east-1.elb.amazonaws.com"
active_environment = "blue"
blue_instance_id   = "i-0abc123def456"
green_instance_id  = "i-0def456abc789"
```

### 5. Verify in the Browser

Open the `alb_dns_name` value in your browser:

```
http://blue-green-alb-1234567890.us-east-1.elb.amazonaws.com
```

> **Note:** Allow 2–3 minutes after apply before the page loads. The EC2 instance needs time to boot, run the `user_data` script (installing Apache), and pass two consecutive ALB health checks. You can monitor readiness in the AWS Console under **EC2 → Target Groups → blue-tg → Targets** — wait for the status to show **healthy**.

To verify from your terminal:

```bash
curl http://$(terraform output -raw alb_dns_name)
```

A `200 OK` response returning the Blue app HTML confirms the full chain is working: EC2 → Target Group → ALB.

---

## How the Traffic Switch Works

This is the core workflow the project is designed to demonstrate. A single variable change is all it takes — Terraform plans exactly one resource modification (the ALB listener's `target_group_arn`) and applies it in seconds.

### Promote Green to Live

Green (v2.0) has been tested and is ready for production:

```bash
terraform apply -var="active_environment=green"
```

Terraform will show a plan with exactly one change: the ALB listener's target group updating from Blue to Green. Confirm with `yes`. Reload the ALB URL — you will now see the Green app.

### Roll Back to Blue

An issue has been found in Green. Revert immediately:

```bash
terraform apply -var="active_environment=blue"
```

Blue was never stopped. The rollback is instant — no re-deployment, no downtime, no rebuilding.

---

## Teardown

To destroy all AWS resources and stop incurring charges:

```bash
terraform destroy -var="active_environment=blue"
```

> **Note:** The S3 backend bucket is intentionally **not** managed by this Terraform configuration — destroying it would remove the state file needed to track and destroy everything else. Once `terraform destroy` completes and all resources are confirmed gone, you can delete the bucket manually:
>
> ```bash
> aws s3 rb s3://amazon-remote-s3-backend --force
> ```

---

## Key Concepts

| Concept | What it means in this project |
|---|---|
| **Blue Environment** | The stable, currently live application (v1.0) |
| **Green Environment** | The new version under test, ready to promote (v2.0) |
| **Target Group** | A named pool of EC2 instances the ALB can route to |
| **ALB Listener** | The forwarding rule that points to a Target Group — this is the switch |
| **`active_environment`** | The single Terraform variable that controls all traffic routing |
| **`user_data`** | EC2 boot script — installs Apache and writes the app HTML on first launch |
| **Health Check** | ALB heartbeat — instances only receive traffic when returning `200 OK` |
| **Remote State** | Terraform state in S3 — shared, versioned, and encrypted |
| **S3 Native Locking** | `use_lockfile = true` prevents concurrent `apply` runs corrupting state |
| **`vpc_security_group_ids`** | The correct EC2 argument for security groups inside a VPC |

---

## Tech Stack

| Tool | Version | Role |
|---|---|---|
| Terraform | >= 1.5.0 | Infrastructure as Code |
| AWS Provider | ~> 6.0 | Terraform AWS plugin |
| Amazon VPC | — | Isolated private network |
| AWS ALB | — | Traffic routing and health checks |
| AWS EC2 Graviton | t4g.micro | Application servers (arm64) |
| Ubuntu Linux | arm64 | Operating system on EC2 |
| Apache2 | latest | Web server |
| AWS S3 | — | Remote state backend with native locking |