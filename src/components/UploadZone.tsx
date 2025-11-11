import React, { useState, useCallback, useRef } from "react";
import { Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecurityBadge } from "./SecurityBadge";
import { useAuth } from "../context/AuthContext"; // Import your auth context

export const UploadZone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Get token from auth context
  const { accessToken } = useAuth();

  // --- Drag Handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadStatus("idle");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  }, []);

  // --- File Input Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadStatus("idle");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset input
    }
  };

  // 🚀 FINAL UPLOAD LOGIC: Targets the DRF ViewSet endpoint
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    console.log("Access Token in UploadZone:", accessToken);
    const formData = new FormData();
    formData.append("uploaded_file", selectedFile);

    const API_URL = "/api/uploadfiles/";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
        // Don't include Content-Type: browser sets it for FormData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus("success");
        console.log("✅ Upload successful. Django Response:", data);
      } else {
        setUploadStatus("error");
        console.error(
          "❌ Upload failed:",
          response.status,
          response.statusText,
          "Body:",
          data
        );
      }
    } catch (error) {
      setUploadStatus("error");
      console.error("❌ Error during upload:", error);
    }
  };

  // --- Component JSX (remains the same) ---
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`
        relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
        ${
          isDragging
            ? "border-primary bg-primary/5 scale-102"
            : "border-vault-border bg-vault-surface hover:border-primary/50"
        }
      `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <div
              className={`
                p-6 rounded-full border transition-all duration-300
                ${
                  isDragging
                    ? "bg-gradient-primary border-primary"
                    : "bg-vault-bg border-vault-border"
                }
              `}
            >
              <Upload
                className={`h-8 w-8 ${
                  isDragging
                    ? "text-primary-foreground"
                    : "text-primary"
                }`}
              />
            </div>
          </div>

          {/* File Selection */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Drop files to encrypt and upload
            </h3>
            <p className="text-muted-foreground mb-4">
              Or click to select files from your device
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <SecurityBadge type="encryption" label="AES-128 Encryption" />
            <SecurityBadge type="protected" label="Blockchain Verified" />
            <SecurityBadge type="verified" label="AWS S3 Secured" />
          </div>
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="mt-6 p-4 border rounded-lg bg-vault-bg text-left flex justify-between items-center">
            <div>
              <p className="font-medium">Selected File:</p>
              <p className="text-sm text-muted-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={removeFile}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* "Continue" Button and Status Display */}
      {selectedFile && (
        <div className="mt-6 flex flex-col items-center">
          <Button
            size="lg"
            className="w-full"
            onClick={handleUpload}
            disabled={uploadStatus === "uploading"}
          >
            {uploadStatus === "uploading" ? "Uploading..." : "Continue"}
          </Button>
          {uploadStatus === "success" && (
            <p className="text-green-500 mt-2 flex items-center gap-1">
              <Check className="h-4 w-4" /> Upload successful!
            </p>
          )}
          {uploadStatus === "error" && (
            <p className="text-red-500 mt-2">
              Failed to upload. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
