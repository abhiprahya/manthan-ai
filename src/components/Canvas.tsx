
import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import ThoughtNode from './ThoughtNode';
import CardNode from './CardNode';
import { Position, NodeType } from '@/types/models';
import { Plus } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const Canvas: React.FC = () => {
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
    
    const newNodeId = addNode("Add your thought here", { x, y }, false, 'text');
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
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (rect.width / 2 - offset.x) / scale;
      const y = (rect.height / 2 - offset.y) / scale;
      
      let content = "";
      switch (type) {
        case 'text':
          content = "Add your thought here";
          break;
        case 'image':
          content = "Image";
          break;
        case 'video':
          content = "Video";
          break;
        case 'document':
          content = "Document";
          break;
        case 'url':
          content = "Add URL";
          break;
      }
      
      const newNodeId = addNode(content, { x, y }, false, type);
      selectNode(newNodeId);
    }
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
      
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => createNode('text')}>
              Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createNode('image')}>
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createNode('video')}>
              Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createNode('document')}>
              Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createNode('url')}>
              URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg shadow-md text-sm">
          Select another node to connect or press ESC to cancel
        </div>
      )}
    </div>
  );
};

export default Canvas;
