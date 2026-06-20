# Baseline policy for all users. regardless of department.

resource "aws_iam_policy" "baseline_user" {
  name        = "${var.company_name}-Baseline-User-Policy"
  description = "Baseline permissions for all IAM users in ${var.company_name}"
  path        = "/company/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ViewOwnUserInfo"
        Effect = "Allow"
        Action = [
          "iam:GetUser",
          "iam:ListAccessKeys",
          "iam:ListMFADevices",
          "iam:ListGroupsForUser",
          "iam:ListUserPolicies",
          "iam:ListAttachedUserPolicies"
        ]
        Resource = "arn:aws:iam::*:user/$${aws_iam_user.users[*].name}"
      },
      {
        Sid    = "PersonalS3HomeFolder"
        Effect = "Allow"
        Action = [
          "s3:GETObject",
          "s3:PUTObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.company_name}-home/$${aws_iam_user.users[*].name}/*",
          "arn:aws:s3:::${var.company_name}-home"
        ]
      }
    ]
  })
}

# Department specific policies.

