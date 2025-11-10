import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Lock, FileText } from 'lucide-react';
import { Header } from "@/components/Header";

// Adjusted data structure to match your serializer output
interface FileLog {
    id: number;
    file: string;           // The working URL to the file for download/viewing
    file_name: string;      // Just the filename, no path or URL
    uploaded_at: string;
    blockchain_hash: string;
}

interface DRFListResponse {
    results: FileLog[];
}

const Audit = () => {
    const [logs, setLogs] = useState<FileLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch("/api/files");
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const rawData = await response.json();

                let fileList: FileLog[] = [];
                if (Array.isArray(rawData)) {
                    fileList = rawData;
                } else if (rawData && Array.isArray(rawData.results)) {
                    fileList = rawData.results;
                }

                setLogs(fileList);
            } catch (error) {
                console.error("❌ Fatal Error during fetch or JSON parse:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // No need to construct/modify the URL, the backend sends the correct one
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">
                        Blockchain <span className="bg-gradient-crypto bg-clip-text text-transparent">Audit Trail</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Immutable records of all file operations and transactions
                    </p>
                </div>

                <div className="bg-vault-surface p-8 rounded-xl border border-vault-border">
                    {loading ? (
                        <p className="text-center text-muted-foreground">Loading Secure Ledger...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-muted-foreground">No files have been recorded to the ledger yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 border rounded-lg shadow-sm">
                                    <div className="flex items-center space-x-3 text-lg font-semibold text-primary mb-2">
                                        <FileText className="h-5 w-5"/>
                                        <span>Record ID: {log.id}</span>
                                    </div>
                                    
                                    {/* File download link: shows filename, link works */}
                                    <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                                        <LinkIcon className="h-4 w-4"/>
                                        <a 
                                            href={log.file} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="underline hover:text-white transition-colors truncate max-w-lg"
                                        >
                                            {log.file_name}
                                        </a>
                                    </div>
                                    
                                    {/* Blockchain hash */}
                                    <div className="text-xs text-security-green flex items-center space-x-2">
                                        <Lock className="h-4 w-4"/>
                                        <span className="font-mono">
                                            Hash: {log.blockchain_hash || 'N/A (Update Hash)'}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground pt-1">
                                        Uploaded: {new Date(log.uploaded_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Audit;
