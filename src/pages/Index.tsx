
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
          </div>
        </main>
        
        {showContentGenerator && (
          <div className="absolute inset-x-0 bottom-0 bg-background shadow-lg z-10">
            <ContentGenerator onClose={toggleContentGenerator} />
          </div>
        )}
      </div>
    </CanvasProvider>
  );
};

export default Index;
