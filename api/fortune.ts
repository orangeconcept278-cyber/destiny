import type { VercelRequest, VercelResponse } from "@vercel/node";
import { toApiErrorResponse, withFortuneTimeout } from "../lib/gemini.js";
import { generateFortuneReport } from "../lib/fortuneService.js";

let fortuneHandlerCallCount = 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  const callId = ++fortuneHandlerCallCount;
  console.log(`[api/fortune] リクエスト受信 #${callId}`, { timestamp: Date.now() });

  try {
    const report = await withFortuneTimeout(generateFortuneReport(req.body ?? {}));
    console.log(`[api/fortune] 成功 #${callId}`);
    return res.status(200).json({ report, mode: "overview" });
  } catch (error) {
    console.error(`[api/fortune] 失敗 #${callId}:`, error);
    const { status, body } = toApiErrorResponse(error);
    return res.status(status).json(body);
  }
}
