#!/bin/bash
sleep 30

# touch ~/.bash_profile
# echo -e "export MYSQL_DATABASE=USER\nexport MYSQL_USERNAME=root\nexport MYSQL_ROOT_PASSWORD=Password#8\nexport MYSQL_HOST=localhost\nexport PORT=3002" > ~/.bash_profile
# source ~/.bash_profile

sudo yum update -y
sudo yum upgrade -y

curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y nodejs


sudo amazon-linux-extras install epel -y 
# sudo yum install https://dev.mysql.com/get/mysql80-community-release-el7-5.noarch.rpm -y
# sudo yum install mysql-community-server -y
# sudo systemctl start mysqld.service

sudo yum install nginx -y
# sudo systemctl start again

# export temp=$(sudo cat /var/log/mysqld.log | grep "A temporary password" | awk -F ' ' '{print $NF}')

# export MYSQL_DATABASE=DEMO
# export MYSQL_USERNAME=root
# export MYSQL_ROOT_PASSWORD=Password#4
# export MYSQL_HOST=localhost
# export MYSQL_PORT=3006
# export PORT=3000

# sudo mysql -u root -p$temp --connect-expired-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Password#8';CREATE DATABASE USER;USE USER;"

cd /home/ec2-user && unzip ./webapp.zip

chmod -R 700 .

npm install
sudo mv /tmp/nginx.conf /etc/nginx/nginx.conf
sudo mv /tmp/web.service /etc/systemd/system/web.service

sudo yum install amazon-cloudwatch-agent -y

sudo mv /tmp/cloudwatch.json /home/ec2-user/cloudwatch.json

