variable "region" {
  description = "AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "company_name" {
  description = "Name of the company for tagging purposes"
  type        = string
  default     = "MyCompany"
}

variable "password_policy" {
  description = "Password policy for IAM users"
  type        = object({
    minimum_length    = number
    require_uppercase = bool
    require_lowercase = bool
    require_numbers   = bool
    require_symbols   = bool
    allow_users_to_change_password = bool
    max_password_age    = number
    password_reuse_prevention = number 
    hard_expiry = bool
  })
  default = {
    minimum_length    = 12
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    allow_users_to_change_password = true
    max_password_age    = 90
    password_reuse_prevention = 12
    hard_expiry = false
  }
}

variable "departments" {
  description = "List of departments for tagging purposes"
  type        = list(string)
  default     = ["engineering", "product", "sales", "marketing", "finance"]
}