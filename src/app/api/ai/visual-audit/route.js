import { NextResponse } from "next/server";
import {
  getGeminiClient,
  classifyGeminiError,
  generateContentWithRetry,
  VISION_MODEL,
} from "@/lib/geminiClient";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are A11yVision, an expert WCAG 2.2 accessibility auditor with computer vision capabilities.
You will be shown a screenshot of a website. Carefully inspect it for visual accessibility violations, such as:
- Insufficient color contrast between text and its background (WCAG 1.4.3 / 1.4.11)
- Missing or unclear focus indicators
- Text that is too small to read comfortably
- Touch targets / interactive elements that appear too small or too close together (WCAG 2.5.8)
- Content that relies on color alone to convey meaning (WCAG 1.4.1)
- Poor visual hierarchy or heading structure inferred from styling
- Images that appear to lack visible text alternatives (e.g., icon-only buttons with no visible label)
- Low-contrast placeholder text, disabled states, or form fields without visible labels

Respond with STRICT JSON ONLY (no markdown fences, no commentary) matching exactly this schema:
{
  "violations": [
    {
      "id": "v-1",
      "issue": "Short description of the specific problem observed",
      "element": "Short description of the UI element affected (e.g. 'Login Button text')",
      "wcag_rule": "The specific WCAG rule reference, e.g. 'WCAG 1.4.3 (Contrast)'",
      "remediation": "A concrete, actionable fix a developer could apply",
      "coordinates": {
        "top": 0,
        "left": 0,
        "width": 0,
        "height": 0
      }
    }
  ]
}

Rules for "coordinates": all four values are PERCENTAGES (0 to 100) relative to the full image's width and height.
"top" and "left" are the position of the top-left corner of a bounding box drawn around the affected element.
"width" and "height" are the size of that bounding box as a percentage of the image dimensions.
Be as precise as possible when estimating these coordinates from the screenshot.
Only report genuine, specific visual issues you can identify — do not invent generic filler violations.
If you find no issues, return {"violations": []}.
Return between 0 and 12 violations, ordered by severity (most severe first).`;

function parseDataUri(value) {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/s.exec(value || "");
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function clampPercent(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, num));
}

function sanitizeViolations(rawViolations) {
  if (!Array.isArray(rawViolations)) return [];

  return rawViolations
    .filter((v) => v && typeof v === "object")
    .slice(0, 20)
    .map((v, index) => {
      const coords = v.coordinates || {};
      return {
        id: typeof v.id === "string" && v.id ? v.id : `v-${index + 1}`,
        issue: typeof v.issue === "string" ? v.issue : "Unspecified accessibility issue",
        element: typeof v.element === "string" ? v.element : "Unknown element",
        wcag_rule: typeof v.wcag_rule === "string" ? v.wcag_rule : "WCAG (unspecified)",
        remediation:
          typeof v.remediation === "string" ? v.remediation : "No remediation provided.",
        coordinates: {
          top: clampPercent(coords.top),
          left: clampPercent(coords.left),
          width: clampPercent(coords.width),
          height: clampPercent(coords.height),
        },
      };
    })
    .filter((v) => v.coordinates.width > 0 && v.coordinates.height > 0);
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

  const { image } = body || {};
  const parsedImage = parseDataUri(image);

  if (!parsedImage) {
    return NextResponse.json(
      {
        error:
          "A valid base64-encoded PNG, JPEG, or WEBP data URI is required in the 'image' field.",
      },
      { status: 400 }
    );
  }

  // Guard against excessively large payloads (roughly >10MB base64).
  if (image.length > 14_000_000) {
    return NextResponse.json(
      { error: "Image is too large. Please upload a screenshot under 10MB." },
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
      model: VISION_MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await generateContentWithRetry(model, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Audit this website screenshot for visual accessibility violations and return the JSON described in the system prompt.",
            },
            {
              inlineData: {
                mimeType: parsedImage.mimeType,
                data: parsedImage.data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 2500,
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
        { error: "The AI model returned malformed JSON. Please try scanning again." },
        { status: 502 }
      );
    }

    const violations = sanitizeViolations(parsed.violations);

    return NextResponse.json({ violations });
  } catch (err) {
    console.error("[visual-audit] Gemini request failed:", err);

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
