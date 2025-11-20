import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, X, CloudUpload, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecurityBadge } from "./SecurityBadge";
import { useAuth } from "@/context/AuthContext";

const badgeStyles = {
  checking: "text-amber-500 border-amber-500/60 bg-amber-500/10",
  connected: "text-emerald-500 border-emerald-500/60 bg-emerald-500/10",
  error: "text-red-500 border-red-500/60 bg-red-500/10",
};

const badgeIcon = {
  checking: <Info className="h-4 w-4" />,
  connected: <CheckCircle2 className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
};

export const CloudUploadComponent = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
  const { accessToken, username } = useAuth();
  const [backendStatus, setBackendStatus] = useState("checking");
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check backend
  useEffect(() => {
    fetch("http://localhost:5001/health")
      .then((res) => res.json())
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("error"));
  }, []);

  const resetInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setUploadStatus(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setFile(null);
    resetInput();
    setUploadStatus(null);
  }, [resetInput]);

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({ type: "error", message: "Please select a file first!" });
      return;
    }

    const filename = file.name || "unnamed-file";
    const filetype = file.type && file.type !== "" ? file.type : "application/octet-stream";

    console.log("⬆️ Uploading with:", { filename, filetype });

    setIsUploading(true);

    try {
      // STEP 1 — Request presigned URL
      const presignRes = await fetch("http://localhost:5001/generate-presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, filetype }),
      });

      const data = await presignRes.json();
      console.log("Presign response:", data);

      if (!data.uploadUrl)
        throw new Error("Backend did not return a presigned URL");

      // STEP 2 — Upload to S3
      const uploadRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": filetype },
        body: file,
      });

      if (!uploadRes.ok)
        throw new Error("Upload to S3 failed");

      const cleanUrl = data.uploadUrl.split("?")[0];
      const s3Key = filename; // The S3 key is the filename

      // STEP 3 — Log the upload to Django backend
      if (accessToken && username) {
        try {
          const logResponse = await fetch("http://127.0.0.1:8000/api/v1/cloud-uploads/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              file_name: filename,
              s3_key: s3Key,
              s3_url: cleanUrl,
              file_size: file.size,
              content_type: filetype,
            }),
          });

          if (logResponse.ok) {
            console.log("✅ Upload logged successfully");
            // Refresh activity logs if callback provided
            if (onUploadSuccess) {
              onUploadSuccess();
            }
          } else {
            console.warn("⚠️ Failed to log upload, but file was uploaded to S3");
          }
        } catch (logError) {
          console.error("Error logging upload:", logError);
          // Don't fail the upload if logging fails
        }
      }

      setUploadStatus({
        type: "success",
        message: "File uploaded successfully!",
        fileUrl: cleanUrl,
      });

      setFile(null);
      resetInput();
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus({ type: "error", message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center">
        <h3 className="text-xl font-semibold">Upload to Cloud Vault</h3>

        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${badgeStyles[backendStatus]}`}>
          {badgeIcon[backendStatus]}
          {backendStatus === "connected" && "Backend Ready"}
          {backendStatus === "checking" && "Checking..."}
          {backendStatus === "error" && "Backend Down"}
        </span>
      </div>

      {backendStatus === "error" && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-600 text-sm">
          Backend not reachable — Start server:  
          <b>npm start</b> (inside CryptoVault-backend)
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          const dropped = e.dataTransfer.files?.[0] ?? null;
          setFile(dropped);
          setUploadStatus(null);
        }}
      >
        <Upload className="mx-auto mb-4 h-10 w-10 text-primary" />

        <p className="font-medium">Drop file here</p>
        <p className="text-sm text-muted-foreground mb-4">or click to browse</p>

        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Choose File
        </Button>

        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </div>

      {file && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">Selected:</p>
              <p className="text-sm break-all">{file.name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearFile}
              aria-label="Deselect file"
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={handleUpload} disabled={isUploading || backendStatus !== "connected"}>
            {isUploading ? "Uploading..." : "Upload to Cloud"}
            <CloudUpload className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {uploadStatus && (
        <div
          className={`border rounded-xl p-4 ${
            uploadStatus.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/40 bg-red-500/10 text-red-600"
          }`}
        >
          <p className="font-semibold">{uploadStatus.message}</p>

          {uploadStatus.fileUrl && (
            <a href={uploadStatus.fileUrl} target="_blank" className="underline break-all mt-2 inline-block">
              {uploadStatus.fileUrl}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudUploadComponent;

