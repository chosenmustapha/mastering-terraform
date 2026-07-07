output "alb_dns_name" {
  description = "The DNS name of the load balancer — paste this in your browser"
  value       = aws_lb.main.dns_name
}

output "active_environment" {
  description = "Which environment is currently receiving live traffic"
  value       = var.active_environment
}

output "blue_instance_id" {
  description = "EC2 instance ID for the Blue server"
  value       = aws_instance.blue.id
}

output "green_instance_id" {
  description = "EC2 instance ID for the Green server"
  value       = aws_instance.green.id
}

output "blue_target_group_arn" {
  value = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  value = aws_lb_target_group.green.arn
}