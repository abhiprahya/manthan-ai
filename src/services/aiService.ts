
// This is a mock AI service for demo purposes
// In a real app, this would connect to an API

type AiResponse = {
  content: string;
};

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

export const generateAiResponse = async (prompt: string): Promise<AiResponse> => {
  // Simulate API call with 500ms delay
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
