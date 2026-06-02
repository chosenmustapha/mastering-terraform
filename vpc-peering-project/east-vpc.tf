resource "aws_vpc" "east" {

  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "east-vpc"
  }
}