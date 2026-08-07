# Terraform Provisioner Lab: EC2 Bootstrap and Deployment Validation Pipeline

![Terraform](https://img.shields.io/badge/terraform-%3E%3D1.10-623CE4?logo=terraform&logoColor=white)
![AWS Provider](https://img.shields.io/badge/aws--provider-~%3E6.0-FF9900?logo=amazonaws&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

A self-contained AWS project demonstrating Terraform's three active provisioners (`file`, `remote-exec`, `local-exec`) working together with EC2, S3, IAM, CloudWatch, and SNS to bootstrap a web server, validate the deployment over HTTP, and notify on both successful deploys and instance decommissioning.

## What this demonstrates

- Using `file` and `remote-exec` provisioners to configure an EC2 instance with values that only exist after other resources are created (a CloudWatch log group name)
- Using `local-exec` for post-deploy validation that runs from the operator's machine, not the instance
- The `self`-only reference restriction on destroy-time provisioners, and a working pattern (instance tags) for passing data through it
- `terraform_data` with `triggers_replace` for orchestrating a provisioner that isn't tied to a single resource's lifecycle
- Least-privilege IAM via an instance profile instead of embedded credentials
- S3 native state locking (`use_lockfile`), no DynamoDB table required

## Architecture

```
Local machine (terraform apply / destroy)
        │
        ├─ creates ▶ EC2 instance ──┬─ file provisioner (SSH)       → pushes CloudWatch agent config
        │                            ├─ remote-exec provisioner (SSH) → installs nginx, pulls S3 artifact, starts services
        │                            └─ local-exec (destroy only)    → publishes decommission notice to SNS
        │
        ├─ creates ▶ S3 bucket (artifacts)     ◀── pulled by remote-exec
        ├─ creates ▶ CloudWatch log group       ◀── shipped to by CloudWatch agent
        ├─ creates ▶ SNS topic + email subscription
        ├─ creates ▶ IAM role + instance profile → attached to EC2, grants S3 read + CloudWatch agent permissions
        │
        └─ terraform_data.post_deploy_check
                 └─ local-exec: curl the instance over HTTP → publish success/failure to SNS
```

## Key concepts

| Concept | What it does |
|---|---|
| `file` provisioner | Renders a CloudWatch agent config with a value from a resource that didn't exist until apply, pushes it to the instance over SSH |
| `remote-exec` provisioner | SSHes into the instance to install nginx and the CloudWatch agent, pull the app artifact from S3, and start both services |
| `local-exec` (create-time) | Runs on the operator's machine. Health-checks the instance over HTTP and publishes the result to SNS |
| `local-exec` (destroy-time) | Runs before the instance is torn down. Restricted to `self` references only, so the SNS topic ARN is read back from an instance tag rather than referenced directly |
| `terraform_data` + `triggers_replace` | Orchestrates a provisioner that belongs to the deployment as a whole, not to any one resource, and re-runs it whenever the instance is replaced |

## Project structure

```
.
├── backend.tf                   # S3 remote state, native locking
├── provider.tf                  # required_providers + AWS provider
├── variables.tf
├── terraform.tfvars.example     # copy to terraform.tfvars and fill in your own values
├── data.tf                      # default VPC, subnet, latest AL2023 AMI, caller identity
├── keypair.tf                   # generates an SSH key pair in-line, no console setup needed
├── security_groups.tf
├── iam.tf                       # EC2 instance role: S3 read + CloudWatchAgentServerPolicy
├── s3.tf                        # artifact bucket + the "app" it serves
├── sns.tf                       # deploy notification topic + email subscription
├── cloudwatch.tf                # log group the agent ships nginx access logs to
├── locals.tf                    # deterministic SNS topic ARN, built without depending on the resource
├── ec2.tf                       # the instance and its three provisioners
├── validation.tf                # post-deploy HTTP health check
├── outputs.tf
└── templates/
    └── cwagent.json.tftpl       # CloudWatch agent config, rendered with the real log group name
```

## Prerequisites

- Terraform >= 1.10 (required for `use_lockfile` native S3 state locking)
- AWS CLI configured with credentials that can create EC2, IAM, S3, SNS, and CloudWatch resources
- An existing S3 bucket for remote state (update the `bucket` value in `backend.tf`)
- Your public IP address, for the SSH security group rule

## Setup

Clone the repository:

```bash
git clone https://github.com/chosenmustapha/mastering-terraform.git
cd tf-provisioner
```

Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your own values:

```hcl
project_name       = "your-project-name"
availability_zone  = "us-east-1a"
instance_type      = "t3.micro"
allowed_ssh_cidr   = "YOUR.IP.HERE/32"
notification_email = "you@example.com"
```

`terraform.tfvars` is gitignored on purpose. It contains a real IP and email address and should never be committed.

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

AWS emails an SNS subscription confirmation to `notification_email` as soon as the topic exists. Confirm it before the deploy finishes, or the first "deployment succeeded" notification won't reach you.

Once apply completes:

```bash
terraform output instance_public_ip
```

Visit that IP in a browser to see the page nginx is serving, or check your inbox for the SNS health-check result.

## Cleanup

```bash
terraform destroy
```

This fires the destroy-time provisioner, which publishes a decommission notice to the same SNS topic before the instance is removed.

## Why it's built this way

**Destroy-time provisioners can only reference `self`.** Terraform won't let a `when = destroy` provisioner reference another managed resource's attributes, because it can't guarantee that resource still exists by the time destroy runs. The SNS topic ARN is needed at destroy time, so it gets written into an instance tag (`DecommissionTopicArn`) when the instance is created, and read back with `self.tags.DecommissionTopicArn` at destroy time. That satisfies the restriction while still getting the real ARN to the notification command.

**t3 instances default to unlimited CPU credits.** Left unset, a t3.micro can burst past its baseline and bill for the overage. `credit_specification { cpu_credits = "standard" }` caps it at the free baseline instead.

**Subnet selection is pinned, not assumed.** `data.aws_subnets.default` can return subnets in any order, so relying on `.ids[0]` isn't deterministic across accounts or regions. Filtering by a specific `availability_zone` variable makes the subnet choice explicit.

**Every provisioner declares its own `connection` block.** SSH context is scoped to the provisioner that needs it rather than inherited from the resource level, so each one is self-contained and easy to read in isolation.

## Security notes

- SSH is restricted to a single `/32` CIDR, never `0.0.0.0/0`.
- The EC2 instance role is scoped to read-only access on its own artifact bucket, plus the AWS-managed `CloudWatchAgentServerPolicy`. No broader permissions.
- No AWS credentials are embedded anywhere. The instance authenticates to S3 and CloudWatch through its instance profile.
