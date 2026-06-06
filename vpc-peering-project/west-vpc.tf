resource "aws_vpc" "west" {

  provider   = aws.West_region
  cidr_block = var.west_vpc_cidr

  tags = {
    Name = "west-vpc"
  }
}

resource "aws_internet_gateway" "west_igw" {
  provider = aws.West_region
  vpc_id   = aws_vpc.west.id

  tags = {
    Name = "west-igw"
  }
}

resource "aws_subnet" "west_subnet" {
  provider                = aws.West_region
  vpc_id                  = aws_vpc.west.id
  cidr_block              = "10.1.0.0/24"
  map_public_ip_on_launch = true
}

resource "aws_route_table" "west_route_table" {
  provider = aws.West_region
  vpc_id   = aws_vpc.west.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.west_igw.id
  }
}

resource "aws_route_table_association" "west_subnet_association" {
  provider       = aws.West_region
  subnet_id      = aws_subnet.west_subnet.id
  route_table_id = aws_route_table.west_route_table.id
}
