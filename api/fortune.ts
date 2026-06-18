import type { VercelRequest, VercelResponse } from "@vercel/node";
import { toApiErrorResponse, withFortuneTimeout } from "../lib/gemini.js";
import { generateFortuneReport } from "../lib/fortuneService.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const report = await withFortuneTimeout(generateFortuneReport(req.body ?? {}));
    return res.status(200).json({ report, mode: "overview" });
  } catch (error) {
    console.error("Fortune generation error:", error);
    const { status, body } = toApiErrorResponse(error);
    return res.status(status).json(body);
  }
}
