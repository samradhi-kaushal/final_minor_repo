import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, X, CloudUpload, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecurityBadge } from "./SecurityBadge";

type BackendStatus = "checking" | "connected" | "error";

interface FetchErrorInfo {
  errorType: string;
  errorMessage: string;
  fetchUrl: string;
  possibleCauses: string[];
}

interface ResponseErrorInfo {
  status: number;
  message: string;
  details?: {
    problematicField?: string;
    suggestion?: string;
    missingFields?: string[];
    invalidFields?: string[];
    missingEnvVars?: string[];
    [key: string]: unknown;
  };
}

interface FetchDetails {
  url: string;
  method: string;
  timestamp: string;
  requestBody: {
    filename: string;
    filetype: string;
  };
  error?: FetchErrorInfo;
  responseError?: ResponseErrorInfo;
  s3Error?: string;
}

type UploadStatus =
  | {
      type: "success";
      message: string;
      fileUrl: string;
    }
  | {
      type: "error";
      message: string;
      fetchDetails?: FetchDetails;
    }
  | null;

const HEALTH_ENDPOINT = "http://localhost:5000/health";
const PRESIGNED_ENDPOINT = "http://localhost:5000/generate-presigned-url";

const badgeStyles: Record<BackendStatus, string> = {
  checking: "text-amber-500 border-amber-500/60 bg-amber-500/10",
  connected: "text-emerald-500 border-emerald-500/60 bg-emerald-500/10",
  error: "text-red-500 border-red-500/60 bg-red-500/10",
};

const badgeIcon: Record<BackendStatus, JSX.Element> = {
  checking: <Info className="h-4 w-4" />,
  connected: <CheckCircle2 className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
};

