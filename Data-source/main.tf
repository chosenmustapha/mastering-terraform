resource "aws_instance" "my-ubuntu-vm" {
  for_each = local.ec2_instances

  ami           = data.aws_ami.ubuntu_26_04_arm64.id
  instance_type = each.value.type
  subnet_id     = data.aws_subnet.dev_subnets.id

  tags = {
    Name = each.value.name
  }
}