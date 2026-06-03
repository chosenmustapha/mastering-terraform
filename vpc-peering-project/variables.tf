variable "east_region" {
  description = "The region where the VPCs will be created."
  type        = string
  #default     = "us-east-1"
}

variable "west_region" {
  description = "The region where the VPCs will be created."
  type        = string
  #default     = "us-west-1"
}

variable "east_vpc_cidr" {
  description = "The CIDR block for the east VPC."
  type        = string
  #default     = "10.0.0.0/16"
}

variable "west_vpc_cidr" {
  description = "The CIDR block for the west VPC."
  type        = string
  #default     = "10.1.0.0/16"
}
