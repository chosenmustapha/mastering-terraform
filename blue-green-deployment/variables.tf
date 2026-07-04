variable "region" {
  description = "The AWS region to deploy resources in."
  type        = string
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
}

variable "public_subnet_cidr" {
  description = "The CIDR block for the public subnet."
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.micro"
}


variable "active_environment" {
  description = "The active environment (blue or green)."
  type        = string

  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "The active_environment variable must be either 'blue' or 'green'."
  }
}