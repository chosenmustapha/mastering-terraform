# Account level password policy
resource "aws_iam_account_password_policy" "pwd_policy" {
  minimum_password_length        = var.password_policy.minimum_length
  require_uppercase_characters   = var.password_policy.require_uppercase
  require_lowercase_characters   = var.password_policy.require_lowercase
  require_numbers                = var.password_policy.require_numbers
  require_symbols                = var.password_policy.require_symbols
  allow_users_to_change_password = var.password_policy.allow_users_to_change_password
  max_password_age               = var.password_policy.max_password_age
  password_reuse_prevention      = var.password_policy.password_reuse_prevention
  hard_expiry                    = var.password_policy.hard_expiry
}

# Create IAM users from CSV

resource "aws_iam_user" "users" {
  for_each = local.users_map

  name          = each.value.username
  path          = "/company/${each.value.department}/"
  force_destroy = true

  tags = {
    department = each.value.department
    title      = each.value.job_title
    email      = each.value.email
  }
}

#Assign users to groups based on department
resource "aws_iam_user_group_membership" "users_groups" {

  for_each = local.users_map

  user = aws_iam_user.users[each.key].name

  groups = [
    aws_iam_group.departments[each.value.department].name,
    aws_iam_group.all_users.name
  ]

}

# MFA enforement policy
resource "aws_iam_user_policy" "mfa_enforcement" {
  for_each = local.users_map

  name = "MFAEnforcement"
  user = aws_iam_user.users[each.key].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ResyncMFADevice",
          "iam:ListMFADevices"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/${each.value.username}",
          "arn:aws:iam::*:user/${each.value.username}"
        ]
      },
      {
        Sid    = "AllowManageOwnPassword"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/${each.value.username}"
      },
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:ListVirtualMFADevices",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ResyncMFADevice",
          "iam:ListMFADevices",
          "sts:GetSessionToken",
          "iam:ChangePassword"
        ]
        Resource = "*"

        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}