
resource "aws_sns_topic" "deploy-notifications" {
  name = "${var.project_name}-deploy-notifications"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.deploy-notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}