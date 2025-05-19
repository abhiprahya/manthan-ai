
import React, { useState } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import { generateAiResponse, generateImage, getLanguageName } from '@/services/aiService';
import { X, FileText, Image, Video, AudioLines, Languages, Wand2, Sparkles, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { LanguageCode, NodeType, Position } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ApiKeyManager from '@/components/ApiKeyManager';

interface ContentGeneratorProps {
  onClose: () => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ onClose }) => {
  const { addNode, updateNodeMetadata, updateNodeMedia } = useCanvas();
  
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [contentType, setContentType] = useState<NodeType>('text');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [contentTitle, setContentTitle] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Content templates
  const templates = {
    text: [
      { name: "Blog Post", prompt: "Write a blog post about [topic] with the following sections: introduction, main points, and conclusion." },
      { name: "Social Media Post", prompt: "Create an engaging social media post about [topic] that will resonate with [audience]." },
      { name: "News Article", prompt: "Write a news article about [event/topic] covering the who, what, where, when, and why." },
      { name: "Script", prompt: "Write a script for a [duration] minute video about [topic] that explains [concept]." }
    ],
    image: [
      { name: "Product Showcase", prompt: "A professional product photo of [product] on a clean white background, studio lighting" },
      { name: "Concept Art", prompt: "Concept art of [subject], digital illustration, detailed, vibrant colors" },
      { name: "Indian Cultural", prompt: "Traditional Indian [cultural element] in [location], rich vibrant colors, detailed" },
      { name: "Infographic Style", prompt: "Infographic illustrating [concept], minimalist design, informative, clear" }
    ]
  };
  
  const handleTemplateSelect = (prompt: string) => {
    setPrompt(prompt);
    toast.info("Template applied! Customize and generate content.");
  };
  
  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (contentType === 'text') {
        // Generate text content
        const response = await generateAiResponse(prompt, selectedLanguage);
        setGeneratedContent(response.content);
        
        if (!contentTitle) {
          // Auto-generate a title
          const titleResponse = await generateAiResponse(`Generate a short title (5-7 words) for this content: ${response.content.substring(0, 100)}`, selectedLanguage);
          setContentTitle(titleResponse.content);
        }
        
        // Automatically add the content to canvas when generated
        addContentToCanvas(response.content);
      } else if (contentType === 'image') {
        // Generate image
        setIsImageLoading(true);
        const url = await generateImage(prompt);
        setImageUrl(url);
        setIsImageLoading(false);
        
        if (url) {
          // Automatically add the image to canvas when generated
          addImageToCanvas(url);
        }
      }
    } catch (error) {
      console.error("Failed to generate content:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const addContentToCanvas = (content: string) => {
    const centerPosition: Position = { x: Math.random() * 300 + 200, y: Math.random() * 200 + 200 };
    
    // Create text node
    const nodeId = addNode(content, centerPosition, true, 'text');
    
    // Add metadata
    updateNodeMetadata(nodeId, {
      aiGenerated: true,
      language: selectedLanguage,
      dateCreated: new Date(),
      title: contentTitle || "Generated Content"
    });
    
    toast.success("Content added to canvas!");
  };
  
  const addImageToCanvas = (url: string) => {
    const centerPosition: Position = { x: Math.random() * 300 + 200, y: Math.random() * 200 + 200 };
    
    // Create image node
    const nodeId = addNode(contentTitle || "Generated Image", centerPosition, true, 'image');
    
    // Add the image media to the node
    updateNodeMedia(nodeId, {
      type: 'image',
      url: url,
      name: contentTitle || 'AI Generated Image',
    });
    
    // Add metadata
    updateNodeMetadata(nodeId, {
      aiGenerated: true,
      language: selectedLanguage,
      dateCreated: new Date(),
      title: contentTitle || "AI Generated Image",
      description: prompt
    });
    
    toast.success("Image added to canvas!");
  };
  
  const handleLanguageChange = (value: LanguageCode) => {
    setSelectedLanguage(value);
  };
  
  return (
    <Card className="border-0 shadow-none rounded-b-none">
      <div className="flex justify-center cursor-pointer py-1 border-t border-b" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      
      {!isCollapsed && (
        <>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Content Generator
              </CardTitle>
              <CardDescription>
                Generate AI-powered content in multiple formats and languages
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ApiKeyManager />
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Tabs defaultValue="text" className="flex-1" onValueChange={(value) => setContentType(value as NodeType)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="text" className="text-xs flex gap-1 items-center">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Text</span>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-xs flex gap-1 items-center">
                    <Image className="h-3.5 w-3.5" />
                    <span>Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="text-xs flex gap-1 items-center">
                    <Video className="h-3.5 w-3.5" />
                    <span>Video</span>
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="text-xs flex gap-1 items-center">
                    <AudioLines className="h-3.5 w-3.5" />
                    <span>Audio</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Select value={selectedLanguage} onValueChange={(value) => handleLanguageChange(value as LanguageCode)}>
                <SelectTrigger className="w-40 h-9 text-xs">
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
            </div>
            
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                placeholder="Enter title (optional)"
                className="mb-3"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="prompt">Prompt</Label>
                <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setPrompt("")}>
                  Clear
                </span>
              </div>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={contentType === 'image' ? 
                  "Describe the image you want to generate..." : 
                  `Enter your prompt in ${getLanguageName(selectedLanguage)}...`
                }
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs mb-1 block">Templates</Label>
                <div className="space-y-1 max-h-20 overflow-y-auto pr-2">
                  {contentType === 'text' && templates.text.map((template, i) => (
                    <Button 
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => handleTemplateSelect(template.prompt)}
                    >
                      {template.name}
                    </Button>
                  ))}
                  
                  {contentType === 'image' && templates.image.map((template, i) => (
                    <Button 
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => handleTemplateSelect(template.prompt)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col justify-end">
                <Button 
                  onClick={handleGenerateContent}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full flex gap-2 items-center"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  <span>Generate {contentType === 'image' ? 'Image' : 'Content'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
          
          {(generatedContent || imageUrl || isImageLoading) && (
            <>
              <div className="px-6 py-2 border-t">
                <h3 className="text-sm font-medium">Generated {contentType === 'image' ? 'Image' : 'Content'}</h3>
              </div>
              
              <CardContent className="pt-2">
                {contentType === 'text' && generatedContent && (
                  <div className="border rounded-md p-3 bg-muted/30 max-h-40 overflow-y-auto text-sm whitespace-pre-line">
                    {generatedContent}
                  </div>
                )}
                
                {contentType === 'image' && (
                  <div className="flex justify-center">
                    {isImageLoading ? (
                      <div className="h-40 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt="Generated image"
                        className="max-h-40 object-contain rounded-md"
                      />
                    ) : null}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default ContentGenerator;
