resource "aws_vpc" "east" {
  provider   = aws.East_region
  cidr_block = var.east_vpc_cidr

  tags = {
    Name = "east-vpc"
  }
}

resource "aws_internet_gateway" "east_igw" {
  provider = aws.East_region
  vpc_id   = aws_vpc.east.id

  tags = {
    Name = "east-igw"
  }
}

resource "aws_subnet" "east_subnet" {
  provider                = aws.East_region
  vpc_id                  = aws_vpc.east.id
  cidr_block              = "10.0.0.0/24"
  map_public_ip_on_launch = true
}

resource "aws_route_table" "east_route_table" {
  provider = aws.East_region
  vpc_id   = aws_vpc.east.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.east_igw.id
  }
}

resource "aws_route_table_association" "east_subnet_association" {
  provider       = aws.East_region
  subnet_id      = aws_subnet.east_subnet.id
  route_table_id = aws_route_table.east_route_table.id
}