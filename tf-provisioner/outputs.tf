output "instance_public_ip" {
  value = aws_instance.web.public_ip
}

output "ssh_command" {
  value = "ssh -i ${local_file.private_key.filename} ec2-user@${aws_instance.web.public_ip}"
}

output "sns_topic_arn" {
  value = aws_sns_topic.deploy_notifications.arn
}