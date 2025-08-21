const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

// Configure S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g. "ap-south-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload file to S3
 const uploadFile = async (bucketName, key, fileBuffer, mimetype) => {
  const params = {
    Bucket: bucketName,
    Key: key, // file name in S3
    Body: fileBuffer, 
    ContentType: mimetype, // keeps file type (image/png, image/jpeg, etc.)
  };

  const command = new PutObjectCommand(params);
  await s3.send(command);
 
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// Delete file from S3
 const deleteFile = async (bucketName, key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new DeleteObjectCommand(params);
  await s3.send(command);

  return true;
};
 
module.exports={uploadFile,deleteFile}