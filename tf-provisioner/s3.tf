resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_name}-artifacts-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_object" "index_page" {
  bucket       = aws_s3_bucket.artifacts.id
  key          = "index.html"
  content      = "<h1>Deployed by Terraform provisioners</h1><p>Project: ${var.project_name}</p>"
  content_type = "text/html"
}