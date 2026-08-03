
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used to name/tag every resource"
  type        = string
}

variable "instance_type" {
  description = "The EC2 instance type to use for the provisioner"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "Your IP address in CIDR notation to allow SSH access to the provisioner instance"
  type        = string
}

variable "notification_email" {
  description = "Email address to receive SNS deploy notifications"
  type        = string
}