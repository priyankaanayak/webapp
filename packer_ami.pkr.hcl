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
  profile  = "dev"
  ami_name = "Custom_AMI-${local.timestamp}"

  ami_users = ["033954401603"]

  source_ami_filter {
    filters = {
      name                = "amzn2-ami-kernel-5.10-hvm-2.0.20230207.0-x86_64-gp2"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true

    owners = ["amazon"]
  }

  instance_type = "t2.micro"
  region        = "us-east-1"
  ssh_username  = "ec2-user"
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


