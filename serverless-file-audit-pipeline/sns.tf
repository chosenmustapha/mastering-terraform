
resource "aws_sns_topic" "upload_notifications" {
  name = "${var.project_name}-upload-notifications"
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.upload_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}