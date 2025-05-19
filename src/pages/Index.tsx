
import React, { useState } from 'react';
import { CanvasProvider } from '@/contexts/CanvasContext';
import Canvas from '@/components/Canvas';
import Header from '@/components/Header';
import ContentGenerator from '@/components/ContentGenerator';

const Index = () => {
  const [showContentGenerator, setShowContentGenerator] = useState(true);

  const toggleContentGenerator = () => {
    setShowContentGenerator(!showContentGenerator);
  };

  return (
    <CanvasProvider>
      <div className="flex flex-col h-screen">
        <Header />
        
        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative">
            <Canvas onCreateContent={() => setShowContentGenerator(true)} />
            
            {showContentGenerator && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl">
                  <ContentGenerator onClose={toggleContentGenerator} />
                </div>
              </div>
            )}
          </div>
          
          <aside className="w-80 border-l bg-background overflow-y-auto p-4">
            <div className="p-4 bg-canvas-node rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">Manthan.AI Features</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Create multimodal content across text, image, video & audio</li>
                <li>• Support for 10 Indic languages</li>
                <li>• OpenAI integration for content generation</li>
                <li>• Content metadata & IP management</li>
                <li>• Performance analytics & audience insights</li>
              </ul>
            </div>
            
            <div className="mt-4 text-xs text-center text-muted-foreground">
              Manthan.AI — Indic-first creative infrastructure
            </div>
          </aside>
        </main>
      </div>
    </CanvasProvider>
  );
};

export default Index;
