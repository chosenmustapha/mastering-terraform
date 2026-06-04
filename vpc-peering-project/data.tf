data "aws_ami" "east_instance" {
  most_recent = true
  owners      = ["099720109477"]

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

data "aws_ami" "west_instance" {
  most_recent = true
  owners      = ["099720109477"]

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

data "aws_caller_identity" "current" {}