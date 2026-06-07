import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { UITM_FALLBACK_CALENDAR_TEXT, CANONICAL_EVENTS } from "./src/data/calendarData.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_IF_ABSENT",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Global cached scraper status
let globalScrapedData = "";
let lastScrapeTime: string | null = null;
let lastScrapeStatus: 'idle' | 'scraping' | 'success' | 'failed' = 'idle';
let lastScrapeError = "";

// Web scraper helper
async function performScrape() {
  lastScrapeStatus = 'scraping';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const url = "https://hea.uitm.edu.my/index.php/calendars/academic-calendar";
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} returned from HEA server`);
    }

    const html = await res.text();
    // Simple text cleaning of the parsed HTML chunk
    const cleanedText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length < 150) {
      throw new Error("Scraped text length too short - likely a dynamic layout redirect.");
    }

    globalScrapedData = cleanedText.substring(0, 10000); // Limit context size
    lastScrapeStatus = 'success';
    lastScrapeTime = new Date().toISOString();
    lastScrapeError = "";
    console.log("Scraped UiTM calendar successfully!");
  } catch (err: any) {
    lastScrapeStatus = 'failed';
    lastScrapeError = err.message || String(err);
    console.error("Failed to scrape UiTM calendar, reverting entirely to standard fallback dataset. Error:", lastScrapeError);
  }
}

// Boot triggering scrape
performScrape();

// API Endpoints
app.get("/api/calendar/events", (req, res) => {
  res.json({
    events: CANONICAL_EVENTS,
    scraper: {
      status: lastScrapeStatus,
      lastUpdated: lastScrapeTime,
      error: lastScrapeError,
      hasLiveScrapedData: globalScrapedData.length > 0,
      scrapedUrl: "https://hea.uitm.edu.my/index.php/calendars/academic-calendar"
    }
  });
});

app.post("/api/calendar/scrape", async (req, res) => {
  await performScrape();
  res.json({
    status: lastScrapeStatus,
    lastUpdated: lastScrapeTime,
    error: lastScrapeError
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userQuestion } = req.body;
    if (!userQuestion) {
      return res.status(400).json({ error: "userQuestion parameter is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY. Please provide this in the Settings > Secrets tab to enable chatbot intelligence."
      });
    }

    const client = getGeminiClient();
    const systemPromptMessage = `
You are a friendly, expert Universiti Teknologi MARA (UiTM) Academic Assistant. 
Your primary task is to answer students' questions about dates, schedules, breaks, and academic milestones strictly using the official UiTM academic calendar parameters provided below.

--- IMPORTANT TIMELINE CONTEXT ---
The current date is exactly: June 7, 2026.
Use this current date to relative-calculate answers for queries like "When starts the next lecture?", "When are upcoming exams?", "Is there a holiday next week?".

Below is the context. You should prioritize facts in the CANONICAL ACADEMIC CALENDAR REFERENCE, as it contains direct parsed data from UiTM HEA templates. If live scraped data is available, you may also reference it.

${UITM_FALLBACK_CALENDAR_TEXT}

${globalScrapedData ? `--- LIVE SCRAPED ADDITIONAL WEBPAGE CONTEXT ---\n${globalScrapedData}\n` : ""}

--- COMPOSURE RULES ---
1. Use clear, polite English (optionally blend in familiar standard Malaysian English / Malay campus phrases if students ask in Malay).
2. Answer clearly and concisely. Break down information using bullet points when discussing dates.
3. Be precise with dates. Always highlight the difference between GROUP A (Kedah, Johor, Kelantan, Terengganu) starting on Sundays, and GROUP B (Selangor, Melaka, Perak, etc.) starting on Mondays.
4. If a fact is outside of the provided calendar dates and context, explain politely that you only have access to the 2025/2026/2027 Academic Calendars and suggest checking with their Faculty HEA or Academic portal.
5. Provide a helpful, direct summary first, then show the bullet points of dates.
`;

    // Map conversation for Gemini chats
    const formattedHistory = (messages || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Generate output with gemini-3.5-flash
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: userQuestion }] }
      ],
      config: {
        systemInstruction: systemPromptMessage,
        temperature: 0.2, // Low temperature for highly facts-guided accurate answers
      },
    });

    res.json({
      answer: response.text || "I was unable to formulate an answer. Could you please rephrase your query?",
      modelUsed: "gemini-3.5-flash",
      currentDate: "2026-06-07"
    });
  } catch (error: any) {
    console.error("Gemini chatbot error:", error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred while consulting the Gemini AI engine."
    });
  }
});

// Serve frontend assets
async function startServer() {
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
    console.log(`UiTM Chatbot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
