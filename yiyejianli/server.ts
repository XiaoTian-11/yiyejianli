import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json({ limit: '10mb' }));

  // API Route for secure Gemini Translation
  app.post("/api/translate", async (req, res) => {
    try {
      const { textMap, fromLang, toLang } = req.body;

      if (!textMap || typeof textMap !== 'object') {
        res.status(400).json({ error: "Invalid textMap parameter" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
        return;
      }

      // Convert from/to language code names to readable text (e.g. 'zh' -> 'Chinese', 'en' -> 'English')
      const getLangName = (code: string) => {
        const names: Record<string, string> = {
          zh: 'Chinese (Simplified)',
          en: 'English (Professional CV Standard)',
          ja: 'Japanese',
          ko: 'Korean',
          fr: 'French',
          de: 'German',
          es: 'Spanish'
        };
        return names[code] || code;
      };

      const sourceLang = getLangName(fromLang || 'zh');
      const targetLang = getLangName(toLang || 'en');

      const systemInstruction = `You are a professional CV and resume translator.
Your task is to translate a JSON object of key-value pairs representing CV fields from ${sourceLang} to ${targetLang}.
Rules:
1. Return ONLY a valid JSON object with the EXACT same keys. No markdown wrapping except the raw JSON string itself (or valid application/json).
2. For each key, translate its corresponding value into highly polished, professional, and natural CV-quality ${targetLang}. 
3. Maintain technical acronyms (e.g., SQL, React, Python, API, STAR) and appropriate industry terms.
4. If a value contains HTML tags (like <li>, <p>, <strong>, etc.), translate only the visible text inside/around the tags while keeping the exact HTML block tags intact.
5. If some standard phrases (e.g., mail domains or URLs) do not require translation, keep them as is.`;

      const contents = `Translate the following JSON map:
${JSON.stringify(textMap, null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1, // low temperature for precise, non-creative translations
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini translation service.");
      }

      const translatedMap = JSON.parse(responseText.trim());
      res.json({ translatedMap });
    } catch (error: any) {
      console.error("Gemini Translation Error:", error);
      res.status(500).json({ error: error?.message || "Internal translation server error" });
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
