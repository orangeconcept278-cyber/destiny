import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { toApiErrorResponse, withFortuneTimeout } from "./lib/gemini.js";
import { generateFortuneChat, generateFortuneReport, generateFortuneSection } from "./lib/fortuneService.js";
import { isFortuneSectionId } from "./lib/fortuneSections.js";

dotenv.config({ override: true });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey.includes("ここにAPIキーを貼り付け") || apiKey === "MY_GEMINI_API_KEY") {
  console.warn("[警告] GEMINI_API_KEY が未設定です。鑑定生成は失敗します。");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/fortune", async (req, res) => {
    try {
      const report = await withFortuneTimeout(generateFortuneReport(req.body));
      res.json({ report, mode: "overview" });
    } catch (error) {
      console.error("Fortune generation error:", error);
      const { status, body } = toApiErrorResponse(error);
      res.status(status).json(body);
    }
  });

  app.post("/api/fortune-section", async (req, res) => {
    const { section, data, overview } = req.body ?? {};
    if (!isFortuneSectionId(section)) {
      return res.status(400).json({
        error: "section は western / bazi / jyotish / numerology / integration のいずれかを指定してください。",
        code: "INVALID_SECTION",
      });
    }
    try {
      const content = await withFortuneTimeout(
        generateFortuneSection(section, data ?? {}, typeof overview === "string" ? overview : undefined)
      );
      res.json({ section, content });
    } catch (error) {
      console.error(`Fortune section error (${section}):`, error);
      const { status, body } = toApiErrorResponse(error);
      res.status(status).json(body);
    }
  });

  app.post("/api/fortune-chat", async (req, res) => {
    try {
      const text = await generateFortuneChat(req.body);
      res.json({ text });
    } catch (error) {
      console.error("Fortune chat error:", error);
      const { status, body } = toApiErrorResponse(error);
      res.status(status).json(body);
    }
  });

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
    console.log(`[統合鑑定盤サーバー] 起動中... http://localhost:${PORT}`);
  });
}

startServer();
