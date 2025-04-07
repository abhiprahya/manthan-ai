
import React from 'react';
import { CanvasProvider } from '@/contexts/CanvasContext';
import Canvas from '@/components/Canvas';
import AiAssistant from '@/components/AiAssistant';
import Header from '@/components/Header';

const Index = () => {
  return (
    <CanvasProvider>
      <div className="flex flex-col h-screen">
        <Header />
        
        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative">
            <Canvas />
          </div>
          
          <aside className="w-80 border-l bg-background overflow-y-auto p-4">
            <AiAssistant />
            
            <div className="mt-6 p-4 bg-canvas-node rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">Tips</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Double-click anywhere to create a thought</li>
                <li>• Drag thoughts to reposition them</li>
                <li>• Connect related thoughts with the connect option</li>
                <li>• Ask the AI to respond to your thoughts</li>
              </ul>
            </div>
            
            <div className="mt-4 text-xs text-center text-muted-foreground">
              Thought Space — A visual AI workspace
            </div>
          </aside>
        </main>
      </div>
    </CanvasProvider>
  );
};

export default Index;
