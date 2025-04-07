
import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import { Position } from '@/types/models';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, MoreHorizontal, Link } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface ThoughtNodeProps {
  id: string;
  content: string;
  position: Position;
  isAI: boolean;
  isSelected: boolean;
  isConnecting: boolean;
  onStartConnecting: () => void;
}

const ThoughtNode: React.FC<ThoughtNodeProps> = ({
  id,
  content,
  position,
  isAI,
  isSelected,
  isConnecting,
  onStartConnecting
}) => {
  const { 
    updateNodePosition, 
    updateNodeContent, 
    deleteNode, 
    selectNode 
  } = useCanvas();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
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
  };

  const handleSave = () => {
    updateNodeContent(id, editContent);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteNode(id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(content);
    }
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        "thought-node absolute p-4 rounded-lg shadow-md w-72 transform transition-all",
        isAI ? "bg-canvas-ai-node text-canvas-ai-node-foreground" : "bg-canvas-node text-canvas-node-foreground",
        isSelected && "ring-2 ring-primary",
        isConnecting && "ring-2 ring-orange-400",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            className="w-full h-24 p-2 text-sm rounded-md border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            onBlur={handleSave}
          />
          <div className="flex justify-end">
            <button
              className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm whitespace-pre-wrap break-words">
            {content}
          </div>
          <div className="flex justify-between items-center mt-4">
            {isAI && (
              <div className="text-xs opacity-70">AI</div>
            )}
            <div className="flex space-x-1 ml-auto">
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
          </div>
        </>
      )}
    </div>
  );
};

export default ThoughtNode;
