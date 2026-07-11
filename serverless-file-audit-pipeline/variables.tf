
variable "region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "notification_email" {
  description = "The email address to send notifications to"
  type        = string
}

variable "log_retention_days" {
  description = "The number of days to retain logs in CloudWatch"
  type        = number
}