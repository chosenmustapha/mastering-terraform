resource "aws_instance" "my-ubuntu-vm" {
  
  ami           = data.aws_ami.ubuntu_26_04_arm64.id
  instance_type = var.instance_type
  subnet_id     = data.aws_subnet.dev_subnets.id
  
  tags = {
    Name = "My Ubuntu VM"
  }
}