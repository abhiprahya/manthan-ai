
export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export type NodeType = 'text' | 'image' | 'video' | 'document' | 'url';

export interface Media {
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
  size?: number;
}

export interface ThoughtNode {
  id: string;
  content: string;
  position: Position;
  isAI: boolean;
  createdAt: Date;
  type: NodeType;
  media?: Media;
  url?: string;
}

export interface Canvas {
  nodes: ThoughtNode[];
  connections: Connection[];
}
