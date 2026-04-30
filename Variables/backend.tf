terraform {
   backend "s3" {
    bucket = "amzn-remote-s3-backend"
    key    = "dev/terraform.tfstate"
    region = "us-east-2"
    use_lockfile = true
    encrypt = true
  }
}