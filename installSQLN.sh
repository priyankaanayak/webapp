#!/bin/bash
sleep 30

touch ~/.bash_profile
echo -e "export MYSQL_DATABASE=USER\nexport MYSQL_USERNAME=root\nexport MYSQL_ROOT_PASSWORD=PaSswo#2\nexport MYSQL_HOST=localhost\nexport PORT=3002" > ~/.bash_profile
source ~/.bash_profile

sudo yum update -y

curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y nodejs


sudo amazon-linux-extras install epel -y 
sudo yum install https://dev.mysql.com/get/mysql80-community-release-el7-5.noarch.rpm -y
sudo yum install mysql-community-server -y
sudo systemctl start mysqld.service



export temp=$(sudo cat /var/log/mysqld.log | grep "A temporary password" | awk -F ' ' '{print $NF}')

# export MYSQL_DATABASE=DEMO
# export MYSQL_USERNAME=root
# export MYSQL_ROOT_PASSWORD=PaSswo#2
# export MYSQL_HOST=localhost
# export MYSQL_PORT=3006
# export PORT=3000

sudo mysql -u root -p$temp --connect-expired-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'PaSswo#2';CREATE DATABASE USER;USE USER;"

cd /home/ec2-user && unzip ./webapp.zip


npm install