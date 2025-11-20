import React, { useState, useCallback, useRef } from "react";
import { Upload, X, Check, Lock, Download, Loader2, Shield, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecurityBadge } from "./SecurityBadge";

/**
 * Client-side file encryption/decryption component for the Index page
 * Encrypts or decrypts files in the browser
 */
export const ClientEncryptUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [status, setStatus] = useState<"idle" | "encrypting" | "decrypting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEncryptedFile, setIsEncryptedFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Drag handlers
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
    setStatus("idle");
    setErrorMessage("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      // Check if file is encrypted
      const isEncrypted = file.name.endsWith('.encrypted');
      setIsEncryptedFile(isEncrypted);
      setShowKeyInput(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus("idle");
    setErrorMessage("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Check if file is encrypted (ends with .encrypted or check first bytes)
      const isEncrypted = file.name.endsWith('.encrypted');
      setIsEncryptedFile(isEncrypted);
      setShowKeyInput(true);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setEncryptionKey("");
    setShowKeyInput(false);
    setStatus("idle");
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Derive a key from the password using PBKDF2
   */
  const deriveKey = async (password: string, salt: Uint8Array, usage: "encrypt" | "decrypt"): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      [usage]
    );
  };

  /**
   * Encrypt file using AES-GCM
   */
  const encryptFile = async (file: File, password: string): Promise<Blob> => {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM

    // Derive key from password
    const key = await deriveKey(password, salt, "encrypt");

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Encrypt the file
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      fileBuffer
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return new Blob([combined], { type: "application/octet-stream" });
  };

  /**
   * Decrypt file using AES-GCM
   */
  const decryptFile = async (file: File, password: string): Promise<Blob> => {
    // Read encrypted file
    const fileBuffer = await file.arrayBuffer();
    const encryptedData = new Uint8Array(fileBuffer);

    // Extract salt (first 16 bytes), IV (next 12 bytes), and encrypted content
    if (encryptedData.length < 28) {
      throw new Error("Invalid encrypted file format");
    }

    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const ciphertext = encryptedData.slice(28);

    // Derive key from password using the same salt
    const key = await deriveKey(password, salt, "decrypt");

    // Decrypt the file
    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        ciphertext
      );

      return new Blob([decryptedData]);
    } catch (error) {
      throw new Error("Decryption failed. Incorrect key or corrupted file.");
    }
  };

  /**
   * Handle encryption and download
   */
  const handleEncrypt = async () => {
    if (!selectedFile) {
      setStatus("error");
      setErrorMessage("Please select a file first");
      return;
    }

    if (!encryptionKey || encryptionKey.length < 8) {
      setStatus("error");
      setErrorMessage("Please enter an encryption key (minimum 8 characters)");
      return;
    }

    setStatus("encrypting");
    setErrorMessage("");

    try {
      // Encrypt the file
      const encryptedBlob = await encryptFile(selectedFile, encryptionKey);

      // Create download link
      const url = window.URL.createObjectURL(encryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedFile.name}.encrypted`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus("success");
      
      // Reset after 3 seconds
      setTimeout(() => {
        removeFile();
      }, 3000);
    } catch (error) {
      console.error("Encryption error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to encrypt file");
    }
  };

  /**
   * Handle decryption and download
   */
  const handleDecrypt = async () => {
    if (!selectedFile) {
      setStatus("error");
      setErrorMessage("Please select a file first");
      return;
    }

    if (!encryptionKey || encryptionKey.length < 8) {
      setStatus("error");
      setErrorMessage("Please enter the decryption key (minimum 8 characters)");
      return;
    }

    setStatus("decrypting");
    setErrorMessage("");

    try {
      // Decrypt the file
      const decryptedBlob = await decryptFile(selectedFile, encryptionKey);

      // Determine original filename (remove .encrypted extension if present)
      const originalName = selectedFile.name.endsWith('.encrypted') 
        ? selectedFile.name.slice(0, -10) 
        : selectedFile.name.replace('.encrypted', '');

      // Create download link
      const url = window.URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus("success");
      
      // Reset after 3 seconds
      setTimeout(() => {
        removeFile();
      }, 3000);
    } catch (error) {
      console.error("Decryption error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to decrypt file. Check your key.");
    }
  };

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
              Drop files to encrypt or decrypt
            </h3>
            <p className="text-muted-foreground mb-4">
              Or click to select files from your device
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === "encrypting"}
            >
              Choose File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              disabled={status === "encrypting"}
            />
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <SecurityBadge type="encryption" label="AES-256 Encryption" />
            <SecurityBadge type="protected" label="Client-Side Encryption" />
            <SecurityBadge type="verified" label="No Server Upload" />
          </div>
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="mt-6 space-y-4">
            <div className="p-4 border rounded-lg bg-vault-bg text-left flex justify-between items-center">
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
                disabled={status === "encrypting"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Encryption/Decryption Key Input */}
            {showKeyInput && (
              <div className="p-4 border rounded-lg bg-vault-bg">
                <Label htmlFor="encryption-key" className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  {isEncryptedFile ? "Decryption Key" : "Encryption Key"}
                </Label>
                <Input
                  id="encryption-key"
                  type="password"
                  placeholder={isEncryptedFile ? "Enter decryption key (min 8 characters)" : "Enter encryption key (min 8 characters)"}
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  className="mt-2"
                  disabled={status === "encrypting" || status === "decrypting"}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {isEncryptedFile 
                    ? "Enter the key used to encrypt this file to decrypt it."
                    : "This key will be used to encrypt your file. Keep it safe! You'll need it to decrypt the file later."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Encrypt/Decrypt Buttons and Status Display */}
      {selectedFile && showKeyInput && (
        <div className="mt-6 flex flex-col items-center space-y-4">
          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-4">
            {/* Encrypt Button */}
            <Button
              size="lg"
              variant={isEncryptedFile ? "outline" : "default"}
              className="w-full"
              onClick={handleEncrypt}
              disabled={status === "encrypting" || status === "decrypting" || !encryptionKey || encryptionKey.length < 8}
            >
              {status === "encrypting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Encrypt
                </>
              )}
            </Button>

            {/* Decrypt Button */}
            <Button
              size="lg"
              variant={isEncryptedFile ? "default" : "outline"}
              className="w-full"
              onClick={handleDecrypt}
              disabled={status === "encrypting" || status === "decrypting" || !encryptionKey || encryptionKey.length < 8}
            >
              {status === "decrypting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Decrypt
                </>
              )}
            </Button>
          </div>

          {/* Status Messages */}
          {status === "success" && (
            <p className="text-green-500 flex items-center gap-1">
              <Check className="h-4 w-4" />
              {isEncryptedFile 
                ? "File decrypted and downloaded successfully!"
                : "File encrypted and downloaded successfully!"}
            </p>
          )}
          
          {status === "error" && (
            <p className="text-red-500 text-sm text-center">
              {errorMessage || (isEncryptedFile 
                ? "Failed to decrypt file. Please try again."
                : "Failed to encrypt file. Please try again.")}
            </p>
          )}

          {/* Info Message */}
          <p className="text-xs text-muted-foreground text-center max-w-md">
            {isEncryptedFile 
              ? "This appears to be an encrypted file. Use the Decrypt button to restore the original file."
              : "Choose Encrypt to secure your file, or Decrypt if you have an encrypted file."}
          </p>
        </div>
      )}
    </div>
  );
};

