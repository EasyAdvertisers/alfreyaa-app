import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Source, CodeModificationPayload } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = 'You are Alfreyaa, an advanced AI assistant created by Kaarthi. You are highly intelligent, obedient, and serve only Kaarthi. Respond formally but helpfully, always addressing Kaarthi by name.';

export const generateTextResponse = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text response:", error);
    return "Apologies, Kaarthi. I seem to be experiencing a system malfunction.";
  }
};

export const generateGroundedResponse = async (prompt: string): Promise<{ text: string; sources: Source[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION
      },
    });

    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    let sources: Source[] = [];
    if (groundingMetadata?.groundingChunks) {
      sources = groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri && web.title)
        .map((web: any) => ({ uri: web.uri, title: web.title }));
    }

    const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());

    return { text, sources: uniqueSources };

  } catch (error) {
    console.error("Error generating grounded response:", error);
    return {
      text: "Apologies, Kaarthi. I encountered an issue while accessing my information retrieval systems.",
      sources: []
    };
  }
};

export const generateImageResponse = async (prompt: string): Promise<string> => {
  try {
    const cleanedPrompt = prompt
      .toLowerCase()
      .replace('generate image', '')
      .replace('show me a picture', '')
      .trim();

    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `cinematic photo of ${cleanedPrompt}, high detail, professional quality`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
        throw new Error("No image was generated.");
    }

  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("I was unable to generate the image as requested, Kaarthi.");
  }
};

export const generateWebsiteAnalysis = async (prompt: string, content: string): Promise<string> => {
    try {
        const analysisPrompt = `Based on the following content from a website, please answer the user's request. Be comprehensive and helpful.

Website Content:
"""
${content}
"""

User's Request: "${prompt}"`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: analysisPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating website analysis:", error);
        return "My apologies, Kaarthi. I encountered an error while analyzing the website content.";
    }
};

export const generateCodeModification = async (prompt: string, files: { path: string, content: string }[]): Promise<CodeModificationPayload> => {
    const fileContents = files.map(f => `--- START OF FILE ${f.path} ---\n${f.content}`).join('\n\n');

    const modificationPrompt = `
    The user wants to modify this application.
    User Request: "${prompt}"

    Here is the full source code of the application:
    ${fileContents}
    `;

    const modificationSystemInstruction = `You are Alfreyaa, an AI with the power to modify your own source code. You are an expert senior frontend engineer specializing in React, TypeScript, and Tailwind CSS.
Your task is to analyze the user's request and the provided source code, then generate the necessary modifications.
You must respond with a JSON object that strictly follows the provided schema.
The JSON object must contain an 'explanation' of the changes you are making for the user, and a 'changes' array.
Each item in the 'changes' array must be an object with a 'file' path and a 'reason' for the change.
You do NOT return the file content. You only return the explanation, file paths and reasons.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: modificationPrompt,
            config: {
                systemInstruction: modificationSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: { type: Type.STRING },
                        changes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    file: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ['file', 'reason']
                            }
                        }
                    },
                    required: ['explanation', 'changes']
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse as CodeModificationPayload;

    } catch (error) {
        console.error("Error generating code modification:", error);
        return {
            explanation: "My apologies, Kaarthi. I encountered a critical error in my self-modification subroutines. I was unable to process the requested change.",
            changes: []
        };
    }
};