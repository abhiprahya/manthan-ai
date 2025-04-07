
import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import { Position, Media, NodeType } from '@/types/models';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, MoreHorizontal, Link, Image, Video, Upload, FileText } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { uploadFile } from '@/utils/fileUpload';

interface CardNodeProps {
  id: string;
  content: string;
  position: Position;
  type: NodeType;
  media?: Media;
  url?: string;
  isSelected: boolean;
  isConnecting: boolean;
  onStartConnecting: () => void;
}

const CardNode: React.FC<CardNodeProps> = ({
  id,
  content,
  position,
  type,
  media,
  url,
  isSelected,
  isConnecting,
  onStartConnecting
}) => {
  const { 
    updateNodePosition, 
    updateNodeContent, 
    updateNodeMedia,
    updateNodeUrl,
    deleteNode, 
    selectNode 
  } = useCanvas();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editUrl, setEditUrl] = useState(url || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    e.stopPropagation();
    selectNode(id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    updateNodePosition(id, {
      x: position.x + dx,
      y: position.y + dy,
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(content);
    setEditUrl(url || '');
  };

  const handleSave = () => {
    updateNodeContent(id, editContent);
    if (type === 'url' && editUrl) {
      updateNodeUrl(id, editUrl);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteNode(id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      const fileType = file.type.split('/')[0];
      if ((type === 'image' && !file.type.startsWith('image/')) ||
          (type === 'video' && !file.type.startsWith('video/')) ||
          (type === 'document' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type))) {
        toast.error(`Invalid file type for ${type} node.`);
        return;
      }
      
      // In a real app, this would upload to a server
      const url = await uploadFile(file);
      
      // Update node with media info
      updateNodeMedia(id, {
        type: fileType as 'image' | 'video' | 'document',
        url,
        name: file.name,
        size: file.size
      });
      
      toast.success(`${file.name} uploaded successfully.`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      handleFileUpload(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const renderCardContent = () => {
    if (isEditing) {
      if (type === 'url') {
        return (
          <div className="space-y-2">
            <Input
              ref={urlInputRef}
              type="text"
              placeholder="Enter URL"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="w-full"
            />
            <Input
              type="text"
              placeholder="Description (optional)"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-end space-x-2">
              <button 
                className="px-2 py-1 text-xs bg-muted rounded"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Description"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full"
          />
          <div className="flex justify-end space-x-2">
            <button 
              className="px-2 py-1 text-xs bg-muted rounded"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button 
              className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'image':
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPaste={handlePaste}
          >
            {media ? (
              <div className="w-full">
                <img 
                  src={media.url} 
                  alt={content || media.name} 
                  className="w-full h-auto max-h-40 object-contain rounded-md" 
                />
                <p className="mt-2 text-sm text-center">{content || media.name}</p>
              </div>
            ) : (
              <div 
                className="w-full h-32 flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed border-muted rounded-md cursor-pointer"
                onClick={triggerFileInput}
              >
                <Image className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Click or drop image here</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPaste={handlePaste}
          >
            {media ? (
              <div className="w-full">
                <video 
                  src={media.url}
                  controls
                  className="w-full h-auto max-h-40 object-contain rounded-md" 
                />
                <p className="mt-2 text-sm text-center">{content || media.name}</p>
              </div>
            ) : (
              <div 
                className="w-full h-32 flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed border-muted rounded-md cursor-pointer"
                onClick={triggerFileInput}
              >
                <Video className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Click or drop video here</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        );
        
      case 'document':
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPaste={handlePaste}
          >
            {media ? (
              <div className="w-full flex items-center space-x-3 p-2 bg-muted/20 rounded-md">
                <FileText className="h-8 w-8 flex-shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{media.name}</p>
                  <p className="text-xs text-muted-foreground">{content}</p>
                </div>
                <a 
                  href={media.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                >
                  Open
                </a>
              </div>
            ) : (
              <div 
                className="w-full h-32 flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed border-muted rounded-md cursor-pointer"
                onClick={triggerFileInput}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Click or drop document here</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        );
        
      case 'url':
        return (
          <div className="w-full">
            {url ? (
              <div className="space-y-2">
                <div className="border rounded p-2 bg-muted/20">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all text-sm"
                  >
                    {url}
                  </a>
                </div>
                {content && <p className="text-sm">{content}</p>}
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-muted-foreground">Click edit to add a URL</p>
              </div>
            )}
          </div>
        );
        
      default:
        return <p className="text-sm">{content}</p>;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'url':
        return <Link className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute transform transition-all",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isSelected ? 10 : 1,
        width: '288px', // Match ThoughtNode width for consistency
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <Card className={cn(
        "border shadow-sm",
        isSelected && "ring-2 ring-primary",
        isConnecting && "ring-2 ring-orange-400",
        isUploading && "opacity-70"
      )}>
        <CardContent className="p-4">
          {isUploading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm animate-pulse">Uploading...</p>
            </div>
          ) : (
            renderCardContent()
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center p-2 pt-0 border-t bg-card/50">
          <div className="flex items-center space-x-1 text-xs opacity-70">
            {getTypeIcon()}
            <span className="capitalize">{type}</span>
          </div>
          
          <div className="flex space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStartConnecting}>
                  <Link className="mr-2 h-4 w-4" />
                  Connect
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CardNode;
