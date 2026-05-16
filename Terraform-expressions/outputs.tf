output "instance_ids" {
  value = aws_instance.my_instance[*].id
}

output "security_groups_id" {
  value = aws_security_group.asg[*].id
}
