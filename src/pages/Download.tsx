import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import CloudUploadComponent from "@/components/CloudUploadComponent";
import { useAuth } from "@/context/AuthContext";
import { Cloud as CloudIcon, Clock, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import cloudBackground from "@/assets/CloudBackground.jpeg";
import Footer from "@/components/Footer";

interface CloudUploadLog {
  id: number;
  file_name: string;
  s3_key: string;
  s3_url: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_at: string;
  user: string;
}

const CloudPage = () => {
  const { accessToken, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<CloudUploadLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to home page if not authenticated (e.g., after refresh)
  useEffect(() => {
    if (!isAuthenticated) {
      logout(); // Ensure logout is called
      navigate("/", { replace: true });
      return;
    }
  }, [isAuthenticated, logout, navigate]);

  const fetchLogs = async () => {
    if (!accessToken || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/cloud-uploads/", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching cloud upload logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [accessToken, isAuthenticated]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: `url(${cloudBackground})`,
      }}
    >
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Cloud <span className="bg-gradient-crypto bg-clip-text text-transparent">Vault</span>
          </h1>
          <p className="text-muted-foreground">
            Upload files directly to cloud storage with secure encryption
          </p>
        </div>

        <div className="space-y-8">
          {/* Upload Component */}
          <div className="bg-vault-surface p-8 rounded-xl border border-vault-border">
            <CloudUploadComponent onUploadSuccess={fetchLogs} />
          </div>

          {/* Activity Logs */}
          <div className="bg-vault-surface p-8 rounded-xl border border-vault-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CloudIcon className="h-6 w-6" />
                Upload Activity Logs
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading activity logs...</p>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No cloud uploads yet. Upload a file to see activity logs here.
              </p>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-lg">{log.file_name}</span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Uploaded: {new Date(log.uploaded_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {log.file_size && (
                            <div>Size: {formatFileSize(log.file_size)}</div>
                          )}
                          
                          {log.content_type && (
                            <div>Type: {log.content_type}</div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              S3 Key: {log.s3_key}
                            </span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={log.s3_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Open in S3"
                      >
                        <ExternalLink className="h-5 w-5 text-primary" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CloudPage;