
import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import ThoughtNode from './ThoughtNode';
import { Position } from '@/types/models';
import { Plus } from 'lucide-react';

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
    
    const newNodeId = addNode("Add your thought here", { x, y });
    selectNode(newNodeId);
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
    }
  };
  
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
            className={`canvas-connection ${isHighlighted ? 'highlighted' : ''}`}
          />
        </svg>
      );
    });
  };
  
  return (
    <div 
      className="relative w-full h-full overflow-hidden canvas-grid"
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onDoubleClick={handleDoubleClick}
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
        
        {nodes.map((node) => (
          <div key={node.id} onClick={() => handleNodeClick(node.id)}>
            <ThoughtNode
              id={node.id}
              content={node.content}
              position={node.position}
              isAI={node.isAI}
              isSelected={selectedNodeId === node.id}
              isConnecting={isConnecting && sourceNodeId !== node.id}
              onStartConnecting={() => startConnecting(node.id)}
            />
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button 
          className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          onClick={() => {
            if (canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const x = (rect.width / 2 - offset.x) / scale;
              const y = (rect.height / 2 - offset.y) / scale;
              
              const newNodeId = addNode("Add your thought here", { x, y });
              selectNode(newNodeId);
            }
          }}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      
      {isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg shadow-md text-sm">
          Select another node to connect
        </div>
      )}
    </div>
  );
};

export default Canvas;
