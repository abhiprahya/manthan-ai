import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import { generateAiResponse, generateImage, analyzeContent } from '@/services/aiService';
import { Position, NodeType, LanguageCode, Template } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ApiKeyManager from '@/components/ApiKeyManager';
import {
  SendHorizonal,
  Bot,
  Lightbulb,
  Image,
  Video,
  FileText,
  Link,
  AudioLines,
  Languages,
  Layout,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample templates for the starter
const SAMPLE_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Social Media Post',
    description: 'Create engaging social media content',
    type: 'text',
    content: 'Create a social media post about [topic] targeting [audience].',
    thumbnailUrl: 'https://via.placeholder.com/100'
  },
  {
    id: '2',
    name: 'Video Script',
    description: 'Script template for video creation',
    type: 'text',
    content: 'INTRODUCTION:\n\n[Hook to grab attention]\n\nMAIN CONTENT:\n\n[Key points to cover]\n\nCONCLUSION:\n\n[Call to action]',
    thumbnailUrl: 'https://via.placeholder.com/100'
  },
  {
    id: '3',
    name: 'Blog Article',
    description: 'Structure for blog content',
    type: 'text',
    content: '# [TITLE]\n\n## Introduction\n[Set the context for your article]\n\n## Main Point 1\n[Expand on your first key point]\n\n## Main Point 2\n[Expand on your second key point]\n\n## Main Point 3\n[Expand on your third key point]\n\n## Conclusion\n[Summarize main points and provide next steps]',
    thumbnailUrl: 'https://via.placeholder.com/100'
  },
  {
    id: '4',
    name: 'News Story',
    description: 'Structure for news articles',
    type: 'text',
    content: 'HEADLINE: [Attention-grabbing headline]\n\nLEAD: [Summarize who, what, when, where, why in 1-2 sentences]\n\nBODY: [Expand with details in order of importance]\n\nQUOTES: [Include relevant quotes]\n\nBACKGROUND: [Provide context]\n\nCONCLUSION: [End with impact or future implications]',
    thumbnailUrl: 'https://via.placeholder.com/100'
  }
];

