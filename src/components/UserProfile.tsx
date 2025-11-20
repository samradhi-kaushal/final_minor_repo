import { User, HardDrive, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UserProfileProps {
    username: string; // This is the user's ID/email passed from VaultDashboard
}

const UserProfile: React.FC<UserProfileProps> = ({ username }) => {
    // Note: In a real app, storage data (storageUsed, storageTotal) should also be fetched
    // from your Django API and passed as props or fetched inside this component.
    const storageUsed = 2.4;
    const storageTotal = 100;
    const storagePercentage = (storageUsed / storageTotal) * 100;

    return (
        <Card className="bg-gradient-cyber border-border/50 p-6 shadow-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                        <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                    
                    <div className="space-y-1">
                        {/* 🔑 FIX: Display the dynamic username/ID prominently in the h2 tag */}
                        <h2 className="text-2xl font-bold text-foreground">{username}  :-)</h2> 
                        
                        
                    </div>
                </div>

                
            </div>
        </Card>
    );
};

export default UserProfile;