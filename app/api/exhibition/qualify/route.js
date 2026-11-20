import { NextResponse } from "next/server";

const MODEL = "claude-sonnet-4-20250514";

function fallbackAnalysis(lead = {}) {
  const text = `${lead.whatTheyDo || ""} ${(lead.products || []).join(" ")} ${lead.businessType || ""}`.toLowerCase();
  const categories = [];

  if (/(electronic|inverter|charger|component|wire|cable|solar)/.test(text)) categories.push("E-Waste");
  if (/(battery|lithium|lead-acid)/.test(text)) categories.push("Battery");
  if (/(plastic|packaging|mlp|flexible|rigid)/.test(text)) categories.push("Plastic");
  if (/(solar|pv|module|panel)/.test(text)) categories.push("Solar");

  const needsEpr = categories.length > 0 && !/(consultant|service provider)/.test(text);

  return {
    needs_epr: needsEpr,
    confidence: needsEpr ? 0.78 : 0.43,
    verdict_reason: needsEpr
      ? "Lead appears to be in manufacturing/import/branding of regulated products under EPR obligations."
      : "Lead profile is unclear or outside direct product obligations; requires manual legal check.",
    categories,
    penalty_amount: needsEpr ? "Up to INR 1 crore+ depending on non-compliance severity" : "Not determined",
    penalty_details: "Indicative exposure under Environment (Protection) Act and CPCB/SPCB actions; verify by legal team.",
    pain_question:
      "If CPCB asks for your annual EPR evidence next quarter, do you have category-wise registration and fulfillment trail ready?",
    pitch:
      "Most companies here are losing time because they are unsure which product categories trigger EPR. We map your exact obligation by product mix and revenue exposure, then execute registration plus annual filing. You get a clear compliance calendar so your sales and import operations stay uninterrupted.",
    likely_objection: "We will do this later once business grows.",
    objection_handle:
      "Delays usually increase cost because filings and evidence backlogs pile up. A short gap assessment now can prevent notices and preserve procurement and channel confidence.",
    urgency_level: needsEpr ? "Warm" : "Cold",
    urgency_reason: needsEpr
      ? "Potentially regulated product lines detected and business activity appears active."
      : "No strong regulated signal in current input."
  };
}

function parseModelJson(text) {
  const cleaned = String(text || "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const fenced = cleaned.match(/```json\s*([\s\S]*?)```/i) || cleaned.match(/```([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      return JSON.parse(fenced[1].trim());
    }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const exhibition = body?.exhibition || {};
    const lead = body?.lead || {};

    if (!lead.companyName || !lead.whatTheyDo || !lead.businessType) {
      return NextResponse.json({ error: "Missing required lead fields" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ analysis: fallbackAnalysis(lead), source: "fallback" });
    }

    const systemPrompt = [
      "You are an EPR compliance specialist for India and a field sales strategist.",
      "Context:",
      `Exhibition Name: ${exhibition.name || "Unknown"}`,
      `Exhibition Dates: ${exhibition.dates || "Unknown"}`,
      `Exhibition Location: ${exhibition.location || "Unknown"}`,
      `Industry Focus: ${exhibition.industryFocus || "Unknown"}`,
      `Attendee Types: ${Array.isArray(exhibition.attendeeTypes) ? exhibition.attendeeTypes.join(", ") : "Unknown"}`,
      "Tasks:",
      "1) Determine if this lead likely needs EPR compliance under Indian MoEFCC/CPCB frameworks.",
      "2) Map likely categories (E-Waste, Battery, Plastic, Solar) based on business profile.",
      "3) Prioritize real-world penalty risk and practical sales conversion language.",
      "Output format: Return ONLY strict JSON. No markdown, no prose outside JSON.",
      "JSON schema:",
      JSON.stringify(
        {
          needs_epr: true,
          confidence: 0.91,
          verdict_reason: "brief reason",
          categories: ["E-Waste", "Battery"],
          penalty_amount: "INR value or risk band",
          penalty_details: "short legal risk detail",
          pain_question: "one sharp field sales question",
          pitch: "exactly 3 sentences",
          likely_objection: "one likely objection",
          objection_handle: "clear rebuttal",
          urgency_level: "Hot",
          urgency_reason: "why this urgency"
        },
        null,
        2
      )
    ].join("\n");

    const userPrompt = JSON.stringify(
      {
        lead: {
          company_name: lead.companyName,
          what_they_do: lead.whatTheyDo,
          business_type: lead.businessType,
          revenue_range: lead.revenueRange || "Unknown",
          products_involved: Array.isArray(lead.products) ? lead.products : []
        }
      },
      null,
      2
    );

    const modelRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1100,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (!modelRes.ok) {
      const errorText = await modelRes.text();
      return NextResponse.json({ error: `Anthropic API error: ${errorText}` }, { status: 502 });
    }

    const modelJson = await modelRes.json();
    const text = Array.isArray(modelJson?.content)
      ? modelJson.content
          .filter((item) => item?.type === "text")
          .map((item) => item.text || "")
          .join("\n")
      : "";

    const parsed = parseModelJson(text);
    return NextResponse.json({ analysis: parsed, source: "anthropic" });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
