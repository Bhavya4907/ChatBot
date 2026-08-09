import { GoogleGenAI } from "@google/genai";

// The SDK automatically looks for process.env.GEMINI_API_KEY if you leave the config empty
const ai = new GoogleGenAI({});

export async function POST(request) {
  console.log("API KEY exists?", !!process.env.GEMINI_API_KEY);  
  
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Call the correct multimodal flash image model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // or "gemini-2.5-flash-image"
      contents: prompt,
    });

    // Clean shortcut: check response.parts directly
    if (response.parts) {
      for (const part of response.parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          const url = `data:${mimeType};base64,${base64}`;
          return Response.json({ url });
        }
      }
    }

    return Response.json({ error: "No image returned from model" }, { status: 500 });

  } catch (error) {
    console.error("Gemini error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}