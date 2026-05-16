variable "region" {
  type    = string
  default = "us-east-1"
}

variable "tags" {
  type = map(string)
  default = {
    name        = "My Debian Instance"
    Environment = "Development"
    Owner       = "Mustapha"
  }
}

variable "instances_count" {
  type    = number
  default = 2
}

variable "ingress_rules" {
  type = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
  }))
  default = [
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    },
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]
}

variable "instance_type" {
  type    = list(string)
  default = ["t2.micro", "t3.micro"]
}

variable "environment" {
  type    = list(string)
  default = ["development", "production", "staging"]
}