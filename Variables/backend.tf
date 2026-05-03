terraform {
   backend "s3" {
    bucket = "amazon-remote-s3-backend"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"
    use_lockfile = true
    encrypt = true
  }
}