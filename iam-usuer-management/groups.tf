# Company wide group.

resource "aws_iam_group" "all_users" {
  name = "${var.company_name}-all-users"
  path = "/company/"
}

# Baseline policy to the company wide group.

resource "aws_iam_group_policy_attachment" "all_users_baseline" {
  group      = aws_iam_group.all_users.name
  policy_arn = aws_iam_policy.baseline_user.arn
}

# One group per department.

resource "aws_iam_group" "departments" {
  for_each = toset(var.departments)

  name = "${var.company_name}-${each.key}"
  path = "/company/${each.key}/"
}

# Attach department specific policies to each department group.
