# EC2 instances for east region.
resource "aws_instance" "east_instance" {
  provider               = aws.East_region
  ami                    = data.aws_ami.east_instance.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.east_subnet.id
  key_name               = aws_key_pair.east_key_pair.key_name
  vpc_security_group_ids = [aws_security_group.east_sg.id]
  tags = {
    Name = "east-instance"
  }
}

# EC2 instances for west region.
resource "aws_instance" "west_instance" {
  provider               = aws.West_region
  ami                    = data.aws_ami.west_instance.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.west_subnet.id
  key_name               = aws_key_pair.west_key_pair.key_name
  vpc_security_group_ids = [aws_security_group.west_sg.id]

  tags = {
    Name = "west-instance"
  }
}

# EC2 instances for central region.
resource "aws_instance" "central_instance" {
  provider               = aws.Canada_region
  ami                    = data.aws_ami.central_instance.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.central_subnet.id
  key_name               = aws_key_pair.central_key_pair.key_name
  vpc_security_group_ids = [aws_security_group.central_sg.id]

  tags = {
    Name = "central-instance"
  }
}