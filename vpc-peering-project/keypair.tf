resource "aws_key_pair" "east_key_pair" {
  provider   = aws.East_region
  key_name   = "east-key-pair"
  public_key = file("~/.ssh/my-aws-key.pub")
}

resource "aws_key_pair" "west_key_pair" {
  provider   = aws.West_region
  key_name   = "west-key-pair"
  public_key = file("~/.ssh/my-aws-key.pub")
}