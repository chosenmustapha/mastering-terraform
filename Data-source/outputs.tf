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

# Debug:
# output "subnet_map_public_ip_on_launch" {
#   value       = data.aws_subnet.dev_subnets.map_public_ip_on_launch
#   description = "true if instances launched in this subnet receive a public IP by default"
# }

output "subnet_public_or_private" {
  value       = data.aws_subnet.dev_subnets.map_public_ip_on_launch ? "public" : "private"
  description = "print'public' if map_public_ip_on_launch is true, otherwise 'private'"
}

output "subnet_az" {
  value = data.aws_subnet.dev_subnets.availability_zone
}

output "aws_instance_tag" {
  value = { for k, inst in aws_instance.my-ubuntu-vm : k => lookup(inst.tags, "Name", "") }
  description = "Map of instance key to the instance Name tag"
}
