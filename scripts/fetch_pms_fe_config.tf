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
    key          = "pms/fetch_pms_fe_config.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true
  }
}

data "terraform_remote_state" "pms_backend" {
  backend   = "s3"
  workspace = terraform.workspace
  config = {
    bucket = "myriounis-terraform-state"
    key    = "pms/backend.tfstate"
    region = "eu-central-1"
  }
}

variable "name" {
  type = string
}

variable "environment" {
  type = string
}

variable "hosted_zone" {
  type = string
}

variable "domain" {
  type = string
}

variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "global_region" {
  type    = string
  default = "us-east-1"
}

resource "local_file" "pms_fe_env" {
  filename = "${path.module}/pms_fe.env"
  content  = <<-EOT
REACT_APP_COGNITO_USER_POOL_ID=${data.terraform_remote_state.pms_backend.outputs.cognito_user_pool_id}
REACT_APP_COGNITO_CLIENT_ID=${data.terraform_remote_state.pms_backend.outputs.cognito_client_id}
REACT_APP_COGNITO_DOMAIN=${data.terraform_remote_state.pms_backend.outputs.cognito_domain}
REACT_APP_PMS_BE_DOMAIN=https://${data.terraform_remote_state.pms_backend.outputs.domain}
REACT_APP_COGNITO_REDIRECT_SIGNIN=["http://localhost:3000", "https://${var.domain}"]
REACT_APP_COGNITO_REDIRECT_SIGNOUT=["http://localhost:3000", "https://${var.domain}"]
EOT
}
