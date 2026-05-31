terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  alias  = "East_region"
  region = var.east_region
}

provider "aws" {
  alias  = "West_region"
  region = var.west_region
}