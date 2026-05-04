
resource "aws_vpc" "my-vpc" {
  cidr_block = var.cidr_block
  tags       = var.tags
}

resource "aws_security_group" "allow_tls" {
  name        = "allow_tls"
  description = "Allow TLS inbound traffic and all outbound traffic"
  vpc_id      = aws_vpc.my-vpc.id

  tags = {
    Name = "allow_tls"
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_tls_ipv4" {
  security_group_id = aws_security_group.allow_tls.id
  cidr_ipv4         = aws_vpc.my-vpc.cidr_block
  from_port         = var.ingress_rules[0]
  ip_protocol       = var.ingress_rules[1]
  to_port           = var.ingress_rules[2]
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv4" {
  security_group_id = aws_security_group.allow_tls.id
  cidr_ipv4         = var.egress_rules[0]
  ip_protocol       = var.egress_rules[1]
}

resource "aws_subnet" "main" {
  vpc_id            = aws_vpc.my-vpc.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, 1)  # e.g., 10.0.1.0/24
  availability_zone = "us-east-2a"
  
  tags = {
    Name = "main-subnet"
  }
}


resource "aws_instance" "my_ubuntu_ec2" {
  ami                    = "ami-0fe18bc3cfa53a248"
  instance_type          = var.instance_type[2]
  subnet_id              = aws_subnet.main.id                     
  vpc_security_group_ids = [aws_security_group.allow_tls.id]  
  tags                   = var.instance_tags
}
