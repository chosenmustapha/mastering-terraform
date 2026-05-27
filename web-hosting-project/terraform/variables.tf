variable "region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "the name of the S3 bucket to create"
}
variable "domain_name" {
  description = "the domain name to use for the web hosting"
}