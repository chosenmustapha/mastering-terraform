
data "aws_vpc" "dev_vpc" {
  filter {
    name   = "tag:Name"
    values = ["my-default-vpc"]
  }
}

data "aws_subnet" "dev_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.dev_vpc.id]
  }
  filter {
    name   = "tag:Name"
    values = ["df-subnet-az-us-east-1a"]
  }
}


# Canonical Ubuntu 26.04 LTS (arm64)
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

