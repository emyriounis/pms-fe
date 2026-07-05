provider "aws" {
  region = var.region
}

provider "aws" {
  alias  = "global_region"
  region = var.global_region
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.37.0"
    }
  }

  backend "s3" {
    bucket       = "myriounis-terraform-state"
    key          = "pms/frontend.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true
  }
}

data "aws_route53_zone" "hosted_zone" {
  name = var.hosted_zone
}
