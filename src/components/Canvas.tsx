import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import ThoughtNode from './ThoughtNode';
import CardNode from './CardNode';
import { Position, NodeType, WorkflowExport, LanguageCode } from '@/types/models';
import { Plus, Download, Languages, Settings, Users, Layers, TrendingUp, Sparkles } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface CanvasProps {
  onCreateContent?: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ onCreateContent }) => {
  const {
    nodes,
    connections,
    selectedNodeId,
    addNode,
    selectNode,
    addConnection,
    getRelatedNodes,
  } = useCanvas();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [connectionLine, setConnectionLine] = useState<{start: Position, end: Position} | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'insights' | 'export'>('templates');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Handle canvas pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only proceed if it's the main canvas being clicked (not a child element)
    if (e.target !== canvasRef.current) return;
    
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    selectNode(null);
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (!isDraggingCanvas || !dragStart) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setOffset({
      x: offset.x + dx,
      y: offset.y + dy,
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    setDragStart(null);
  };
  
  useEffect(() => {
    if (isDraggingCanvas) {
      window.addEventListener('mousemove', handleCanvasMouseMove);
      window.addEventListener('mouseup', handleCanvasMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [isDraggingCanvas, dragStart]);
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY;
    const newScale = delta > 0 
      ? Math.max(0.5, scale - 0.05) 
      : Math.min(2, scale + 0.05);
    
    setScale(newScale);
  };
  
  // Handle double click to create a new node
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only proceed if it's the main canvas being clicked (not a child element)
    if (e.target !== canvasRef.current) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    
    const newNodeId = addNode("Add your content here", { x, y }, false, 'text');
    selectNode(newNodeId);
  };
  
  // Track mouse position for connection line drawing
  const handleCanvasMouseMoveForConnection = (e: React.MouseEvent) => {
    if (isConnecting && sourceNodeId) {
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      if (!sourceNode) return;
      
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;
      
      const sourceX = sourceNode.position.x + 144; // Center of node
      const sourceY = sourceNode.position.y + 30;
      
      setConnectionLine({
        start: { x: sourceX, y: sourceY },
        end: { x, y }
      });
    }
  };
  
  // Handle connection between nodes
  const startConnecting = (nodeId: string) => {
    setIsConnecting(true);
    setSourceNodeId(nodeId);
  };
  
  const handleNodeClick = (nodeId: string) => {
    if (isConnecting && sourceNodeId && sourceNodeId !== nodeId) {
      addConnection(sourceNodeId, nodeId);
      setIsConnecting(false);
      setSourceNodeId(null);
      setConnectionLine(null);
    }
  };
  
  const cancelConnection = () => {
    setIsConnecting(false);
    setSourceNodeId(null);
    setConnectionLine(null);
  };
  
  // Listen for escape key to cancel connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnecting) {
        cancelConnection();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnecting]);
  
  // Get related nodes for highlighting connections
  const relatedNodeIds = selectedNodeId ? getRelatedNodes(selectedNodeId) : [];
  
  // Render connections between nodes
  const renderConnections = () => {
    return connections.map((connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.sourceId);
      const targetNode = nodes.find((node) => node.id === connection.targetId);
      
      if (!sourceNode || !targetNode) return null;
      
      // Calculate center points of nodes
      const sourceX = sourceNode.position.x + 144; // Half of node width (288/2)
      const sourceY = sourceNode.position.y + 30; // Approximation of vertical center
      const targetX = targetNode.position.x + 144;
      const targetY = targetNode.position.y + 30;
      
      // Create curved path
      const path = `M ${sourceX} ${sourceY} C ${(sourceX + targetX) / 2} ${sourceY}, ${(sourceX + targetX) / 2} ${targetY}, ${targetX} ${targetY}`;
      
      const isHighlighted = 
        selectedNodeId && 
        (selectedNodeId === connection.sourceId || selectedNodeId === connection.targetId);
      
      return (
        <svg 
          key={connection.id} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ 
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            zIndex: 0
          }}
        >
          <path
            d={path}
            stroke={isHighlighted ? "#ff7a00" : "#cbd5e1"}
            strokeWidth="2"
            fill="none"
            strokeDasharray={isHighlighted ? "none" : "none"}
          />
        </svg>
      );
    });
  };
  
  // Render the dynamic connection line
  const renderConnectionLine = () => {
    if (!connectionLine) return null;
    
    const { start, end } = connectionLine;
    
    // Create curved path
    const path = `M ${start.x} ${start.y} C ${(start.x + end.x) / 2} ${start.y}, ${(start.x + end.x) / 2} ${end.y}, ${end.x} ${end.y}`;
    
    return (
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ 
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          zIndex: 0
        }}
      >
        <path
          d={path}
          stroke="#ff7a00"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
      </svg>
    );
  };
  
  // Create a new node with the specified type
  const createNode = (type: NodeType) => {
    if (onCreateContent) {
      onCreateContent();
    } else {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (rect.width / 2 - offset.x) / scale;
        const y = (rect.height / 2 - offset.y) / scale;
        
        let content = "";
        switch (type) {
          case 'text':
            content = "Add your content here";
            break;
          case 'image':
            content = "Image";
            break;
          case 'video':
            content = "Video";
            break;
          case 'audio':
            content = "Audio";
            break;
          case 'document':
            content = "Document";
            break;
          case 'url':
            content = "Add URL";
            break;
          case 'template':
            content = "Choose a template";
            break;
        }
        
        const newNodeId = addNode(content, { x, y }, false, type);
        selectNode(newNodeId);
      }
    }
  };
  
  // New functions for enterprise features
  const handleExport = (format: WorkflowExport['format']) => {
    const exportData = {
      nodes: nodes.map(node => ({
        ...node,
        metadata: node.metadata || {
          title: node.content.substring(0, 30),
          tags: [],
          dateCreated: node.createdAt,
          aiGenerated: node.isAI
        }
      })),
      connections
    };

    const dataString = format === 'json' 
      ? JSON.stringify(exportData, null, 2)
      : format === 'markdown'
        ? convertToMarkdown(exportData)
        : format === 'html'
          ? convertToHtml(exportData)
          : convertToXml(exportData);
          
    const blob = new Blob([dataString], { type: `text/${format === 'json' ? 'json' : format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manthan-export-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Content exported successfully as ${format.toUpperCase()}`);
  };
  
  const convertToMarkdown = (data: any) => {
    // Simple example of markdown export
    let md = `# Manthan.AI Content Export\n\n`;
    data.nodes.forEach((node: any) => {
      md += `## ${node.metadata?.title || 'Untitled Node'}\n\n`;
      md += `${node.content}\n\n`;
      if (node.metadata?.tags?.length) {
        md += `Tags: ${node.metadata.tags.join(', ')}\n\n`;
      }
    });
    return md;
  };
  
  const convertToHtml = (data: any) => {
    // Simple example of HTML export
    let html = `<!DOCTYPE html><html><head><title>Manthan.AI Export</title></head><body>`;
    data.nodes.forEach((node: any) => {
      html += `<div class="node ${node.type}">`;
      html += `<h2>${node.metadata?.title || 'Untitled Node'}</h2>`;
      html += `<p>${node.content}</p>`;
      if (node.media) {
        if (node.media.type === 'image') {
          html += `<img src="${node.media.url}" alt="${node.metadata?.title || 'Image'}"/>`;
        } else if (node.media.type === 'video') {
          html += `<video controls src="${node.media.url}"></video>`;
        }
      }
      html += '</div>';
    });
    html += `</body></html>`;
    return html;
  };
  
  const convertToXml = (data: any) => {
    // Simple example of XML export
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<export>\n`;
    data.nodes.forEach((node: any) => {
      xml += `  <node type="${node.type}">\n`;
      xml += `    <title>${node.metadata?.title || 'Untitled Node'}</title>\n`;
      xml += `    <content>${node.content}</content>\n`;
      if (node.media) {
        xml += `    <media type="${node.media.type}" url="${node.media.url}" />\n`;
      }
      if (node.metadata?.tags?.length) {
        xml += `    <tags>\n`;
        node.metadata.tags.forEach((tag: string) => {
          xml += `      <tag>${tag}</tag>\n`;
        });
        xml += `    </tags>\n`;
      }
      xml += `  </node>\n`;
    });
    xml += `</export>`;
    return xml;
  };

  const handleLanguageChange = (language: LanguageCode) => {
    setSelectedLanguage(language);
    toast.info(`Language switched to ${getLanguageName(language)}`);
  };
  
  const getLanguageName = (code: LanguageCode): string => {
    const names: Record<LanguageCode, string> = {
      en: 'English',
      hi: 'Hindi',
      bn: 'Bengali',
      te: 'Telugu',
      ta: 'Tamil',
      mr: 'Marathi',
      gu: 'Gujarati',
      kn: 'Kannada',
      ml: 'Malayalam',
      pa: 'Punjabi'
    };
    return names[code];
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden canvas-grid"
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleCanvasMouseMoveForConnection}
      ref={canvasRef}
      style={{ cursor: isDraggingCanvas ? 'grabbing' : 'default' }}
    >
      <div 
        className="absolute w-full h-full transform origin-top-left"
        style={{ 
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` 
        }}
      >
        {renderConnections()}
        {renderConnectionLine()}
        
        {nodes.map((node) => (
          <div key={node.id} onClick={() => handleNodeClick(node.id)}>
            {node.type === 'text' ? (
              <ThoughtNode
                id={node.id}
                content={node.content}
                position={node.position}
                isAI={node.isAI}
                isSelected={selectedNodeId === node.id}
                isConnecting={isConnecting && sourceNodeId !== node.id}
                onStartConnecting={() => startConnecting(node.id)}
              />
            ) : (
              <CardNode
                id={node.id}
                content={node.content}
                position={node.position}
                type={node.type}
                media={node.media}
                url={node.url}
                isSelected={selectedNodeId === node.id}
                isConnecting={isConnecting && sourceNodeId !== node.id}
                onStartConnecting={() => startConnecting(node.id)}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Enterprise Toolbar */}
      <div className="absolute top-4 left-4 flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="bg-primary/10 text-primary px-3 py-2 rounded-md hover:bg-primary/20 transition-colors flex items-center space-x-2"
            >
              <Languages className="h-4 w-4" />
              <span>Language: {getLanguageName(selectedLanguage)}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleLanguageChange('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('hi')}>Hindi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('bn')}>Bengali</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('te')}>Telugu</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('ta')}>Tamil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('mr')}>Marathi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('gu')}>Gujarati</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('kn')}>Kannada</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('ml')}>Malayalam</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange('pa')}>Punjabi</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="bg-primary/10 text-primary px-3 py-2 rounded-md hover:bg-primary/20 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('json')}>Export as JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('markdown')}>Export as Markdown</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('html')}>Export as HTML</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('xml')}>Export as XML</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <button 
          className="bg-primary/10 text-primary px-3 py-2 rounded-md hover:bg-primary/20 transition-colors flex items-center space-x-2"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Insights</span>
        </button>
      </div>
      
      {/* Create Content Button */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button 
          className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors flex gap-2 items-center px-5"
          onClick={() => onCreateContent ? onCreateContent() : createNode('text')}
        >
          <Sparkles className="h-5 w-5" />
          <span>Create Content</span>
        </button>
      </div>
      
      {/* Connection Notification */}
      {isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg shadow-md text-sm">
          Select another node to connect or press ESC to cancel
        </div>
      )}

      {/* Enterprise Panel - kept for insights */}
      {isPanelOpen && (
        <div className="absolute top-16 left-4 w-[350px] bg-background border rounded-lg shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Content Insights & Tools</h3>
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsPanelOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="insights" className="flex-1">Insights</TabsTrigger>
              <TabsTrigger value="metadata" className="flex-1">Metadata</TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Performance Prediction</h4>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Estimated Engagement: 75%</span>
                  <span>Great</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Regional Trends</h4>
                <div className="space-y-2">
                  {['Digital Storytelling', 'Regional Cooking', 'Tech Reviews', 'Local Tourism'].map((trend) => (
                    <div key={trend} className="flex justify-between items-center">
                      <span className="text-xs">{trend}</span>
                      <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${Math.floor(Math.random() * 60 + 40)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Suggested Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {['content', 'indic', 'creator', 'ai', 'regional'].map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="metadata" className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Rights Management</h4>
                <div className="flex gap-2">
                  <Badge>CC BY-NC</Badge>
                  <Badge variant="outline">Attribution Required</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied to all AI-generated content by default
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Monetization Settings</h4>
                <div className="flex justify-between text-xs items-center">
                  <span>Suggested Price</span>
                  <Badge variant="outline">₹350 - ₹500</Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Canvas;
