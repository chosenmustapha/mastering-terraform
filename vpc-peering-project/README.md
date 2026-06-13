# Multi-Region VPC Peering with Terraform

This project uses Terraform to provision a **full-mesh VPC peering network** across three AWS regions — `us-east-1` (East), `us-west-1` (West), and `ca-central-1` (Central) — within a single AWS account. Three isolated VPCs, each in a separate region and CIDR range, are interconnected via cross-region VPC peering connections so that EC2 instances in any VPC can communicate with instances in the other two using **private IP addresses only** — no traffic traverses the public internet.

The infrastructure is fully automated with Terraform: VPCs, subnets, internet gateways, route tables, peering connections, security groups, key pairs, and EC2 instances are all provisioned in a single `terraform apply`. Connectivity is validated end-to-end by SSHing into any instance and pinging the private IPs of instances in the other two regions.

**What this demonstrates:** multi-region Terraform provider aliasing, the cross-region peering requester/accepter pattern, full-mesh bidirectional routing, scoped security group design, dynamic AMI resolution, and remote state management with S3 native locking.

---

## Architecture

![Three-Region VPC Peering Diagram](./assets/three_vpc_peering_drawio.png)

| VPC | Region | CIDR Block | Public Subnet |
|---|---|---|---|
| east-vpc | `us-east-1` | `10.0.0.0/16` | `10.0.0.0/24` |
| west-vpc | `us-west-1` | `10.1.0.0/16` | `10.1.0.0/24` |
| central-vpc | `ca-central-1` | `10.2.0.0/16` | `10.2.0.0/24` |

### Peering Connections

Three peering connections create a full mesh — every VPC can reach every other VPC directly:

- **east ↔ west** (`us-east-1` ↔ `us-west-1`)
- **east ↔ central** (`us-east-1` ↔ `ca-central-1`)
- **west ↔ central** (`us-west-1` ↔ `ca-central-1`)

Each connection uses the requester/accepter resource split required for cross-region peering, with explicit bidirectional route entries injected into all three route tables.

---

## Project Structure

```
vpc-peering/
├── provider.tf          # Three aliased AWS providers (one per region)
├── backend.tf           # Remote S3 backend with state locking and encryption
├── variables.tf         # Input variable declarations
├── terraform.tfvars     # Variable values (regions, CIDRs, instance type, home IP)
├── east-vpc.tf          # VPC, subnet, IGW, route table — us-east-1
├── west-vpc.tf          # VPC, subnet, IGW, route table — us-west-1
├── central-vpc.tf       # VPC, subnet, IGW, route table — ca-central-1
├── peering.tf           # All three peering connections (requester + accepter)
├── routing.tf           # Bidirectional peering routes across all three VPCs
├── security.tf          # Security groups — SSH (home IP only), ICMP (peer VPC CIDRs only)
├── data.tf              # AMI data sources per region + caller identity lookup
├── keypair.tf           # EC2 key pairs registered in each region
├── ec2.tf               # EC2 instances — one per VPC/region
└── outputs.tf           # Public and private IPs for all three instances
```

---

## Key Design Decisions

**Multi-provider aliasing** — Three aliased `aws` providers (one per region) are declared in a single root module. This avoids the overhead of child modules or workspaces while keeping region-specific resources cleanly separated.

**Cross-region peering requester/accepter split** — AWS requires that cross-region peering connections be accepted by a separate resource in the peer region (`aws_vpc_peering_connection_accepter`). Each of the three connections is therefore split across two Terraform resources, with `depends_on` ensuring routes are only written after the accepter is active.

**Full-mesh bidirectional routing** — Six `aws_route` resources (two per peering connection) are written to ensure traffic flows symmetrically in both directions across all three VPCs. Missing even one route would break connectivity in one direction.

**Scoped security groups** — SSH (port 22) is restricted to a single home IP via `var.my_public_ip`. ICMP is permitted only from the CIDR blocks of the two peer VPCs — not from the internet. Egress is unrestricted.

