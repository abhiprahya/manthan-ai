
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ThoughtNode, Connection, Position } from '@/types/models';
import { v4 as uuidv4 } from 'uuid';

interface CanvasContextType {
  nodes: ThoughtNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  addNode: (content: string, position: Position, isAI?: boolean) => string;
  updateNodePosition: (id: string, position: Position) => void;
  updateNodeContent: (id: string, content: string) => void;
  deleteNode: (id: string) => void;
  addConnection: (sourceId: string, targetId: string) => void;
  deleteConnection: (id: string) => void;
  selectNode: (id: string | null) => void;
  getRelatedNodes: (nodeId: string) => string[];
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<ThoughtNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const addNode = (content: string, position: Position, isAI = false): string => {
    const id = uuidv4();
    const newNode: ThoughtNode = {
      id,
      content,
      position,
      isAI,
      createdAt: new Date(),
    };
    
    setNodes((prevNodes) => [...prevNodes, newNode]);
    return id;
  };

  const updateNodePosition = (id: string, position: Position) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, position } : node
      )
    );
  };

  const updateNodeContent = (id: string, content: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, content } : node
      )
    );
  };

  const deleteNode = (id: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
    setConnections((prevConnections) =>
      prevConnections.filter(
        (connection) => connection.sourceId !== id && connection.targetId !== id
      )
    );
  };

  const addConnection = (sourceId: string, targetId: string) => {
    // Prevent connections to self
    if (sourceId === targetId) return;
    
    // Prevent duplicate connections
    const existingConnection = connections.find(
      (conn) => conn.sourceId === sourceId && conn.targetId === targetId
    );
    
    if (existingConnection) return;
    
    const newConnection: Connection = {
      id: uuidv4(),
      sourceId,
      targetId,
    };
    
    setConnections((prevConnections) => [...prevConnections, newConnection]);
  };

  const deleteConnection = (id: string) => {
    setConnections((prevConnections) =>
      prevConnections.filter((connection) => connection.id !== id)
    );
  };

  const selectNode = (id: string | null) => {
    setSelectedNodeId(id);
  };

  const getRelatedNodes = (nodeId: string): string[] => {
    const related: string[] = [];
    
    connections.forEach((connection) => {
      if (connection.sourceId === nodeId && !related.includes(connection.targetId)) {
        related.push(connection.targetId);
      } else if (connection.targetId === nodeId && !related.includes(connection.sourceId)) {
        related.push(connection.sourceId);
      }
    });
    
    return related;
  };

  return (
    <CanvasContext.Provider
      value={{
        nodes,
        connections,
        selectedNodeId,
        addNode,
        updateNodePosition,
        updateNodeContent,
        deleteNode,
        addConnection,
        deleteConnection,
        selectNode,
        getRelatedNodes,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};