export const CloudUpload = () => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [fetchDetails, setFetchDetails] = useState<FetchDetails | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(HEALTH_ENDPOINT);
        setBackendStatus(res.ok ? "connected" : "error");
      } catch (error) {
        console.error("Cloud upload health check failed:", error);
        setBackendStatus("error");
      }
    };

    checkBackend();
  }, []);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelection = useCallback((selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(null);
      setFetchDetails(null);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    handleFileSelection(selectedFile);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    handleFileSelection(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({
        type: "error",
        message: "Please select a file first!",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setFetchDetails(null);
    setIsDragActive(false);

    const requestBody = {
      filename: file.name,
      filetype: file.type || "application/octet-stream",
    };

    const details: FetchDetails = {
      url: PRESIGNED_ENDPOINT,
      method: "POST",
      timestamp: new Date().toISOString(),
      requestBody,
    };

    let latestDetails: FetchDetails = details;
    setFetchDetails(details);

    try {
      let presignedRes: Response;
      try {
        presignedRes = await fetch(PRESIGNED_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError) {
        const error = fetchError as Error;
        latestDetails = {
          ...details,
          error: {
            errorType: error.name,
            errorMessage: error.message,
            fetchUrl: PRESIGNED_ENDPOINT,
            possibleCauses: [
              "Backend server is not running (run `npm start` in the backend directory).",
              "Backend server is running on a different port.",
              "CORS is blocking the request.",
              "Network connectivity issue.",
            ],
          },
        };
        setFetchDetails(latestDetails);

        throw new Error(
          `Failed to reach ${PRESIGNED_ENDPOINT}\n` +
            `Error: ${error.message}\n` +
            `Possible causes:\n` +
            `- Backend server not running.\n` +
            `- Backend running on a different port.\n` +
            `- Network or CORS issue.`
        );
      }

      if (!presignedRes.ok) {
        let errorMessage = "Failed to get upload URL";
        let errorDetails: ResponseErrorInfo["details"] | null = null;

        try {
          const errorData = (await presignedRes.json()) as Record<string, unknown>;
          const problemField = typeof errorData.problematicField === "string" ? errorData.problematicField : undefined;
          const suggestion = typeof errorData.suggestion === "string" ? errorData.suggestion : undefined;
          const missingFields = Array.isArray(errorData.missingFields)
            ? (errorData.missingFields as string[])
            : undefined;
          const invalidFields = Array.isArray(errorData.invalidFields)
            ? (errorData.invalidFields as string[])
            : undefined;
          const missingEnvVars = Array.isArray(errorData.missingEnvVars)
            ? (errorData.missingEnvVars as string[])
            : undefined;

          if (typeof errorData.error === "string") {
            errorMessage = errorData.error;
          } else if (typeof errorData.details === "string") {
            errorMessage = errorData.details;
          }

          errorDetails = {
            problematicField: problemField,
            suggestion,
            missingFields,
            invalidFields,
            missingEnvVars,
            ...errorData,
          };

          const errMsgLower = errorMessage.toLowerCase();
          if (errMsgLower.includes("credentials") || errMsgLower.includes("invalid") || errMsgLower.includes("access")) {
            if (errMsgLower.includes("access") && !errMsgLower.includes("secret")) {
              errorMessage += "\nProblem likely with AWS_ACCESS_KEY_ID.";
            } else if (errMsgLower.includes("secret")) {
              errorMessage += "\nProblem likely with AWS_SECRET_ACCESS_KEY.";
            } else if (errMsgLower.includes("region")) {
              errorMessage += "\nProblem likely with AWS_REGION.";
            } else if (errMsgLower.includes("bucket")) {
              errorMessage += "\nProblem likely with AWS_BUCKET_NAME.";
            }
          }
        } catch (jsonError) {
          console.warn("Failed to parse error JSON:", jsonError);
          errorMessage = `Server error: ${presignedRes.status} ${presignedRes.statusText}`;
        }

        latestDetails = {
          ...details,
          responseError: {
            status: presignedRes.status,
            message: errorMessage,
            details: errorDetails ?? undefined,
          },
        };
        setFetchDetails(latestDetails);
        throw new Error(errorMessage);
      }

      const data = (await presignedRes.json()) as { uploadUrl?: string };
      const uploadUrl = data.uploadUrl;

      if (!uploadUrl) {
        throw new Error("Failed to get upload URL from server response.");
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        const s3Error = `S3 upload failed: ${uploadRes.status} ${uploadRes.statusText}. ${errorText}`;
        latestDetails = { ...details, s3Error };
        setFetchDetails(latestDetails);
        throw new Error(s3Error);
      }

      setUploadStatus({
        type: "success",
        message: "File uploaded successfully!",
        fileUrl: uploadUrl.split("?")[0],
      });
      setFile(null);
      setFetchDetails(null);
      resetFileInput();
    } catch (error) {
      const err = error as Error;
      setFetchDetails((current) => current ?? latestDetails);
      setUploadStatus({
        type: "error",
        message: err.message.startsWith("❌") ? err.message : `❌ ${err.message}`,
        fetchDetails: latestDetails,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          Upload to Cloud Vault
          <div className="h-px w-16 bg-gradient-primary opacity-80" />
        </h3>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${badgeStyles[backendStatus]}`}
        >
          {badgeIcon[backendStatus]}
          {backendStatus === "connected" && "Backend connected"}
          {backendStatus === "checking" && "Checking backend..."}
          {backendStatus === "error" && "Backend not reachable"}
        </span>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-vault-border bg-vault-surface hover:border-primary/50"
        }`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <div
              className={`p-6 rounded-full border transition-all duration-300 ${
                isDragActive ? "bg-gradient-primary border-primary" : "bg-vault-bg border-vault-border"
              }`}
            >
              <Upload className={`h-8 w-8 ${isDragActive ? "text-primary-foreground" : "text-primary"}`} />
            </div>
          </div>

          <div>
            <h4 className="text-xl font-semibold mb-2">Drop files to upload</h4>
            <p className="text-muted-foreground mb-4">
              Or click to browse and upload securely to S3 via the CryptoVault backend.
            </p>
            <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <SecurityBadge type="encryption" label="AES-256 Encryption" />
            <SecurityBadge type="protected" label="Blockchain Verified" />
            <SecurityBadge type="verified" label="AWS S3 Secured" />
          </div>
        </div>

        {file && (
          <div className="mt-6 p-4 border rounded-lg bg-vault-bg text-left space-y-4">
            <div className="flex flex-wrap justify-between gap-4 items-start">
              <div>
                <p className="font-medium">Selected file</p>
                <p className="text-sm text-muted-foreground break-all">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "Unknown type"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleFileSelection(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading || backendStatus !== "connected"}
              className="w-full flex items-center justify-center gap-2"
            >
              <CloudUpload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload to Cloud"}
            </Button>
          </div>
        )}
      </div>

      {uploadStatus && (
        <div
          className={`border rounded-xl p-4 ${
            uploadStatus.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/40 bg-red-500/10 text-red-600"
          }`}
        >
          <p className="font-semibold">{uploadStatus.message}</p>
          {"fileUrl" in uploadStatus && uploadStatus.fileUrl && (
            <p className="text-sm mt-2 break-all">
              File URL:{" "}
              <a
                href={uploadStatus.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-emerald-700"
              >
                {uploadStatus.fileUrl}
              </a>
            </p>
          )}

          {uploadStatus.type === "error" && fetchDetails && (
            <details className="mt-4 space-y-2">
              <summary className="cursor-pointer text-sm underline">View request details</summary>
              <div className="rounded-lg border border-border/40 bg-background/80 p-3 text-foreground">
                <p className="text-sm">
                  <span className="font-medium">Endpoint:</span> {fetchDetails.url}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Method:</span> {fetchDetails.method}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Timestamp:</span> {new Date(fetchDetails.timestamp).toLocaleString()}
                </p>

                {fetchDetails.error && (
                  <div className="mt-3 text-sm space-y-1">
                    <p className="font-medium">Fetch error:</p>
                    <p>Type: {fetchDetails.error.errorType}</p>
                    <p>Message: {fetchDetails.error.errorMessage}</p>
                    <p>Possible causes:</p>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      {fetchDetails.error.possibleCauses.map((cause, index) => (
                        <li key={index}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fetchDetails.responseError && (
                  <div className="mt-3 text-sm space-y-1">
                    <p className="font-medium">Response error:</p>
                    <p>Status: {fetchDetails.responseError.status}</p>
                    <p className="whitespace-pre-line">{fetchDetails.responseError.message}</p>
                    {fetchDetails.responseError.details && (
                      <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-x-auto">
                        {JSON.stringify(fetchDetails.responseError.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {fetchDetails.s3Error && (
                  <div className="mt-3 text-sm space-y-1">
                    <p className="font-medium">S3 upload error:</p>
                    <p className="whitespace-pre-line text-xs">{fetchDetails.s3Error}</p>
                  </div>
                )}

                <div className="mt-3 text-sm space-y-1">
                  <p className="font-medium">Request body:</p>
                  <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-x-auto">
                    {JSON.stringify(fetchDetails.requestBody, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudUpload;

