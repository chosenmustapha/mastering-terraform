# AWS IAM Bulk User Provisioning with Terraform

A production-ready Terraform project that provisions IAM users, department groups, least-privilege policies, MFA enforcement, and assumable roles — driven entirely from a CSV file.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Remote State Backend](#remote-state-backend)
- [Configuration](#configuration)
- [The CSV File](#the-csv-file)
- [File Breakdown](#file-breakdown)
- [IAM Permission Model](#iam-permission-model)
- [Assumable Roles](#assumable-roles)
- [MFA Enforcement](#mfa-enforcement)
- [Deployment](#deployment)
- [Outputs](#outputs)
- [Day-2 Operations](#day-2-operations)
- [Security Considerations](#security-considerations)

---

## Problem Statement

Manually creating IAM users through the AWS Console is slow, inconsistent, and leaves no audit trail. This project treats your employee roster as infrastructure data — a CSV drives everything. The result is consistent, auditable, and scalable user provisioning where onboarding 1 or 100 employees costs the same effort.

---

## Architecture

```
users.csv ──► locals.tf (csvdecode + for loops)
                  │
                  ├──► users.tf      IAM users, group memberships, MFA policy
                  ├──► groups.tf     Department groups + company-wide group
                  ├──► policies.tf   Baseline + department-scoped policies
                  └──► roles.tf      Assumable roles for cross-department access
```

Three clean layers that never mix: **Data** (`users.csv`) → **Transform** (`locals.tf`) → **Resources** (`.tf` files).

---

## Project Structure

```
.
├── backend.tf        # S3 remote state
├── provider.tf       # AWS provider config
├── variables.tf      # Input variables
├── terraform.tfvars  # Variable overrides
├── locals.tf         # CSV parsing and data transformation
├── data.tf           # AWS account identity data source
├── users.tf          # IAM users, memberships, MFA enforcement
├── groups.tf         # IAM groups per department
├── policies.tf       # IAM policies (baseline + per department)
├── roles.tf          # Assumable IAM roles
├── outputs.tf        # Post-apply outputs
└── users.csv         # Single source of truth for all employees
```

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Terraform](https://developer.hashicorp.com/terraform/install) | `>= 1.10.0` | Required for native S3 locking |
| [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) | v2 | Required for auth |
| AWS Credentials | — | IAM admin permissions required |
| S3 Bucket | — | For remote state (see below) |

```bash
# Verify your setup
terraform -v && aws --version && aws sts get-caller-identity
```
---

## Remote State Backend

State is stored in S3 with native file locking (`use_lockfile`, Terraform `>= 1.10`).

**Create the bucket once before `terraform init`:**

```bash
aws s3api create-bucket \
  --bucket amazon-remote-s3-backend \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket amazon-remote-s3-backend \
  --versioning-configuration Status=Enabled

aws s3api put-public-access-block \
  --bucket amazon-remote-s3-backend \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

`backend.tf` configuration:

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
---

## Configuration

All values are defined in `variables.tf` and overridden in `terraform.tfvars`.

| Variable | Type | Default | Description |
|---|---|---|---|
| `region` | `string` | `"us-east-1"` | AWS deployment region |
| `company_name` | `string` | `"MyCompany"` | Used in resource names and IAM paths |
| `departments` | `list(string)` | `["engineering","product","sales","marketing","finance"]` | Valid department values |
| `password_policy` | `object` | See `variables.tf` | Account-wide password policy settings |

---

## The CSV File

`users.csv` is the only file you edit to manage employees.

```csv
username,department,job_title,email
alice.johnson,engineering,senior-engineer,alice.johnson@company.com
bob.smith,engineering,devops-engineer,bob.smith@company.com
carol.white,product,product-manager,carol.white@company.com
dan.brown,product,ux-designer,dan.brown@company.com
eve.davis,sales,sales-lead,eve.davis@company.com
frank.miller,sales,account-executive,frank.miller@company.com
grace.wilson,marketing,marketing-manager,grace.wilson@company.com
henry.moore,marketing,content-strategist,henry.moore@company.com
iris.taylor,finance,finance-analyst,iris.taylor@company.com
jack.anderson,finance,accountant,jack.anderson@company.com
```

| Column | Required | Notes |
|---|---|---|
| `username` | Yes | Becomes the IAM username. Must be unique. |
| `department` | Yes | Must match a value in `var.departments`. Drives group membership and permissions. |
| `job_title` | Yes | Stored as an IAM tag only. |
| `email` | Yes | Stored as an IAM tag only. |

> A typo in `department` will cause `terraform apply` to fail — it must exactly match a value in `var.departments`.

---

## File Breakdown

### `provider.tf`
Declares `hashicorp/aws ~> 6.0` and sets the region from `var.region`.

### `backend.tf`
Configures S3 remote state at `dev/terraform.tfstate` with encryption and file locking enabled.

### `variables.tf`
All input variables with types, descriptions, and defaults. Nothing is hardcoded in resource files.

### `locals.tf`
The transformation layer. `csvdecode()` parses the CSV into a list of maps. That list is re-keyed into `users_map` (a map keyed by username) for stable `for_each` iteration — row reordering in the CSV never causes resource replacement.

### `data.tf`
Pulls the current AWS account ID via `aws_caller_identity` so role trust policies are account-scoped without hardcoding.

### `users.tf`
- Sets the account-wide password policy
- Creates one `aws_iam_user` per CSV row via `for_each`
- Assigns each user to their department group and the company-wide group
- Attaches an inline MFA enforcement policy to every user

### `groups.tf`
Creates `MyCompany-all-users` (company-wide) and one group per department. Attaches the appropriate policy to each group.

### `policies.tf`
- **Baseline policy** — attached to all users: view own IAM info, personal S3 home folder access
- **Department policies** — one `aws_iam_policy` resource using `for_each` generates all five:

| Department | Key Permissions |
|---|---|
| `engineering` | EC2, VPC, ELB, Auto Scaling, S3 (scoped), CloudWatch, ECS, EKS, ECR |
| `product` | Read-only CloudWatch, EC2 Describe, Logs, S3 (scoped) |
| `sales` | S3 read/write (scoped), CloudWatch read-only |
| `marketing` | S3, CloudFront invalidation, SES |
| `finance` | Cost Explorer, Budgets, Billing read-only, S3 (scoped) |

### `roles.tf`
Three assumable roles, all requiring MFA. See [Assumable Roles](#assumable-roles).

### `outputs.tf`
Exposes created users, group ARNs, role ARNs, and department membership after apply.

---

## IAM Permission Model

```
┌────────────────────────────────────────┐
│         Inline Policy (per user)       │
│   MFA Enforcement — DENY everything   │
│   until MFA device is registered      │
└──────────────────┬─────────────────────┘
                   │ overrides
┌──────────────────▼─────────────────────┐
│      Group: MyCompany-all-users        │
│      Baseline Policy                   │
│      (own IAM info + personal S3)      │
└──────────────────┬─────────────────────┘
                   │ combined with
┌──────────────────▼─────────────────────┐
│      Group: MyCompany-{department}     │
│      Department Policy                 │
│      (scoped service permissions)      │
└────────────────────────────────────────┘
```

An explicit `Deny` always overrides any `Allow`. The MFA inline policy fires a `Deny` on all actions when MFA is absent — making device registration the mandatory first action for every new user.

---

## Assumable Roles

All roles require `aws:MultiFactorAuthPresent = true` in their trust policy conditions.

| Role | Who Can Assume | Permissions |
|---|---|---|
| `data-lake-reader` | Engineering, Product | S3 read, Glue metadata, Athena queries |
| `devops-access` | Engineering only | AWS `PowerUserAccess` |
| `billing-reader` | All users (with MFA) | AWS `job-function/Billing` read-only |

Users assume roles explicitly via `sts:AssumeRole`. Elevated permissions expire automatically when the session ends.

---

## MFA Enforcement

Every user gets an inline `MFAEnforcement` policy on creation. It blocks all AWS actions until a virtual MFA device is active, using a `NotAction` + `BoolIfExists` deny:

```json
{
  "Effect": "Deny",
  "NotAction": [
    "iam:CreateVirtualMFADevice",
    "iam:EnableMFADevice",
    "iam:GetUser",
    "iam:ListMFADevices",
    "iam:ListVirtualMFADevices",
    "iam:ResyncMFADevice",
    "iam:ChangePassword",
    "sts:GetSessionToken"
  ],
  "Resource": "*",
  "Condition": {
    "BoolIfExists": { "aws:MultiFactorAuthPresent": "false" }
  }
}
```

`BoolIfExists` (not `Bool`) is intentional — it also catches requests where the MFA context key is absent entirely, such as long-term access key usage.

**New user flow:** Sign in → blocked by MFA policy → register MFA device → sign in again with MFA code → full department permissions activate.

---

## Deployment

```bash
# 1. Clone the repo
git clone https://github.com/your-org/iam-user-provisioning.git
cd iam-user-provisioning

# 2. Configure credentials
aws configure

# 3. Initialize (connects to S3 backend, downloads provider)
terraform init

# 4. Review the plan
terraform plan

# 5. Apply
terraform apply
```

**Expected resources on a fresh apply (10-user CSV):**

| Resource | Count |
|---|---|
| `aws_iam_user` | 10 |
| `aws_iam_user_group_membership` | 10 |
| `aws_iam_user_policy` (MFA) | 10 |
| `aws_iam_group` | 6 |
| `aws_iam_group_policy_attachment` | 6 |
| `aws_iam_group_policy` | 3 |
| `aws_iam_policy` | 6 |
| `aws_iam_role` | 3 |
| `aws_iam_role_policy` | 1 |
| `aws_iam_role_policy_attachment` | 2 |
| `aws_iam_account_password_policy` | 1 |

---

## Outputs

```bash
terraform output created_users
terraform output department_groups
terraform output role_arns
terraform output users_by_department
```

---

## Day-2 Operations

**Add a user** — append a row to `users.csv`, then `terraform apply`.

**Remove a user** — delete their row from `users.csv`, then `terraform apply`.

> Revoke active sessions manually before applying a deletion. The `force_destroy = true` flag on `aws_iam_user` will remove the user even if they have active access keys.

**Add a department:**
1. Add the name to `var.departments` in `variables.tf`
2. Add a policy block for it in `policies.tf`
3. Add users in `users.csv` with the new department value
4. Run `terraform apply`

> Keep `users.csv` in version control. Every onboarding, offboarding, or transfer becomes a reviewable Git commit — a built-in HR audit trail.
---
