resource "aws_vpc" "central" {
  provider   = aws.Canada_region
  cidr_block = var.canada_vpc_cidr

  tags = {
    Name = "central-vpc"
  }
}

resource "aws_internet_gateway" "central_igw" {

  provider = aws.Canada_region
  vpc_id   = aws_vpc.central.id

  tags = {
    Name = "central-igw"
  }
}

resource "aws_subnet" "central_subnet" {

  provider                = aws.Canada_region
  vpc_id                  = aws_vpc.central.id
  cidr_block              = "10.2.0.0/24"
  map_public_ip_on_launch = true
  tags = {
    Name = "central-subnet"
  }
}

resource "aws_route_table" "central_route_table" {

  provider = aws.Canada_region
  vpc_id   = aws_vpc.central.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.central_igw.id
  }
}

resource "aws_route_table_association" "central_subnet_association" {

  provider       = aws.Canada_region
  subnet_id      = aws_subnet.central_subnet.id
  route_table_id = aws_route_table.central_route_table.id
}

