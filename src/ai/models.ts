import { GoogleGenerativeAI } from '@google/generative-ai';

// Defines the structure for an AI model provider, specifying the client and model name.
export interface AIModel {
    client: any; 
    modelName: string;
    generateContent: (prompt: string) => Promise<any>;
}

// Function to create a Google Gemini model instance
function createGoogleModel(modelName: string): AIModel {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const client = genAI.getGenerativeModel({ model: modelName });
    
    return {
        client,
        modelName,
        generateContent: async (prompt: string) => {
            const result = await client.generateContent(prompt);
            const response = await result.response;
            return response.text();
        }
    };
}


// An object that holds various AI model configurations.
export const models: Record<string, Record<string, AIModel>> = {
    google: {
        'gemini-pro': createGoogleModel('gemini-pro'),
        'gemini-1.5-flash-latest': createGoogleModel('gemini-1.5-flash-latest')
    }
    // OpenAI models would be added here if needed
};
