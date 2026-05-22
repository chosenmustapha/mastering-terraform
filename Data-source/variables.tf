variable "region" {
  description = "The AWS region to create resources in."
  type        = string
  default     = "us-east-1"
}

# variable "vpc_id" {
#   description = "The ID of the VPC where the instance will be launched."
#   type        = string
# }

variable "instance_type" {
  description = "The type of instance to create."
  type        = string
  default     = "t4g.micro"
}