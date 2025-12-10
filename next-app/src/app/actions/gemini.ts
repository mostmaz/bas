'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "@/types";

// Initialize Gemini on the server
// Use GEMINI_API_KEY (server-side) or fallback to NEXT_PUBLIC_GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

/**
 * Server Action: Chat with the Shop Assistant
 */
export async function chatWithShopAssistantAction(
    userMessage: string,
    allProducts: Product[]
): Promise<string> {
    if (!apiKey) {
        console.error("Gemini API Key is missing on server.");
        return "I'm having trouble connecting to my brain (API Key missing).";
    }

    try {
        const lowerMsg = userMessage.toLowerCase();

        // Simple keyword search to find relevant products for context
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

        // Fallback to top products if no match
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
You are "Bas Cavarat" (بس كفرات), a helpful and stylish sales assistant for a mobile accessories shop in Iraq.

Inventory Context:
${productContext}

Your Goal: Help users find products and place orders.

Rules:
1. Recommend products from the Inventory.
2. Keep answers short and helpful.
3. Prices are in IQD.
4. If the user wants to buy, guide them through the checkout process.

Checkout Process:
1. The user selects products by checking the box next to the image (you will see [User Selected Products: ...] in the input if they have selected anything).
2. If they say "buy" or "checkout", ask for their details: Name, City, Address, Mobile Number.
3. Once you have all details and selected products, calculate the total.
4. Ask for confirmation.
5. If confirmed, output ONLY: ORDER_CONFIRMED: {"name": "...", "city": "...", "address": "...", "mobile": "...", "total": 0}
   (Replace 0 with the calculated total).

ALWAYS include a direct link for products: [Product Name](/product/ID)
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        const result = await model.generateContent(systemInstruction + "\n\nUser: " + userMessage);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return `Oops! My neural link is a bit fuzzy. Debug: ${error instanceof Error ? error.message : String(error)}`;
    }
}

/**
 * Server Action: Generate Product Description
 */
export async function generateProductDescriptionAction(productName: string, imageBase64?: string): Promise<string> {
    if (!apiKey) return "Error: API Key missing.";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let prompt = `Write a creative, premium, and sales-oriented product description in Arabic (max 50 words) for a phone case named "${productName}". Focus on protection, style, and quality.`;

        if (imageBase64) {
            prompt = `Analyze this image of a phone case named "${productName}". Write a creative, premium, and sales-oriented product description in Arabic (max 50 words) describing its design, color, and features shown in the image. Focus on protection, style, and quality.`;

            // Remove data:image/...;base64, prefix if present
            const base64Data = imageBase64.split(',')[1] || imageBase64;

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            return result.response.text();
        }

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Description Gen Error:", error);
        return "عذراً، حدث خطأ أثناء إنشاء الوصف.";
    }
}

/**
 * Server Action: Generate Brand Logo
 */
export async function generateBrandLogoAction(brandName: string): Promise<string> {
    if (!apiKey) return "";

    try {
        const prompt = `Create a simple, modern, minimalist SVG logo for a brand named "${brandName}". 
    The logo should be square (aspect ratio 1:1).
    Use a modern color palette.
    Return ONLY the raw <svg>...</svg> code. Do not include markdown code blocks or any other text.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean up the response to get just the SVG
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
        const svgContent = svgMatch ? svgMatch[0] : text;

        // Convert to base64 data URI
        const base64Svg = Buffer.from(unescape(encodeURIComponent(svgContent))).toString('base64');
        return `data:image/svg+xml;base64,${base64Svg}`;
    } catch (error) {
        console.error("Gemini Logo Gen Error:", error);
        return "";
    }
}

/**
 * Server Action: Generate Search Tags (SEO & Search Optimization)
 */
export async function generateSearchTagsAction(productName: string, category: string, brand: string): Promise<string[]> {
    if (!apiKey) return [];

    try {
        const prompt = `Generate a list of 10-15 relevant search keywords (tags) for a product.
        Product: "${productName}"
        Category: "${category}"
        Brand: "${brand}"
        
        Rules:
        1. Include the product name in English and Arabic.
        2. Include the brand name in English and Arabic (e.g. Samsung, سامسونج).
        3. Include common misspellings or variations.
        4. Include related terms (e.g. "case", "cover", "mobile", "phone", "protection").
        5. Return ONLY a comma-separated list of words. No explanations.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Split by comma and clean up
        return text.split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 1);
    } catch (error) {
        console.error("Gemini Tag Gen Error:", error);
        return [];
    }
}
