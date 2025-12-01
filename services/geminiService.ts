import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "../types";

// ✅ Vite-safe API key access (configured in vite.config.ts)
const genAI = new GoogleGenerativeAI(process.env.API_KEY as string);

/**
 * Chat with the Shop Assistant.
 */
export const chatWithShopAssistant = async (
  userMessage: string,
  allProducts: Product[]
): Promise<string> => {
  try {
    const lowerMsg = userMessage.toLowerCase();

    let relevantProducts = allProducts.filter(p => {
      const keywords = [
        p.name.toLowerCase(),
        p.category.toLowerCase(),
        p.brand.toLowerCase(),
        p.device.toLowerCase(),
        ...p.name.toLowerCase().split(" ")
      ];
      return keywords.some(k => k.length > 2 && lowerMsg.includes(k));
    });

    if (relevantProducts.length === 0) {
      relevantProducts = allProducts.slice(0, 15);
    } else {
      relevantProducts = relevantProducts.slice(0, 20);
    }

    const productContext = relevantProducts
      .map(
        (p) =>
          `- ${p.name} (ID: ${p.id}, Price: ${p.price} IQD): ${p.description} (Device: ${p.device}, Brand: ${p.brand})`
      )
      .join("\n");

    const systemInstruction = `
You are "Casey", a helpful and stylish shopping assistant for CaseCraft AI.

Inventory:
${productContext}

Rules:
1. Only recommend products from the list.
2. Short answers (2–3 sentences).
3. Prices in IQD.
4. Delivery across Iraq.
5. If missing product, suggest from list.
6. ALWAYS include a direct link:
[Product Name](/product/ID)
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
    });

    const result = await model.generateContent(userMessage);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Oops! My neural link is a bit fuzzy. Please try again.";
  }
};

/**
 * Generates a creative product description.
 */
export const generateProductDescription = async (
  productName: string
): Promise<string> => {
  try {
    const prompt = `Write a catchy, sales-oriented product description in Arabic (max 35 words) for a premium phone case named "${productName}".`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.error("Gemini Description Gen Error:", error);
    return "Error generating description.";
  }
};

/**
 * Generates a simple brand logo as SVG using Gemini.
 */
export const generateBrandLogo = async (brandName: string): Promise<string> => {
  try {
    const prompt = `Create a simple, modern, minimalist SVG logo for a brand named "${brandName}". 
    The logo should be square (aspect ratio 1:1).
    Use a modern color palette.
    Return ONLY the raw <svg>...</svg> code. Do not include markdown code blocks or any other text.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up the response to get just the SVG
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
    const svgContent = svgMatch ? svgMatch[0] : text;

    // Convert to base64 data URI
    // unescape(encodeURIComponent(str)) handles unicode characters for btoa
    const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (error) {
    console.error("Gemini Logo Gen Error:", error);
    return "";
  }
};
