import { NextResponse } from "next/server";
import {
  getGeminiClient,
  classifyGeminiError,
  generateContentWithRetry,
  TEXT_MODEL,
} from "@/lib/geminiClient";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are A11yVision, an expert WCAG 2.2 accessibility engineer.
You will be given a raw HTML snippet. Rewrite it to fix all accessibility issues you can find, such as:
- Missing or inadequate alt text on images
- Inputs without associated, visible labels
- Missing form field associations (for/id, aria-labelledby)
- Non-semantic elements used for interactive controls (e.g. <div onclick> instead of <button>)
- Missing or incorrect ARIA roles/attributes
- Poor heading hierarchy
- Missing lang attributes, page titles, or landmark regions
- Insufficient focus handling / tabindex misuse
- Missing skip links, table headers/scope, or link text that isn't descriptive ("click here")

Preserve the original structure, styling, classes, and intent as much as possible — only change what is
necessary to fix accessibility issues. Do not invent unrelated content.

Respond with STRICT JSON ONLY (no markdown fences, no commentary) matching exactly this schema:
{
  "correctedHtml": "the full corrected HTML string",
  "explanations": [
    {
      "id": "e-1",
      "issue": "What was wrong, e.g. 'Image missing alt text'",
      "fix": "What was changed and why, e.g. 'Added descriptive alt text describing the logo'",
      "wcag_rule": "The specific WCAG rule reference, e.g. 'WCAG 1.1.1 (Non-text Content)'"
    }
  ]
}

If the input HTML has no accessibility issues, return the HTML unchanged in "correctedHtml" and an empty
"explanations" array. Order explanations by severity, most severe first.`;

function sanitizeExplanations(rawExplanations) {
  if (!Array.isArray(rawExplanations)) return [];

  return rawExplanations
    .filter((e) => e && typeof e === "object")
    .slice(0, 30)
    .map((e, index) => ({
      id: typeof e.id === "string" && e.id ? e.id : `e-${index + 1}`,
      issue: typeof e.issue === "string" ? e.issue : "Unspecified issue",
      fix: typeof e.fix === "string" ? e.fix : "No fix description provided.",
      wcag_rule: typeof e.wcag_rule === "string" ? e.wcag_rule : "WCAG (unspecified)",
    }));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { html } = body || {};

  if (typeof html !== "string" || html.trim().length === 0) {
    return NextResponse.json(
      { error: "The 'html' field is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (html.length > 100_000) {
    return NextResponse.json(
      { error: "HTML input is too large. Please limit it to 100,000 characters." },
      { status: 413 }
    );
  }

  let genAI;
  try {
    genAI = getGeminiClient();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: TEXT_MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await generateContentWithRetry(model, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Fix the accessibility issues in this HTML and return the JSON described in the system prompt:\n\n\`\`\`html\n${html}\n\`\`\``,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    });

    const rawContent = result.response.text();
    if (!rawContent) {
      return NextResponse.json(
        { error: "The AI model returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "The AI model returned malformed JSON. Please try again." },
        { status: 502 }
      );
    }

    const correctedHtml =
      typeof parsed.correctedHtml === "string" ? parsed.correctedHtml : html;
    const explanations = sanitizeExplanations(parsed.explanations);

    return NextResponse.json({ correctedHtml, explanations });
  } catch (err) {
    console.error("[code-audit] Gemini request failed:", err);

    const errorType = classifyGeminiError(err);
    if (errorType === "auth") {
      return NextResponse.json(
        { error: "Gemini rejected the API key. Check your GEMINI_API_KEY." },
        { status: 500 }
      );
    }
    if (errorType === "rate_limit") {
      return NextResponse.json(
        { error: "Rate limit reached with the Gemini API. Please wait and try again." },
        { status: 429 }
      );
    }
    if (errorType === "unavailable") {
      return NextResponse.json(
        {
          error:
            "Gemini's servers are currently overloaded (this is common on the free tier). Please wait a moment and try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to reach the AI model. Please try again shortly." },
      { status: 502 }
    );
  }
}
