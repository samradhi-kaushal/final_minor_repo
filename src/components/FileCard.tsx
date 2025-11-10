import { File, Calendar, HardDrive, Eye, Download, Share2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";

interface FileData {
  id: string;
  name: string;
  uploadDate: string;
  encryptionType: string;
  blockchainStatus: string;
  syncStatus: string;
  size: string;
}

interface FileCardProps {
  file: FileData;
}

const FileCard = ({ file }: FileCardProps) => {
  return (
    <Card className=" bg-card/90 backdrop-blur-md 
  border border-border/50 
  rounded-2xl p-4 
  shadow-lg hover:shadow-glow 
  hover:ring-1 hover:ring-primary/50 
  transition-all duration-300 group">
      <div className="space-y-4">
        {/* File Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-gradient-primary group-hover:shadow-glow transition-all duration-300">
              <File className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground truncate max-w-[200px]" title={file.name}>
                {file.name}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{file.uploadDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <HardDrive className="h-3 w-3" />
            <span>{file.size}</span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge type="encryption" status={file.encryptionType} />
          <StatusBadge type="blockchain" status={file.blockchainStatus} />
          <StatusBadge type="sync" status={file.syncStatus} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 hover:bg-primary/20 hover:text-primary transition-all duration-300"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 hover:bg-accent/20 hover:text-accent transition-all duration-300"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 hover:bg-secondary/20 hover:text-secondary transition-all duration-300"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="hover:bg-destructive/20 hover:text-destructive transition-all duration-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FileCard;