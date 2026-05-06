# define region variable
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-2"
}

# Define tags variable
variable "tags" {
  description = "A map of tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "Dev"
    Owner       = "Mustapha"
  }
}

# Define bucket names variable
variable "bucket_names" {
  description = "A list of bucket names to create"
  type        = list(string)
  default     = ["my-amz-aws-bucket-1", "my-amz-aws-bucket-2", "my-amz-aws-bucket-3"]
 
}

# Define bucket names map variable
variable "bucket_names_map" {
  description = "A map of bucket names to create"
  type        = map(string)
  default = {
    bucket1 = "my-amz-aws-bucket-11"
    bucket2 = "my-amz-aws-bucket-22"
    bucket3 = "my-amz-aws-bucket-33"
  }
}
