import type { VercelRequest, VercelResponse } from "@vercel/node";
import { toApiErrorResponse, withFortuneTimeout } from "../lib/gemini.js";
import { generateFortuneSection } from "../lib/fortuneService.js";
import { isFortuneSectionId } from "../lib/fortuneSections.js";
import { coerceFortuneSectionResult } from "../lib/sectionParse.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  const { section, data, priorSummaries } = req.body ?? {};

  if (!isFortuneSectionId(section)) {
    return res.status(400).json({
      error: "section は western / bazi / jyotish / numerology / integration のいずれかを指定してください。",
      code: "INVALID_SECTION",
    });
  }

  try {
    const result = coerceFortuneSectionResult(
      await withFortuneTimeout(
        generateFortuneSection(
          section,
          data ?? {},
          priorSummaries && typeof priorSummaries === "object" ? priorSummaries : undefined
        )
      )
    );
    return res.status(200).json({ section, fullText: result.fullText, summary: result.summary });
  } catch (error) {
    console.error(`Fortune section error (${section}):`, error);
    const { status, body } = toApiErrorResponse(error);
    return res.status(status).json(body);
  }
}
