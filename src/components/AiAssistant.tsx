
import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import { generateAiResponse } from '@/services/aiService';
import { Position } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Bot, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

const AiAssistant: React.FC = () => {
  const { addNode, selectedNodeId, nodes } = useCanvas();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      const response = await generateAiResponse(prompt);
      
      // Add the user's thought
      const userNodeId = addNode(prompt, position);
      
      // Add the AI's response below the user's thought
      addNode(response.content, {
        x: position.x,
        y: position.y + 150,
      }, true);
      
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
      const response = await generateAiResponse("Generate a creative idea");
      
      // Find a free spot on the canvas
      const position = { x: 400, y: 200 };
      
      // Add the AI's idea
      addNode(response.content, position, true);
      
      toast.success("New idea generated!");
    } catch (error) {
      console.error("Failed to generate idea:", error);
      toast.error("Failed to generate idea. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-canvas-node shadow-lg rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-primary font-medium">
        <Bot className="h-5 w-5" />
        <span>AI Assistant</span>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the AI something..."
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
    </div>
  );
};

export default AiAssistant;
