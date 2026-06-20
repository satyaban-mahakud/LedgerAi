import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set maximum payload sizes for base64 file uploads (PDFs and Images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Secrets (Settings > Secrets).");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API for receipt and invoice data structuring
app.post("/api/extract", async (req, res) => {
  try {
    const { text, file } = req.body;
    const ai = getGeminiClient();

    let contents: any[] = [];

    // Construct the extraction prompt with detailed category matching
    const promptText = `
Analyze this receipt or invoice and extract the billing details as a clean JSON object. 
If the input is an image or PDF, perform precise visual OCR. If it is raw text, parse the structured segments.
Extrapolate or deduce logically where necessary (e.g., matching common categories) but do not hallucinate amounts or dates.

Categories available:
- Meals & Entertainment (restaurants, cafe, food apps, team events)
- Travel & Lodging (flights, hotels, Airbnb, taxis, ride shares, Uber, Lyft, trains)
- Office Supplies (furniture, stationary, Amazon office items, printing)
- Software & Subscriptions (SaaS platforms, Slack, Salesforce, SAP, AWS, cloud hosting, domains, Github, Google Suite)
- Utilities (electricity, water, internet, phone bills)
- Advertising & Marketing (contracts, Facebook ads, Google ads, agency fees, brochures)
- Professional Services (accounting, legal, consulting, freelance hire)
- Equipment (laptops, monitors, phones, servers, hardware)
- Miscellaneous (anything that doesn't fit standard categories)

Enforce date output as YYYY-MM-DD. If year is missing or ambiguous, assume the logical year from context or 2026.
Ensure amounts are standard floats.
If the document is not an invoice or receipt, extract as much as possible but mark confidence lower.
`;

    contents.push({ text: promptText });

    if (file && file.data) {
      contents.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data, // base64 encoded string
        },
      });
      if (text) {
        contents.push({ text: `Context/Additional text provided by user: ${text}` });
      }
    } else if (text) {
      contents.push({ text: `Receipt Text Content:\n${text}` });
    } else {
      return res.status(400).json({ error: "Missing input data. Provide raw text or a file." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "The total amount paid on the invoice/receipt. Decimals are supported (e.g. 19.99)." },
            currency: { type: Type.STRING, description: "The currency code, e.g., USD, CAD, EUR, INR, GBP. Defaults to USD." },
            vendor: { type: Type.STRING, description: "The proper name of the merchant or vendor." },
            category: { 
              type: Type.STRING, 
              description: "The category: Meals & Entertainment, Travel & Lodging, Office Supplies, Software & Subscriptions, Utilities, Advertising & Marketing, Professional Services, Equipment, or Miscellaneous." 
            },
            date: { type: Type.STRING, description: "The date of transaction or invoice in YYYY-MM-DD format. Ensure year is matched correctly." },
            taxAmount: { type: Type.NUMBER, description: "The tax amount, or null if none." },
            summary: { type: Type.STRING, description: "Brief description of the purchase." },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Description/name of the line item." },
                  quantity: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER }
                }
              }
            },
            confidence: { type: Type.NUMBER, description: "Confidence rating from 0.0 to 1.0 based on readability." }
          },
          required: ["vendor", "amount", "category", "date"]
        }
      }
    });

    const textOutput = response.text || "{}";
    const parsedData = JSON.parse(textOutput);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Configure Vite middleware for development or Static Assets for Production
async function initializeVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

initializeVite();
