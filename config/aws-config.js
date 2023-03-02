const dotenv = require("dotenv");
const S3 = require("aws-sdk/clients/s3.js");
const fs = require("fs");

dotenv.config();

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const bucketRegion = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
  region: bucketRegion,
  accessKeyId,
  secretAccessKey,
});

function uploadToS3(file, filePartition) {
  const fileStream = fs.createReadStream(file.path);

  return s3
    .upload({
      Bucket: bucketName,
      Body: fileStream,
      Key: filePartition,
    })
    .promise();
}

function deleteFromS3(fileName) {
  return s3.deleteObject({ Bucket: bucketName, Key: fileName }).promise();
}

module.exports = { uploadToS3, deleteFromS3 };
