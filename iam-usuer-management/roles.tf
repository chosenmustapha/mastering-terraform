# Cross-department data access role
# Engineering and Product can assume this to query the data lake
resource "aws_iam_role" "data_lake_reader" {
  name        = "${var.company_name}-data-lake-reader"
  description = "Allows authorized users to read from the company data lake"
  path        = "/company/roles/"

  # The trust policy: WHO is allowed to assume this role?
  # Only IAM users from this same account
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAssumeByInternalUsers"
        Effect = "Allow"
        Principal = {
          # This scopes it to the current AWS account only
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          # MFA must be present when assuming this role
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Purpose = "cross-department-data-access"
  }
}

# Policy that defines what the data lake reader role CAN DO
resource "aws_iam_role_policy" "data_lake_reader_policy" {
  name = "DataLakeReadPermissions"
  role = aws_iam_role.data_lake_reader.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "glue:GetDatabase",
          "glue:GetTable",
          "glue:GetPartitions",
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults"
        ]
        Resource = "*"
      }
    ]
  })
}

# Allow Engineering and Product groups to assume the data lake role
resource "aws_iam_group_policy" "assume_data_lake_role" {
  for_each = toset(["engineering", "product"])

  name  = "AssumeDataLakeReaderRole"
  group = aws_iam_group.departments[each.key].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAssumeDataLakeRole"
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Resource = aws_iam_role.data_lake_reader.arn
      }
    ]
  })
}

# DevOps role - only Engineering can assume this, with MFA
resource "aws_iam_role" "devops_access" {
  name        = "${var.company_name}-devops-access"
  description = "Elevated DevOps access for engineering team members"
  path        = "/company/roles/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEngineeringWithMFA"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "devops_access_policy" {
  role       = aws_iam_role.devops_access.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

# Allow only Engineering group to assume the DevOps role
resource "aws_iam_group_policy" "engineering_assume_devops" {
  name  = "AssumeDevOpsRole"
  group = aws_iam_group.departments["engineering"].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAssumeDevOpsRole"
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Resource = aws_iam_role.devops_access.arn
      }
    ]
  })
}

# Finance read-only billing role
resource "aws_iam_role" "billing_reader" {
  name        = "${var.company_name}-billing-reader"
  description = "Read-only access to billing and cost data"
  path        = "/company/roles/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "billing_reader_policy" {
  role       = aws_iam_role.billing_reader.name
  policy_arn = "arn:aws:iam::aws:policy/job-function/Billing"
}