**Dynamic AMI resolution** — `data "aws_ami"` sources query Canonical's owner ID (`099720109477`) per region for the latest Ubuntu 26.04 LTS ARM64 HVM EBS image. This ensures the most current AMI is always used without hardcoding region-specific AMI IDs.

**ARM64 + Graviton2** — All instances use `t4g.micro`, pairing the ARM64 AMI with AWS's Graviton2 processor for lower cost and better price-performance on lightweight workloads.

**Remote state with S3 native locking** — Terraform state is stored in S3 with `use_lockfile = true` (Terraform 1.10+), providing state locking without a DynamoDB table. Server-side encryption is enabled on the bucket.

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.10
- AWS CLI configured with credentials that have IAM permissions for VPC, EC2, and S3
- An SSH key pair at `~/.ssh/my-aws-key` (private key) and `~/.ssh/my-aws-key.pub` (public key)
- An existing S3 bucket for Terraform remote state

---

## Deployment

### 1. Clone the repository

```bash
git clone https://github.com/chosenmustapha/mastering-terraform.git
cd mastering-terraform/vpc-peering
```

### 2. Update `terraform.tfvars`

Replace `my_public_ip` with your own public IP address in CIDR notation:

```hcl
east_region     = "us-east-1"
west_region     = "us-west-1"
canada_region   = "ca-central-1"
east_vpc_cidr   = "10.0.0.0/16"
west_vpc_cidr   = "10.1.0.0/16"
canada_vpc_cidr = "10.2.0.0/16"
my_public_ip    = "YOUR.PUBLIC.IP/32"   # replace with your IP
instance_type   = "t4g.micro"
```

> Run `curl -4 ifconfig.me` to find your current public IP v4.

### 3. Update `backend.tf`

Replace the bucket name with your own S3 bucket:

```hcl
terraform {
  backend "s3" {
    bucket       = "your-terraform-state-bucket"
    key          = "dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
```

### 4. Confirm your SSH key exists

```bash
ls ~/.ssh/my-aws-key.pub
```

If it does not exist, generate one:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/my-aws-key -C "vpc-peering-project"
```

### 5. Initialize, plan, and apply

```bash
terraform init
terraform plan
terraform apply
```

Type `yes` when prompted. Terraform will provision all three VPCs, peering connections, route tables, security groups, and EC2 instances in a single pass.

---

## Verifying Connectivity

Once `apply` completes, Terraform outputs the public and private IPs of all three instances.

SSH into any instance:

```bash
ssh -i ~/.ssh/my-aws-key ubuntu@<east_public_ip>
```

From inside the instance, ping the private IPs of the other two:

```bash
ping <west_private_ip>
ping <central_private_ip>
```

Successful ICMP replies confirm that peering, routing, and security group rules are all functioning correctly across regions.

---

## Outputs

| Output | Description |
|---|---|
| `east_public_ip` | Public IP of the east EC2 instance |
| `east_private_ip` | Private IP of the east EC2 instance |
| `west_public_ip` | Public IP of the west EC2 instance |
| `west_private_ip` | Private IP of the west EC2 instance |
| `central_public_ip` | Public IP of the central EC2 instance |
| `central_private_ip` | Private IP of the central EC2 instance |

---

## Teardown

To destroy all resources and avoid ongoing AWS charges:

```bash
terraform destroy
```

---

## Concepts Demonstrated

- Multi-region Terraform deployments with aliased providers
- Cross-region VPC peering using the requester/accepter resource pattern
- Full-mesh bidirectional route table configuration across three VPCs
- Dynamic per-region AMI resolution using Terraform `data` sources
- Principle of least privilege in security group ingress rules
- Remote Terraform state with S3 native locking (`use_lockfile`) and encryption
- ARM64/Graviton2 instance targeting for cost efficiency

---
