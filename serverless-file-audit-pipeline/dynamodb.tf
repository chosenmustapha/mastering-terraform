resource "aws_dynamodb_table" "audit_log" {
  name         = "${var.project_name}-audit-log"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "file_key"
  range_key    = "uploaded_at"

  attribute {
    name = "file_key"
    type = "S"
  }

  attribute {
    name = "uploaded_at"
    type = "S"
  }

  tags = {
    Project = var.project_name
  }
}