
export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface ThoughtNode {
  id: string;
  content: string;
  position: Position;
  isAI: boolean;
  createdAt: Date;
}

export interface Canvas {
  nodes: ThoughtNode[];
  connections: Connection[];
}
