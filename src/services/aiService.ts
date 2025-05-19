
// AI service for connecting to OpenAI APIs

import { toast } from 'sonner';
import { LanguageCode } from '@/types/models';

type AiResponse = {
  content: string;
};

// OpenAI models configuration
const OPENAI_MODELS = {
  default: "gpt-4o-mini", // Default, fast and affordable
  advanced: "gpt-4o", // More powerful model
};

// Interface for OpenAI API parameters
interface OpenAIRequestParams {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  languageCode?: LanguageCode;
}

// Default fallback responses when API fails or is not configured
const defaultResponses: string[] = [
  "I think that's a great idea. Let's expand on it by considering the target audience.",
  "Have you thought about the potential challenges this might face?",
  "This reminds me of a similar concept that worked well in another industry.",
  "Let's break this down into smaller, more manageable parts.",
  "What if we approached this from a different angle?",
  "I see potential for innovation here. What if we combined this with...",
  "This could be enhanced by integrating recent advancements in the field.",
  "Let me suggest an alternative perspective on this.",
  "Building on your thought, we could implement a strategy that...",
  "Your idea has merit. Let's explore how we can make it more scalable."
];

// Generate content using OpenAI API
export const generateAiResponse = async (prompt: string, languageCode: LanguageCode = 'en'): Promise<AiResponse> => {
  // Check if OpenAI API key is available from localStorage
  const apiKey = localStorage.getItem('openai_api_key');
  
  // If no API key, use fallback responses
  if (!apiKey) {
    toast.warning("OpenAI API key not set. Using fallback responses.");
    return generateFallbackResponse(prompt);
  }

  try {
    const params: OpenAIRequestParams = {
      prompt,
      model: OPENAI_MODELS.default,
      temperature: 0.7,
      max_tokens: 500,
      languageCode
    };
    
    const response = await callOpenAI(params, apiKey);
    
    if (!response) {
      throw new Error("Failed to get response from OpenAI");
    }
    
    return { content: response };
  } catch (error) {
    console.error("OpenAI API error:", error);
    toast.error("OpenAI API error. Using fallback response.");
    
    // Use fallback if API fails
    return generateFallbackResponse(prompt);
  }
};

// Call OpenAI API
const callOpenAI = async (params: OpenAIRequestParams, apiKey: string): Promise<string> => {
  try {
    // Prepare system instruction based on language
    const systemInstruction = params.languageCode === 'en' 
      ? "You are a helpful creative assistant for Manthan.AI, an Indic-first creative platform. Be concise and insightful."
      : `You are a helpful creative assistant for Manthan.AI. Please respond in ${getLanguageName(params.languageCode || 'en')} language. Be concise and culturally relevant.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: params.model || OPENAI_MODELS.default,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: params.prompt }
        ],
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};

// Generate a fallback response when API is not available
const generateFallbackResponse = async (prompt: string): Promise<AiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check for keyword matches
      const matchedResponses: string[] = [];
      
      Object.entries(keywordResponses).forEach(([keyword, responses]) => {
        if (prompt.toLowerCase().includes(keyword)) {
          matchedResponses.push(...responses);
        }
      });
      
      // If we have matched responses, randomly select one, otherwise use default
      const responsePool = matchedResponses.length > 0 
        ? matchedResponses 
        : defaultResponses;
      
      const response = responsePool[Math.floor(Math.random() * responsePool.length)];
      
      resolve({ content: response });
    }, 500);
  });
};

// Add specific responses for certain keywords
const keywordResponses: Record<string, string[]> = {
  "problem": [
    "When solving this problem, consider looking at the root causes first.",
    "This problem seems multifaceted. Let's identify the key variables."
  ],
  "idea": [
    "That's an interesting idea! Have you validated it with potential users?",
    "Your idea has potential. Consider how it might evolve over time."
  ],
  "help": [
    "I'd be happy to help. Let's start by clearly defining what you need.",
    "To help effectively, let's break down what you're trying to achieve."
  ],
  "think": [
    "Thinking about this carefully, I see several paths forward.",
    "That's a thoughtful approach. Let's build on it by considering..."
  ]
};

// Helper function to get language name from code
export const getLanguageName = (code: LanguageCode): string => {
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

// Image generation with OpenAI
export const generateImage = async (prompt: string): Promise<string | null> => {
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    toast.warning("OpenAI API key not set. Cannot generate image.");
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI Image API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error("Error generating image:", error);
    toast.error("Failed to generate image. Please try again.");
    return null;
  }
};

// Content analysis with OpenAI
export const analyzeContent = async (content: string): Promise<any> => {
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    toast.warning("OpenAI API key not set. Cannot analyze content.");
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODELS.default,
        messages: [
          { 
            role: "system", 
            content: "Analyze this content and provide insights in JSON format with these fields: engagementScore (0-100), targetAudience (array of audience types), suggestedImprovements (array of suggestions), keywords (array), sentimentScore (-100 to 100)" 
          },
          { role: "user", content: content }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing content:", error);
    toast.error("Failed to analyze content. Please try again.");
    return null;
  }
};
