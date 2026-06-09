
# east region AMI data source

data "aws_ami" "east_instance" {
  provider    = aws.East_region
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

# West region AMI data source
data "aws_ami" "west_instance" {
  provider    = aws.West_region
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


# Central region AMI data source
data "aws_ami" "central_instance" {
  provider    = aws.Canada_region
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