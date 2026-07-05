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

variable "logs_retention" {
  type    = number
  default = 30
}

variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "global_region" {
  type    = string
  default = "us-east-1"
}
