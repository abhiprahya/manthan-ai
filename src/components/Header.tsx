
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCanvas } from '@/contexts/CanvasContext';
import { Sparkles, Save, FileDown, Settings, Plus, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

const Header: React.FC = () => {
  const { nodes, connections } = useCanvas();

  const handleNewProject = () => {
    // In a real app, you would provide a confirmation dialog first
    window.location.reload();
  };

  const handleSaveProject = () => {
    const project = {
      nodes,
      connections,
      version: 1,
      savedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `manthan-ai-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success("Project saved successfully!");
  };

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-medium">Manthan.AI</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleNewProject}
          className="hidden sm:flex gap-1 items-center"
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSaveProject}
          className="hidden sm:flex gap-1 items-center"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="sm:hidden flex gap-2 items-center"
              onClick={handleNewProject}
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="sm:hidden flex gap-2 items-center"
              onClick={handleSaveProject}
            >
              <Save className="h-4 w-4" />
              <span>Save Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex gap-2 items-center"
              onClick={() => toast.info("Export feature coming soon!")}
            >
              <FileDown className="h-4 w-4" />
              <span>Export as Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex gap-2 items-center"
              onClick={() => toast.info("Settings feature coming soon!")}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
