data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-app-logs-${data.aws_caller_identity.current.account_id}"

  tags = { Name = "${var.project_name}-app-logs" }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}