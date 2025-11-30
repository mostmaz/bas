
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from '../types';

// Initialize the Gemini client
// Note: In a real production app, API calls should go through a backend to protect the key.
// For this demo, we use the key from process.env directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Chat with the Shop Assistant.
 * Includes the current product catalog in the system instruction for context-aware answers.
 * OPTIMIZATION: Filters products based on keywords to reduce token usage.
 */
export const chatWithShopAssistant = async (
  userMessage: string,
  allProducts: Product[]
): Promise<string> => {
  try {
    // 1. Keyword Extraction (Simple Logic)
    const lowerMsg = userMessage.toLowerCase();
    
    // Filter products that match keywords in the message
    let relevantProducts = allProducts.filter(p => {
       const keywords = [
         p.name.toLowerCase(),
         p.category.toLowerCase(),
         p.brand.toLowerCase(),
         p.device.toLowerCase(),
         ...p.name.toLowerCase().split(' ')
       ];
       return keywords.some(k => k.length > 2 && lowerMsg.includes(k));
    });

    // If no specific matches, check if the user is asking for "all" or generic recommendations
    // Otherwise, fallback to a mix of best sellers / random items to provide *some* context
    if (relevantProducts.length === 0) {
       // Take top 15 products as fallback context (assuming array is somewhat sorted or random)
       relevantProducts = allProducts.slice(0, 15);
    } else {
       // Cap relevant products to 20 to prevent token overflow
       relevantProducts = relevantProducts.slice(0, 20);
    }

    const productContext = relevantProducts
      .map((p) => `- ${p.name} (ID: ${p.id}, Price: ${p.price} IQD): ${p.description} (Device: ${p.device}, Brand: ${p.brand})`)
      .join('\n');

    const systemInstruction = `
      You are "Casey", a helpful and stylish shopping assistant for CaseCraft AI.
      You help customers find the perfect mobile phone case.
      
      Here is a subset of our inventory based on the user's query:
      ${productContext}
      
      Rules:
      1. Only recommend products from the provided inventory list.
      2. Be enthusiastic, short, and concise (max 2-3 sentences).
      3. Prices are in Iraqi Dinar (IQD).
      4. If asked about shipping, say we offer delivery across Iraq.
      5. If asked about a product not in the list, politely say "I can't see that specific one right now, but check out these styles!" and recommend something from the list.
      6. CRITICAL: When recommending a product, you MUST provide a direct link in this markdown format: [Product Name](/product/ID).
         It is BEST to place the link on a new line so it stands out.
         Example: 
         "You should check out this case:
         [Neon Tokyo](/product/3)"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "I'm having a little trouble checking the inventory right now. Can you ask again?";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Oops! My neural link is a bit fuzzy. Please try again later.";
  }
};

/**
 * Generates a creative product description for the Admin Dashboard.
 * Now takes the product image into account for visual analysis.
 */
export const generateProductDescription = async (
  productName: string,
  imageBase64?: string
): Promise<string> => {
  try {
    let prompt = `Write a catchy, sales-oriented product description in Arabic (max 35 words) for a mobile phone case named "${productName}". Tone: Premium, exciting.`;
    
    if (imageBase64) {
       prompt += ` Look closely at the provided image. Describe the specific visual details you see, including the design pattern, colors, materials, and texture. Incorporate these observations into the description.`;
    } else {
       prompt += ` Describe it generally based on the name.`;
    }

    const parts: any[] = [];

    if (imageBase64) {
      // Extract base64 data and mime type
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using a multimodal model
      contents: { parts: parts },
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini Description Gen Error:", error);
    return "Error generating description. Please write one manually.";
  }
};

/**
 * Generates a brand logo using Imagen.
 */
export const generateBrandLogo = async (brandName: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A modern, minimalist, professional vector-style logo for a premium mobile case brand named "${brandName}". The design should be sleek, using abstract geometric shapes or stylized typography. White background, high contrast.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw new Error("Failed to generate logo. Please try again.");
  }
};
