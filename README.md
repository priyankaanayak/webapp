# webapp

Pre requisites

1. NodeJS is installed in your system

   Type node -v in your terminal to check nodejs version

2. Npm is installed in your system

   Type npm -v in your terminal to check npm version

3. MySQl is installed in your system

   https://www.mysql.com/downloads/

Steps to run web app

1. Clone git repository to your local system and navigate to the project in Terminal using cd webapp
2. Type "npm install"
3. Type "node index.js"
4. Open Postman enter the port number in which the app is running- send the value.
5. open MySQL workbench to check the value has been entered or not.

## Packer

Packer is a free and open source program for producing golden images from a single source configuration for various platforms.

### Prerequisites

- You can download packer from this link [link](https://developer.hashicorp.com/packer/downloads)
- Make sure you have downloaded [AWS CLI](https://aws.amazon.com/cli/) and configure the profile.

### Initialize Packer

To initialize packer:

`packer init .`

### Packer Validate

To validate packer:

`packer validate .`

To include the var file:

`packer validate -var-file=<file-name>.pkrvars.hcl .`

### Packer Build

To build the AMI Package:

`packer build .`

To include the var file:

`packer build -var-file=<file-name>.pkrvars.hcl .`
