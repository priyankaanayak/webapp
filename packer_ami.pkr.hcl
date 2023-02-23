packer {
  required_plugins {
    amazon = {
      version = ">= 1.1.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

source "amazon-ebs" "amazon_linux" {
  profile  = var.profile
  ami_name = "Custom_AMI-${local.timestamp}"

  ami_users = var.ami_shared

  source_ami_filter {
    filters = {
      name                = var.name_filter_ami
      root-device-type    = var.root-device-type_ami
      virtualization-type = var.virtualization_type_ami
    }
    most_recent = true

    owners = var.owners
  }

  instance_type = var.instance_type
  region        = var.region
  ssh_username  = var.ssh_username
}
// source "amazon-ebs" "amazon_linux" {
//   profile       = "dev"
//   ami_name      = "Amzon Linux"
//   source_ami    = "ami-0dfcb1ef8550277af"
//   instance_type = "t2.micro"
//   region        = "us-east-1"
//   ssh_username  = "ec2-user"
// }

build {
  sources = [
    "source.amazon-ebs.amazon_linux"
  ]

  provisioner "file" {
    source      = "./webapp.zip"
    destination = "/home/ec2-user/webapp.zip"
  }

   provisioner "file" {
    source      = "./web.service"
    destination = "/tmp/web.service"
  }

   provisioner "file" {
    source = "./nginx.conf"
    destination = "/tmp/nginx.conf"
  }

  provisioner "shell" {
    script = "./installSQLN.sh"
  }
}

