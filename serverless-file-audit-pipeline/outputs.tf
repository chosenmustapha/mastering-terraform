
output "uploads_bucket_name" {
  value       = aws_s3_bucket.uploads.bucket
  description = "The name of the S3 bucket for file uploads"
}

output "lambda_function_name" {
  value       = aws_lambda_function.file_auditor.function_name
  description = "The name of the Lambda function for file auditing"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.audit_log.name
  description = "The name of the DynamoDB table for audit logs"
}