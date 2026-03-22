// src/utils/groq.js
// ─── Groq API call for symptom analysis ──────────────────────────────────────
// Uses llama3-8b-8192 — fast and free on Groq's free tier.
// In production: move this call to a backend endpoint so your API key
// is never exposed in the browser bundle.

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are a medical AI assistant. When given a list of symptoms,
analyze them and respond ONLY with a valid JSON object in this exact format:
{
  "condition": "Most likely condition name",
  "confidence": 85,
  "severity": "mild" | "moderate" | "severe",
  "description": "A brief, plain-English explanation of the condition (2-3 sentences).",
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3",
    "Actionable recommendation 4"
  ],
  "seekHelpIf": [
    "Warning sign 1",
    "Warning sign 2"
  ]
}
Do not include any text before or after the JSON. Do not use markdown code blocks.
Always remind the user this is not a substitute for professional medical advice.`;

export const analyzeSymptoms = async (symptoms) => {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY is not set in .env.local');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,     // low temp = more consistent medical responses
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `My symptoms are: ${symptoms.join(', ')}.
Please analyze and return the JSON response.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Groq API request failed');
  }

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content?.trim();

  if (!raw) throw new Error('Empty response from Groq');

  // Robustly grab the JSON object from anywhere in the response
  // handles markdown fences, leading/trailing text, disclaimers, etc.
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not find JSON in Groq response');

  return JSON.parse(jsonMatch[0]);
};