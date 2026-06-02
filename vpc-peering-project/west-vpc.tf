resource "aws_vpc" "west" {

  cidr_block = "10.1.0.0/16"

  tags = {
    Name = "west-vpc"
  }
}