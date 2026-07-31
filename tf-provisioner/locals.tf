locals {
  sns_topic_arn = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${var.project_name}-deploy-notifications"
}