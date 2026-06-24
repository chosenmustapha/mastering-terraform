output "created_users" {
  description = "Map of all IAM users created"
  value = {
    for username, user in aws_iam_user.users :
    username => {
      arn        = user.arn
      department = local.users_map[username].department
      path       = user.path
    }
  }
}

output "department_groups" {
  description = "Map of department groups and their ARNs"
  value = {
    for dept, group in aws_iam_group.departments :
    dept => group.arn
  }
}

output "role_arns" {
  description = "ARNs of all assumable roles created"
  value = {
    data_lake_reader = aws_iam_role.data_lake_reader.arn
    devops_access    = aws_iam_role.devops_access.arn
    billing_reader   = aws_iam_role.billing_reader.arn
  }
}

output "users_by_department" {
  description = "A breakdown of which users are in each department"
  value       = local.users_by_department
}