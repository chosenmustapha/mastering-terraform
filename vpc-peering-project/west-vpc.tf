resource "aws_vpc" "west" {

  provider = aws.West_region
  cidr_block = var.west_vpc_cidr

  tags = {
    Name = "west-vpc"
  }
}