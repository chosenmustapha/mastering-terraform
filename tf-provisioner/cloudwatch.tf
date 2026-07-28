resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/ec2/${var.project_name}/nginx"
  retention_in_days = 7
}