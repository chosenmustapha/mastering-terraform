variable "east_region" {
  description = "The region where the VPCs will be created."
  type        = string
}

variable "west_region" {
  description = "The region where the VPCs will be created."
  type        = string
}

variable "east_vpc_cidr" {
  description = "The CIDR block for the east VPC."
  type        = string
}

variable "west_vpc_cidr" {
  description = "The CIDR block for the west VPC."
  type        = string
}

variable "my_public_ip" {
  description = "my home network public IP address"
}

variable "instance_type" {
  description = "The type of instance to create."
  type        = string
}