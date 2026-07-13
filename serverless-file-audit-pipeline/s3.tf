
resource "aws_s3_bucket" "uploads" {

  bucket = "${var.project_name}-uploads-${data.aws_caller_identity.current.account_id}"
  tags = {
    Project = "${var.project_name}-uploads"
  }
}

resource "aws_s3_bucket_notification" "uploads_trigger" {
  bucket = aws_s3_bucket.uploads.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.file_auditor.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}