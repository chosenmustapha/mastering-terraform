output "east_public_ip" {
  value = aws_instance.east_instance.public_ip
}

output "west_public_ip" {
  value = aws_instance.west_instance.public_ip
}

output "east_private_ip" {
  value = aws_instance.east_instance.private_ip
}

output "west_private_ip" {
  value = aws_instance.west_instance.private_ip
}