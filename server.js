import express from "express";
import AWS from "aws-sdk";
import cors from "cors";

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  region: process.env.AWS_REGION || "",
  bucketName: process.env.AWS_S3_BUCKET || "",
};

function validateAwsConfig() {
  if (!AWS_CONFIG.accessKeyId || !AWS_CONFIG.secretAccessKey) {
    throw new Error("Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
  }
  if (!AWS_CONFIG.region) {
    throw new Error("Missing AWS region. Please set AWS_REGION.");
  }
  if (!AWS_CONFIG.bucketName) {
    throw new Error("Missing S3 bucket name. Please set AWS_S3_BUCKET.");
  }
}

// Create S3 instance
function createS3() {
  validateAwsConfig();
  AWS.config.update({
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
    region: AWS_CONFIG.region,
  });

  return new AWS.S3({ signatureVersion: "v4" });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend server is running" });
});

// Generate pre-signed URL
app.post("/generate-presigned-url", (req, res) => {
  const { filename, filetype } = req.body;

  if (!filename || !filetype) {
    return res.status(400).json({ error: "filename and filetype are required" });
  }

  try {
    const s3 = createS3();

    const params = {
      Bucket: AWS_CONFIG.bucketName,
      Key: filename,
      Expires: 60,
      ContentType: filetype,
    };

    s3.getSignedUrl("putObject", params, (err, url) => {
      if (err) {
        return res.status(500).json({
          error: "Error generating presigned URL",
          details: err.message,
        });
      }

      res.json({ uploadUrl: url });
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error configuring AWS",
      details: error.message,
    });
  }
});

// Start backend server
app.listen(5001, () => {
  console.log("Backend server running on port 5001");
});
