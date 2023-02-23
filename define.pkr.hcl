variable "region" {
    type = string
    default = "us-east-1"
}

variable "profile"{
    type = string
    default = "dev"
}


variable "ami_shared"{
    type = list(string)
    default = ["033954401603"]
}

variable "name_filter_ami"{
    type = string
    default = "amzn2-ami-kernel-5.10-hvm-2.0.20230207.0-x86_64-gp2"
}

variable "root-device-type_ami"{
    type = string
    default = "ebs"
}

variable "virtualization_type_ami"{
    type = string
    default = "hvm"
}