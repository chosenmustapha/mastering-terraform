variable "region" {
  description = "The AWS region to create resources in."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The environment to create resources in."
  type        = string
}

variable "instance_type" {
  description = "The type of EC2 instance to create."
  type        = list(string)
  default     = ["t3.micro", "t3.small", "t3.medium"]
}

variable "project_name" {
  description = "The name of the project."
  type        = string
  default     = "myproject"
}

variable "function_name" {
  description = "The name of the Lambda function."
  type        = string
  default     = "my_lambda_function_role"
}