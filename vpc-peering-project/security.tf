resource "aws_security_group" "east_sg" {
  provider = aws.East_region
  name     = "east-sg"
  vpc_id   = aws_vpc.east.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_public_ip]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "east-sg"
  }
}

resource "aws_security_group" "west_sg" {
  provider = aws.West_region
  name     = "west-sg"
  vpc_id   = aws_vpc.west.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_public_ip]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "west-sg"
  }
}
