
data "aws_iam_policy_document" "ec2_assume" {

  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = service
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_role" {
  name               = "${var.project_name}-ec2-role"
  assume_role_policy = aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

data "aws_iam_policy_document" "s3_read" {
  statement {
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.artifacts.arn,
      "${aws_s3_bucket.artifacts.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "s3_read" {
  name   = "${var.project_name}-s3-read"
  role   = aws_iam_role.ec2_role.id
  policy = data.aws_iam_policy_document.s3_read.json
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}