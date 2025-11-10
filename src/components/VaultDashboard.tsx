import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import Header from "./Header";
import UserProfile from "./UserProfile";
import FileUpload from "./FileUpload";
import FileCard from "./FileCard";
import Footer from "./Footer";
import { useAuth } from '../context/AuthContext'; // <-- Import the Auth hook

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
    // NOTE: This endpoint needs to be created in your Django backend!
    const API_URL = 'http://127.0.0.1:8000/api/v1/files/'; 

    useEffect(() => {
        // --- AUTHENTICATION GUARD ---
        if (!isAuthenticated) {
            // If the user is not logged in, redirect them to the login page
            navigate('/login'); 
            return;
        }

        const fetchFiles = async () => {
            try {
                const response = await fetch(API_URL, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // CRITICAL: Send the Access Token for authentication
                        'Authorization': `Bearer ${accessToken}`, 
                    },
                });

                if (response.status === 401) {
                     // Handle token expiration/unauthorized access
                    throw new Error('Unauthorized or session expired.');
                }
                
                // Assuming your API returns an array of files
                const data: FileData[] = await response.json();
                setFiles(data);
            } catch (error) {
                console.error("Error fetching vault data:", error);
                // Optionally log out the user if the token is completely invalid
                // logout(); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchFiles();
    }, [isAuthenticated, accessToken, navigate]); // Dependencies: Re-run when auth state changes

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Vault...</div>;
    }

    // Fallback if somehow authenticated but no username
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
                    <FileUpload />
                </section> 	

                {/* 2. Files Grid Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-foreground flex items-center">
                            {/* DYNAMIC USERNAME DISPLAY */}
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