resource "aws_instance" "east_instance" {
  provider               = aws.East_region
  ami                    = data.aws_ami.east_instance.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.east_subnet.id
  #security_groups        = [aws_security_group.east_sg.name]
  key_name               = aws_key_pair.east_key_pair.key_name
  vpc_security_group_ids = [aws_security_group.east_sg.id]
  tags = {
    Name = "east-instance"
  }
}

resource "aws_instance" "west_instance" {
  provider               = aws.West_region
  ami                    = data.aws_ami.west_instance.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.west_subnet.id
  #security_groups        = [aws_security_group.west_sg.name]
  key_name               = aws_key_pair.west_key_pair.key_name
  vpc_security_group_ids = [aws_security_group.west_sg.id]

  tags = {
    Name = "west-instance"
  }
}