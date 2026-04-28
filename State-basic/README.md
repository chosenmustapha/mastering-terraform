# ☁️Terraform AWS Remote State with S3 (State-Basic)

This project demonstrates a foundational yet production-relevant Terraform setup that provisions AWS infrastructure while securely managing state using an **S3 remote backend with native locking**.
It builds on basic Terraform workflows by introducing **remote state management**, which is essential for real-world cloud environments where security, consistency, and collaboration matter.

---

## 🚀 Project Summary

This configuration:
- Provisions a basic AWS VPC
- Stores Terraform state remotely in an S3 bucket
- Uses **native S3 locking (`use_lockfile`)** to prevent concurrent modifications
- Encrypts state at rest for improved security

This setup reflects how Terraform is used in modern AWS environments — **simple, secure, and scalable without unnecessary dependencies like DynamoDB**.

---

## 📦 Project Structure

```
.
├── main.tf
└── README.md
```

---

## 🧩 Terraform Configuration Breakdown

Below is the exact configuration used in this project:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }  
  
  backend "s3" {
    bucket = "amzn-remote-s3-backend"
    key    = "dev/terraform.tfstate"
    region = "us-east-2"
    use_lockfile = true
    encrypt = true
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

### 1. Terraform Block (Providers + Backend)

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }  
  
  backend "s3" {
    bucket = "amzn-remote-s3-backend"
    key    = "dev/terraform.tfstate"
    region = "us-east-2"
    use_lockfile = true
    encrypt = true
  }
}
```

**Explanation:**

- `required_providers`  
  - Specifies the AWS provider source (`hashicorp/aws`)  
  - Uses version constraint `~> 6.0` to allow safe minor updates  

- `backend "s3"`  
  - Configures remote state storage in AWS S3  

  Key settings:
  - `bucket`: S3 bucket storing Terraform state  
  - `key`: Path inside the bucket (`dev/terraform.tfstate`)  
  - `region`: Bucket location (`us-east-2`)  
  - `encrypt = true`: Ensures state is encrypted at rest  
  - `use_lockfile = true`: Enables **native state locking**

Terraform creates and manages a `.tflock` file in S3 to prevent concurrent modifications to the state.

---

### 2. AWS Provider

```hcl
provider "aws" {
  region = "us-east-2"
}
```

**Explanation:**

- Declares AWS as the cloud provider  
- Uses credentials configured via AWS CLI  
- Ensures all resources are deployed in `us-east-2`  

---

### 3. VPC Resource

```hcl
resource "aws_vpc" "my_vpc" {
  cidr_block = "10.0.0.0/16"
}
```

**Explanation:**

- Creates a Virtual Private Cloud (VPC)  
- `aws_vpc`: resource type  
- `my_vpc`: internal Terraform identifier  
- `cidr_block`: defines the IP address range for the network  

---

## ⚙️ Terraform Workflow

### Initialize

```bash
terraform init
```

- Downloads provider plugins  
- Connects to S3 backend  
- Prepares remote state and locking  

---

### Plan

```bash
terraform plan
```
- Shows what Terraform will create before applying  

---

### Apply

```bash
terraform apply
```

- Provisions the VPC in AWS  
- Stores state securely in S3  
- Locks state during execution  

---

### Destroy

```bash
terraform destroy
```

- Removes all managed infrastructure  
- Prevents unnecessary AWS costs  

---

## 🔐 Key Design Decisions

### Remote State in S3

- Eliminates reliance on local state files  
- Enables collaboration and consistency  
- Provides durability and availability via AWS  

### Native Locking (`use_lockfile`)

- Replaces legacy DynamoDB locking  
- Prevents concurrent Terraform runs  
- Reduces infrastructure overhead  

### Encryption Enabled

- Protects sensitive state data at rest  
- Aligns with AWS security best practices  

---

## 📌 Important Notes

- Ensure your S3 bucket already exists before running `terraform init`  
- Enable **bucket versioning** for additional protection against accidental state loss   
---
