import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "./Header";
import UserProfile from "./UserProfile";
import { UploadZone } from "@/components/UploadZone"; // <-- Use UploadZone here!
import FileCard from "./FileCard";
import Footer from "./Footer";
import { useAuth } from '../context/AuthContext';

// Mock data structure (replace with your actual API response type)
interface FileData {
  id: string;
  name: string;
  uploadDate: string;
  encryptionType: string;
  blockchainStatus: string;
  syncStatus: string;
  size: string;
}

const VaultDashboard = () => {
  // 1. Get dynamic user state from context
  const { isAuthenticated, accessToken, username } = useAuth(); 
  console.log("VaultDashboard Retrieved Username:", username);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  // Placeholder API endpoint for fetching the user's files
  const API_URL = 'http://127.0.0.1:8000/api/v1/files/'; 

  useEffect(() => {
    // --- AUTHENTICATION GUARD ---
    if (!isAuthenticated) {
      navigate('/login'); 
      return;
    }

    const fetchFiles = async () => {
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`, 
          },
        });

        if (response.status === 401) {
          throw new Error('Unauthorized or session expired.');
        }
        
        const data: FileData[] = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Error fetching vault data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [isAuthenticated, accessToken, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Vault...</div>;
  }

  const displayUsername = username || 'User'; 

  return (
    <div className="min-h-screen bg-background bg-cover bg-center">
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* 1. User Profile Section: Pass the dynamic username */}
        <UserProfile username={displayUsername} /> 

        {/* Upload Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            Upload Files
            <div className="ml-2 h-px flex-1 bg-gradient-primary opacity-90" />
          </h2>
          <UploadZone />
        </section>  

        {/* 2. Files Grid Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center">
              {displayUsername}'s Vault 
              <span className="ml-3 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                {files.length} files
              </span>
              <div className="ml-4 h-px flex-1 bg-gradient-primary opacity-30" />
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
            {files.length === 0 && <p className="text-muted-foreground">No files found.</p>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default VaultDashboard;
