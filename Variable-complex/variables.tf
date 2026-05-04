variable "aws_region" {
  description = "The AWS region to create resources in"
  type        = string
  default     = "us-east-2"
}

variable "instance_type" {
  description = "The type of EC2 instance to create"
  type        = list(string)
  default     = ["t1.micro", "t2.micro", "t3.micro"]
}

variable "ingress_rules" {
  type    = tuple([number, string, number])
  default = [443, "tcp", 443]

  description = "Tuple containing from_port, ip_protocol, to_port"
}

variable "egress_rules" {
  type        = tuple([string, string])
  default     = ["0.0.0.0/0", "-1"]
  description = "Tuple containing cidr_ipv4, ip_protocol, to_port"
}

variable "instance_cout" {
  description = "Number of EC2 instances to create"
  type        = number
  default     = 2
}

variable "tags" {
  description = "A map of tags to apply to resources"
  type        = map(string)
  default = {
    environment = "Dev"
    owner       = "Mustapha"
  }
}

variable "instance_tags" {
  description = "An object of tags to apply to EC2 instances"

  type = object({ Name = string, environment = string, owner = string })

  default = {
    Name        = "ubuntu_ec2"
    environment = "Dev"
    owner       = "Mustapha"
  }
}

variable "cidr_block" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.1.0.0/16"
}