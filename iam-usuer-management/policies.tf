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

resource "aws_iam_policy" "department_policies" {
  for_each = {
    engineering = {
      name        = "${var.company_name}-engineering-policy"
      description = "Permissions for engineering department"
      statements = [
        {
          Sid    = "EC2FullAccess"
          Effect = "Allow"
          Action = [
            "ec2:*",
            "vpc:*",
            "elasticloadbalancing:*",
            "autoscaling:*"
          ]
          Resource = "*"
        },
        {
          Sid    = "S3DeveloperAccess"
          Effect = "Allow"
          Action = ["s3:*"]
          Resource = [
            "arn:aws:s3:::${var.company_name}-engineering-*",
            "arn:aws:s3:::${var.company_name}-engineering-*/*"
          ]
        },
        {
          Sid    = "CloudWatchAccess"
          Effect = "Allow"
          Action = [
            "cloudwatch:*",
            "logs:*",
            "xray:*"
          ]
          Resource = "*"
        },
        {
          Sid    = "ECSAndEKSAccess"
          Effect = "Allow"
          Action = [
            "ecs:*",
            "eks:*",
            "ecr:*"
          ]
          Resource = "*"
        }
      ]
    }

    product = {
      name        = "${var.company_name}-product-policy"
      description = "Permissions for product department"
      statements = [
        {
          Sid    = "ReadOnlyAWSConsole"
          Effect = "Allow"
          Action = [
            "cloudwatch:GetMetricStatistics",
            "cloudwatch:ListMetrics",
            "ec2:Describe*",
            "elasticloadbalancing:Describe*",
            "logs:Describe*",
            "logs:Get*",
            "logs:FilterLogEvents"
          ]
          Resource = "*"
        },
        {
          Sid    = "ProductS3Access"
          Effect = "Allow"
          Action = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
          Resource = [
            "arn:aws:s3:::${var.company_name}-product-*",
            "arn:aws:s3:::${var.company_name}-product-*/*"
          ]
        }
      ]
    }

    sales = {
      name        = "${var.company_name}-sales-policy"
      description = "Permissions for sales department"
      statements = [
        {
          Sid    = "SalesS3Access"
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
          ]
          Resource = [
            "arn:aws:s3:::${var.company_name}-sales-*",
            "arn:aws:s3:::${var.company_name}-sales-*/*"
          ]
        },
        {
          Sid    = "ReadOnlyCloudWatch"
          Effect = "Allow"
          Action = [
            "cloudwatch:GetMetricStatistics",
            "cloudwatch:ListMetrics"
          ]
          Resource = "*"
        }
      ]
    }

    marketing = {
      name        = "${var.company_name}-marketing-policy"
      description = "Permissions for marketing department"
      statements = [
        {
          Sid    = "MarketingS3AndCDN"
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket",
            "cloudfront:CreateInvalidation",
            "cloudfront:GetDistribution",
            "cloudfront:ListDistributions"
          ]
          Resource = "*"
        },
        {
          Sid    = "SESEmailAccess"
          Effect = "Allow"
          Action = [
            "ses:SendEmail",
            "ses:SendRawEmail",
            "ses:GetSendStatistics"
          ]
          Resource = "*"
        }
      ]
    }

    finance = {
      name        = "${var.company_name}-finance-policy"
      description = "Permissions for finance department"
      statements = [
        {
          Sid    = "BillingReadOnly"
          Effect = "Allow"
          Action = [
            "aws-portal:ViewBilling",
            "aws-portal:ViewUsage",
            "ce:GetCostAndUsage",
            "ce:GetCostForecast",
            "budgets:ViewBudget",
            "cur:DescribeReportDefinitions"
          ]
          Resource = "*"
        },
        {
          Sid    = "FinanceS3Access"
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
          ]
          Resource = [
            "arn:aws:s3:::${var.company_name}-finance-*",
            "arn:aws:s3:::${var.company_name}-finance-*/*"
          ]
        }
      ]
    }
  }

  name        = each.value.name
  description = each.value.description
  path        = "/company/departments/"

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = each.value.statements
  })
}
