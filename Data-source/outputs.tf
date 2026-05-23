output "vpc_id" {
  value = data.aws_vpc.dev_vpc.id
}
output "vpc_tag" {
  value = data.aws_vpc.dev_vpc.tags["Name"]
}
output "subnet_tag" {
  value = data.aws_subnet.dev_subnets.tags["Name"]
}
output "subnet_ids" {
  value = data.aws_subnet.dev_subnets.id
}
output "ami_id" {
  value = data.aws_ami.ubuntu_26_04_arm64.id
}
output "aws_ami_architecture" {
  value = data.aws_ami.ubuntu_26_04_arm64.architecture
}

output "aws_instance_tag" {
  value = { for k, inst in aws_instance.my-ubuntu-vm : k => lookup(inst.tags, "Name", "") }
  description = "Map of instance key to the instance Name tag"
}
