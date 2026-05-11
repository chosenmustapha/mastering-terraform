
variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "us-east-2"
}

variable "vpc_cidr_block" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_class" {
  description = "The instance class for the RDS instance."
  type        = string
  default     = "db.t4g.micro"
}

variable "instance_type" {
  description = "The instace type for the ec2 instance"
  type        = list(string)
  default     = ["t3.micro", "t3.small", "t3.medium"]
}

variable "availability_zones" {
  description = "The availability zones for the subnets."
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

variable "rt_cidr_block" {
  description = "The CIDR block for the route table."
  type        = string
  default     = "0.0.0.0/0"
}

variable "subnet_cidr_blocks" {
  description = "The CIDR blocks for the subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}