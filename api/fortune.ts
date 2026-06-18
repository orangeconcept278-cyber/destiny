import type { VercelRequest, VercelResponse } from "@vercel/node";
import { formatApiError } from "../lib/gemini.js";
import { generateFortuneReport } from "../lib/fortuneService.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const report = await generateFortuneReport(req.body ?? {});
    return res.status(200).json({ report });
  } catch (error) {
    console.error("Fortune generation error:", error);
    return res.status(500).json({ error: formatApiError(error) });
  }
}
