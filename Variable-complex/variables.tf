# This file contains variable definitions for the Terraform configuration.

# AwS region variable with a default value of "us-east-2"
variable "aws_region" {
  description = "The AWS region to create resources in"
  type        = string
  default     = "us-east-2"
}

# instance_type variable defined as a list of strings with default values
variable "instance_type" {
  description = "The type of EC2 instance to create"
  type        = list(string)
  default     = ["t1.micro", "t2.micro", "t3.micro"]
}

# ingress_rules variable defined as a tuple with default values for from_port, ip_protocol, and to_port
variable "ingress_rules" {
  type    = tuple([number, string, number])
  default = [443, "tcp", 443]

  description = "Tuple containing from_port, ip_protocol, to_port"
}

# egress_rules variable defined as a tuple with default values for cidr_ipv4 and ip_protocol
variable "egress_rules" {
  type        = tuple([string, string])
  default     = ["0.0.0.0/0", "-1"]
  description = "Tuple containing cidr_ipv4, ip_protocol, to_port"
}

# instance_count variable defined as a number with a default value of 2
# variable "instance_count" {
#   description = "Number of EC2 instances to create"
#   type        = number
#   default     = 2
# }

#tags variable defined as a map of strings with default values for environment and owner
variable "tags" {
  description = "A map of tags to apply to resources"
  type        = map(string)
  default = {
    environment = "Dev"
    owner       = "Mustapha"
  }
}

# instance_tags variable defined as an object with default values for Name, environment, and owner
variable "instance_tags" {
  description = "An object of tags to apply to EC2 instances"

  type = object({ Name = string, environment = string, owner = string })

  default = {
    Name        = "ubuntu_ec2"
    environment = "Dev"
    owner       = "Mustapha"
  }
}

# cidr_block variable defined as a string with a default value of "10.1.0.0/16"
variable "cidr_block" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.1.0.0/16"
}

# availability_zone variable defined as a set of strings with default values for availability zones
variable "availability_zone" {
  description = "The availability zone for the subnet"
  type        = set(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}