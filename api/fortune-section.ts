import type { VercelRequest, VercelResponse } from "@vercel/node";
import { toApiErrorResponse, withFortuneTimeout } from "../lib/gemini.js";
import { generateFortuneSection } from "../lib/fortuneService.js";
import { isFortuneSectionId } from "../lib/fortuneSections.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  const { section, data, priorContext } = req.body ?? {};

  if (!isFortuneSectionId(section)) {
    return res.status(400).json({
      error: "section は western / bazi / jyotish / numerology / integration のいずれかを指定してください。",
      code: "INVALID_SECTION",
    });
  }

  try {
    const content = await withFortuneTimeout(
      generateFortuneSection(
        section,
        data ?? {},
        typeof priorContext === "string" ? priorContext : undefined
      )
    );
    return res.status(200).json({ section, content });
  } catch (error) {
    console.error(`Fortune section error (${section}):`, error);
    const { status, body } = toApiErrorResponse(error);
    return res.status(status).json(body);
  }
}
