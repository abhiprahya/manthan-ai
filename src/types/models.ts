
export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export type NodeType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio'
  | 'document' 
  | 'url'
  | 'template';

export type LanguageCode = 
  | 'en' // English
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'te' // Telugu
  | 'ta' // Tamil
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa'; // Punjabi

export interface Media {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name: string;
  size?: number;
  languageCode?: LanguageCode; 
  metadata?: ContentMetadata;
}

export interface ContentMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  rights?: string;
  attribution?: string;
  engagementScore?: number;
  suggestedPrice?: number;
  dateCreated?: Date;
  language?: LanguageCode;
  aiGenerated?: boolean;
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
  metadata?: ContentMetadata;
  languageCode?: LanguageCode;
  templateId?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: NodeType;
  content: string;
  thumbnailUrl?: string;
  metadata?: ContentMetadata;
}

export interface Canvas {
  nodes: ThoughtNode[];
  connections: Connection[];
}

export interface WorkflowExport {
  type: 'cms' | 'ott' | 'social-media' | 'article';
  format: 'json' | 'xml' | 'html' | 'markdown';
  includeMetadata: boolean;
}

export interface InsightMetrics {
  views?: number;
  engagement?: number;
  predictedPerformance?: number;
  trendsData?: {
    keyword: string;
    score: number;
  }[];
}
