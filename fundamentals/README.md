# 🌍 Terraform AWS Fundamentals

This project demonstrates a simple Terraform setup using the AWS provider.  
It walks through configuring Terraform, connecting to AWS, and provisioning a basic resource (a VPC).

---

## 🚀 Prerequisites

### 1. Install AWS CLI

Download from the official site: https://aws.amazon.com/cli/

On macOS (using Homebrew):

```bash
brew install awscli
```

Verify installation:

```bash
aws --version
```

---

### 2. Configure AWS Credentials

There are two approaches:

- ❌ Root user (not recommended)
- ✅ IAM user (recommended)

#### Steps (IAM User):

1. Go to AWS Console  
2. Navigate to **IAM → Users**  
3. Create a new user  
4. Attach a policy:
   - For learning: `AdministratorAccess`  
5. Go to **Security Credentials**  
6. Create an **Access Key**  
7. Save the credentials securely  

---

### 3. Configure AWS CLI

Run:

```bash
aws configure
```

Enter:
- Access Key ID  
- Secret Access Key  
- Region (e.g., `us-east-2`)  
- Output format (`json`)  

---

## 📦 Project Structure

```
.
├── main.tf
└── README.md
```

---

## 🧠 Understanding `main.tf`

Below is the configuration used in this project:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-east-2"
}

# Create a VPC
resource "aws_vpc" "my_vpc" {
  cidr_block = "10.0.0.0/16"
}
```

---

## 🔍 Breakdown

### 1. Terraform Block

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

- Defines required providers  
- `source`: where Terraform downloads the provider (`hashicorp/aws`)  
- `version`: `~> 6.0` allows updates within version 6.x but prevents breaking changes from 7.x  

---

### 2. AWS Provider Block

```hcl
provider "aws" {
  region = "us-east-2"
}
```

- Specifies AWS as the cloud provider  
- Sets the region where resources will be created (`us-east-2`)  
- Uses credentials configured via `aws configure`  

---

### 3. VPC Resource

```hcl
resource "aws_vpc" "my_vpc" {
  cidr_block = "10.0.0.0/16"
}
```

- Creates a Virtual Private Cloud (VPC) in AWS  
- `aws_vpc`: resource type  
- `my_vpc`: resource name (local to Terraform)  
- `cidr_block`: defines the IP address range for the VPC  

---

## ⚙️ Terraform Workflow

### 1. Initialize Terraform

```bash
terraform init
```

- Downloads AWS provider plugins  
- Prepares the working directory  

---

### 2. Preview Changes

```bash
terraform plan
```

- Shows what Terraform will create before applying  

---

### 3. Apply Configuration

```bash
terraform apply
```

- Provisions the VPC in AWS  

---

### 4. Destroy Infrastructure

```bash
terraform destroy
```

- Deletes the VPC  
- Prevents unnecessary AWS charges  

---

## 🔒 Security Best Practices

Add this to your `.gitignore`:

```gitignore
# Terraform state files
*.tfstate
*.tfstate.backup
.terraform.lock.hcl

# Terraform directory
**/.terraform/*

# Variable files (may contain secrets)
*.tfvars
*.tfvars.json

# Logs
crash.log
*.log
```

---

## 📌 Notes

- Never commit `.tfstate` files — they may contain sensitive data  
- Use IAM users instead of root credentials  
- Follow least-privilege access in real-world environments  
- Always destroy resources when done experimenting  

---

## 📚 Learn More

- Terraform Registry: https://registry.terraform.io  
- AWS VPC Docs: https://docs.aws.amazon.com/vpc/  

---