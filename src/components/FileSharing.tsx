import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Zap, Shield, Clock, Lock, Share2, HardDriveDownload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import heroBg from '@/assets/sharebg.jpg';

const FileSharing = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transferMethod, setTransferMethod] = useState<'lightning' | 'sentinel' | null>(null);
  const [expiryTime, setExpiryTime] = useState('24h');
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState('');
  const [generateLink, setGenerateLink] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
  const handleFileSelect = (file: File) => setSelectedFile(file);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFileSelect(files[0]);
    }, []);
    
    const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectMethod = (method: 'lightning' | 'sentinel') => {
    setTransferMethod(method);
    toast({
      title: method === 'lightning' ? "Lightning Transfer Selected" : "Sentinel Transfer Selected",
      description: method === 'lightning'
        ? "Instant transfer with less security."
        : "Secure cloud-based transfer with verification.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative h-[60vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Share Files Your Way
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Send files securely using fast or cloud-based methods.
          </p>
        </div>
      </div>

      {/* Transfer Method Selection */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
<Button
  variant="lightning"
  size="lg"
  onClick={() => handleSelectMethod('lightning')}
  className={`
    h-auto p-6 flex-col space-y-3 relative transition-all duration-300
    ${transferMethod === 'lightning' ? 'scale-105 shadow-[0_0_25px_2px_rgba(0,255,222,0.5)]' : ''}
  `}
>
  <Zap className="h-8 w-8" />
  <div className="space-y-1 text-center">
    <div className="font-bold text-lg">Lightning Method</div>
    <div className="text-sm opacity-90">Instant, fast, less secure</div>
  </div>
</Button>

<Button
  variant="sentinel"
  size="lg"
  onClick={() => handleSelectMethod('sentinel')}
  className={`
    h-auto p-6 flex-col space-y-3 relative transition-all duration-300
    ${transferMethod === 'sentinel' ? 'scale-105 shadow-[0_0_25px_2px_rgba(0,255,222,0.5)]' : ''}
  `}
>
  <Shield className="h-8 w-8" />
  <div className="space-y-1 text-center">
    <div className="font-bold text-lg">Sentinel Method</div>
    <div className="text-sm opacity-90">Secure cloud-based with verification</div>
  </div>
</Button>

</div>


        {/* Upload Zone – only visible if method is selected */}
        {transferMethod && (
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${isDragging ? 'border-primary bg-primary/5 scale-102' : 'border-border hover:border-primary/50 bg-vault-surface'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className={`p-6 rounded-full border transition-all duration-300 ${isDragging ? 'bg-gradient-primary border-primary' : 'bg-vault-bg border-vault-border'}`}>
                  <Upload className={`h-8 w-8 ${isDragging ? 'text-primary-foreground' : 'text-primary'}`} />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Drop files to Upload</h3>
                <p className="text-muted-foreground mb-4">Or click to select files from your device</p>
                <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()}>Choose Files</Button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInputChange} />
              </div>
            </div>

            {selectedFile && (
              <div className="mt-6 p-4 border rounded-lg bg-vault-bg text-left space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Selected File:</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button onClick={removeFile} className="ml-4 text-red-500 hover:text-red-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FileSharing;
