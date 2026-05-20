# Using format() and lower() for consistent naming
resource "aws_s3_bucket" "app_bucket" {
  bucket = lower(format("%s-%s-bucket", var.environment, var.project_name))
}

# Using join() for tag manipulation
resource "aws_instance" "web" {
  ami           = "ami-0b75f821522bcff85"
  instance_type = var.instance_type[0] # Use the first instance type from the list

  tags = {
    Name = join("-", [var.project_name, var.environment, "web"])
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
}

# FUNCTIONS IN ONE PLACE
locals {
  # STRING FUNCTIONS
  server_name = lower(join("-", [var.project_name, var.environment, "server"]))

  # COLLECTION FUNCTIONS
  all_tags = merge(
    { ManagedBy = "Mustapha" },
    { Environment = var.environment }
  )

  # NETWORK FUNCTIONS
  vpc_cidr = "10.0.0.0/16"
  subnets = [
    for i in range(3) : cidrsubnet(local.vpc_cidr, 8, i)
  ]
  # Result: ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]

  # CONDITIONAL FUNCTIONS
  instance_type = var.environment == "prod" ? "t3.large" : "t3.micro"

  # TYPE CONVERSION
  instance_count = tonumber(lookup(
    { dev = "1", prod = "3" },
    var.environment,
    "1"
  ))

  # LOOP FUNCTIONS
  server_names = [
    for i in range(local.instance_count) :
    "${local.server_name}-${i + 1}"
  ]
}