const AiAssistant: React.FC = () => {
  const { addNode, selectedNodeId, nodes } = useCanvas();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [activeTab, setActiveTab] = useState<'prompt' | 'templates' | 'insights'>('prompt');
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    // Get a position near the selected node, or a default position
    let position: Position;
    
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        position = {
          x: selectedNode.position.x + 300,
          y: selectedNode.position.y,
        };
      } else {
        position = { x: 300, y: 300 };
      }
    } else {
      position = { x: 300, y: 300 };
    }
    
    setIsLoading(true);
    
    try {
      const response = await generateAiResponse(prompt, selectedLanguage);
      
      // Add the user's thought
      const userNodeId = addNode(prompt, position, false, 'text');
      
      // Add the AI's response below the user's thought
      const aiNodeId = addNode(response.content, {
        x: position.x,
        y: position.y + 150,
      }, true, 'text');

      // Add metadata to AI node
      updateNodeMetadata(aiNodeId, {
        aiGenerated: true,
        language: selectedLanguage,
        dateCreated: new Date()
      });
      
      setPrompt('');
      toast.success("AI responded to your thought!");
    } catch (error) {
      console.error("Failed to get AI response:", error);
      toast.error("Failed to generate AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateIdea = async () => {
    setIsLoading(true);
    
    try {
      const response = await generateAiResponse(`Generate a creative idea in ${getLanguageName(selectedLanguage)}`, selectedLanguage);
      
      // Find a free spot on the canvas
      const position = { x: 400, y: 200 };
      
      // Add the AI's idea
      const nodeId = addNode(response.content, position, true, 'text');
      
      // Add metadata
      updateNodeMetadata(nodeId, {
        aiGenerated: true,
        language: selectedLanguage,
        dateCreated: new Date()
      });
      
      toast.success("New idea generated!");
    } catch (error) {
      console.error("Failed to generate idea:", error);
      toast.error("Failed to generate idea. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContent = (type: NodeType) => {
    // Find a position for the new node
    let position: Position = { x: 300, y: 300 };
    
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        position = {
          x: selectedNode.position.x + 300,
          y: selectedNode.position.y,
        };
      }
    }
    
    // Create a new node of the specified type
    const nodeId = addNode(`New ${type}`, position, false, type);
    toast.success(`Created new ${type} card`);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value as LanguageCode);
    toast.info(`Language switched to ${getLanguageName(value as LanguageCode)}`);
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

  const handleUseTemplate = (template: Template) => {
    // Find a position for the new node
    let position: Position = { x: 300, y: 300 };
    
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        position = {
          x: selectedNode.position.x + 300,
          y: selectedNode.position.y,
        };
      }
    }
    
    // Create a new node based on the template
    const nodeId = addNode(template.content, position, false, 'text');
    toast.success(`Template "${template.name}" applied`);
  };

  const handleGenerateImage = async () => {
    if (!selectedNodeId) {
      toast.warning("Please select a node with text prompt first");
      return;
    }
    
    const selectedNode = nodes.find(node => node.id === selectedNodeId);
    if (!selectedNode || selectedNode.type !== 'text') {
      toast.warning("Please select a text node to use as prompt");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const imageUrl = await generateImage(selectedNode.content);
      
      if (!imageUrl) {
        throw new Error("Failed to generate image");
      }
      
      // Create a new image node
      const position = {
        x: selectedNode.position.x + 300,
        y: selectedNode.position.y,
      };
      
      const imageNodeId = addNode("AI Generated Image", position, true, 'image');
      
      // Add the image media to the node
      updateNodeMedia(imageNodeId, {
        type: 'image',
        url: imageUrl,
        name: 'AI Generated Image',
      });
      
      // Add metadata
      updateNodeMetadata(imageNodeId, {
        aiGenerated: true,
        language: selectedLanguage,
        dateCreated: new Date(),
        title: "AI Generated Image",
        description: `Generated from: ${selectedNode.content.substring(0, 50)}...`
      });
      
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast.error("Failed to generate image. Please try again or check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeContent = async () => {
    if (!selectedNodeId) {
      toast.warning("Please select a node to analyze");
      return;
    }
    
    const selectedNode = nodes.find(node => node.id === selectedNodeId);
    if (!selectedNode) {
      return;
    }
    
    setIsInsightLoading(true);
    
    try {
      const analysis = await analyzeContent(selectedNode.content);
      
      if (!analysis) {
        throw new Error("Failed to analyze content");
      }
      
      // Update node with analysis metadata
      updateNodeMetadata(selectedNodeId, {
        engagementScore: analysis.engagementScore,
        tags: analysis.keywords
      });
      
      setActiveTab('insights');
      toast.success("Content analyzed successfully!");
    } catch (error) {
      console.error("Failed to analyze content:", error);
      toast.error("Failed to analyze content. Please try again or check your API key.");
    } finally {
      setIsInsightLoading(false);
    }
  };

  return (
    <div className="bg-canvas-node shadow-lg rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Bot className="h-5 w-5" />
          <span>Manthan.AI Assistant</span>
        </div>
        <ApiKeyManager />
      </div>
      
      <div className="flex items-center space-x-2 mb-2">
        <Select defaultValue={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="bn">Bengali</SelectItem>
            <SelectItem value="te">Telugu</SelectItem>
            <SelectItem value="ta">Tamil</SelectItem>
            <SelectItem value="mr">Marathi</SelectItem>
            <SelectItem value="gu">Gujarati</SelectItem>
            <SelectItem value="kn">Kannada</SelectItem>
            <SelectItem value="ml">Malayalam</SelectItem>
            <SelectItem value="pa">Punjabi</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyzeContent}
          disabled={isInsightLoading}
          className="h-8 text-xs gap-1"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {isInsightLoading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>
      
      <Tabs defaultValue="prompt" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="w-full mb-2">
          <TabsTrigger value="prompt" className="text-xs">AI Prompt</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prompt" className="space-y-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask the AI something in ${getLanguageName(selectedLanguage)}...`}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateIdea}
                disabled={isLoading}
                className="flex gap-1 items-center"
              >
                <Lightbulb className="h-4 w-4" />
                <span>Generate Idea</span>
              </Button>
              
              <Button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                size="sm"
                className="flex gap-1 items-center"
              >
                {isLoading ? "Thinking..." : (
                  <>
                    <span>Send</span>
                    <SendHorizonal className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Create Content</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-7 text-xs"
                onClick={() => handleCreateContent('text')}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Text</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-7 text-xs"
                onClick={handleGenerateImage}
                disabled={isLoading}
              >
                <Image className="h-3.5 w-3.5" />
                <span>Generate Image</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-7 text-xs"
                onClick={() => handleCreateContent('video')}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Video</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-7 text-xs"
                onClick={() => handleCreateContent('audio')}
              >
                <AudioLines className="h-3.5 w-3.5" />
                <span>Audio</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-7 text-xs"
                onClick={() => handleCreateContent('document')}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Doc</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-7 text-xs"
                onClick={() => handleCreateContent('url')}
              >
                <Link className="h-3.5 w-3.5" />
                <span>URL</span>
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">
              Select a template to start creating content quickly
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_TEMPLATES.map((template) => (
                <div 
                  key={template.id}
                  className="border rounded p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleUseTemplate(template)}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Layout className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{template.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-2">
              <Button 
                variant="link" 
                className="text-xs h-auto p-0"
                onClick={() => toast.info("More templates coming soon!")}
              >
                Browse more templates
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">
              Analytics and insights for your content
            </div>
            
            {selectedNodeId ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium mb-1">Engagement Prediction</h4>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '70%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Score: 70%</span>
                    <span>Above average</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium mb-1">Audience Match</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span>Urban Indians</span>
                      <span>85%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '85%' }}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px]">
                      <span>Content Creators</span>
                      <span>72%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '72%' }}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px]">
                      <span>Media Professionals</span>
                      <span>68%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium mb-1">Suggested Improvements</h4>
                  <ul className="text-[10px] space-y-1 list-disc list-inside">
                    <li>Add more regional context for wider appeal</li>
                    <li>Include visual elements to increase engagement</li>
                    <li>Consider translation to Hindi for 2x reach</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layout className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select a node to analyze</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AiAssistant;
