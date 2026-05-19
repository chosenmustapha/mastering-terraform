# Using format() and lower() for consistent naming
resource "aws_s3_bucket" "app_bucket" {
  bucket = lower(format("%s-%s-bucket", var.environment, var.project_name))
}

# Using join() and split() for tag manipulation
resource "aws_instance" "web" {
  ami           = "ami-0b75f821522bcff85"
  instance_type = var.instance_type[0] # Use the first instance type from the list

  tags = {
    Name = join("-", [var.project_name, var.environment, "web"])
    # Result: "myproject-dev-web"
  }
}

# Using replace() to sanitize resource names
resource "aws_iam_role" "lambda_role" {
  name = replace(var.function_name, "_", "-")
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  # Converts underscores to hyphens for IAM naming
}