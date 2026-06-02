resource "aws_vpc" "east" {
  provider = aws.East_region
  cidr_block = var.east_vpc_cidr

  tags = {
    Name = "east-vpc"
  }
}