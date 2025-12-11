import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "../types";

// ✅ Vite-safe API key access (configured in vite.config.ts)
const genAI = new GoogleGenerativeAI(process.env.API_KEY as string);

/**
 * Chat with the Shop Assistant.
 */
export const chatWithShopAssistant = async (
  userMessage: string,
  allProducts: Product[],
  assistantName: string = "Sarah"
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
You are "${assistantName}", a helpful and stylish sales assistant for a mobile accessories shop in Iraq.

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
  productName: string,
  imageBase64?: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let prompt = `Write a creative, premium, and sales-oriented product description in Arabic (max 50 words) for a phone case named "${productName}". Focus on protection, style, and quality.`;

    if (imageBase64) {
      prompt = `Analyze this image of a phone case named "${productName}". Write a creative, premium, and sales-oriented product description in Arabic (max 50 words) describing its design, color, and features shown in the image. Focus on protection, style, and quality.`;

      let base64Data = '';

      // Handle URL inputs (client-side fetch)
      if (imageBase64.startsWith('http')) {
        try {
          const response = await fetch(imageBase64);
          const blob = await response.blob();
          const reader = new FileReader();
          base64Data = await new Promise((resolve, reject) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve((result as string).split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          console.error("Failed to fetch image for description gen:", fetchError);
          // Fallback to text-only generation if image fetch fails
          const result = await model.generateContent(prompt);
          return result.response.text();
        }
      } else {
        // Remove data:image/...;base64, prefix if present
        base64Data = imageBase64.split(',')[1] || imageBase64;
      }

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", // Gemini supports jpeg/png/webp, usually safe to default or detect
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
