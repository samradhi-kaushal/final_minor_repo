import express from "express";
import AWS from "aws-sdk";
import cors from "cors";

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// ✅ HARD-CODE ALL AWS CREDENTIALS HERE
const AWS_CONFIG = {
  accessKeyId: "",
  secretAccessKey: "",
  region: "ap-south-1",
  bucketName: "crypto-vault-minor",
};

// Create S3 instance
function createS3() {
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
