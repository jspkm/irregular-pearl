import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, composer, performers } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `Write a fascinating, multi-sentence musical insight about "${title}" composed by ${composer}, performed by ${performers.join(", ")}. 
    
    The insight should be rich and detailed (approx. 250-400 characters), exploring:
    - Information about the performer(s).
    - What was happening culturally and artistically when the piece was composed or first performed.
    - A brief music theory insight into this specific piece (e.g., harmonic structure, motif, or tonal innovations).
    
    Avoid introductory phrases like "Did you know". Make it feel like an immersive program note whispered to the listener. 
    Vary the focus each time to keep it fresh.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    const data = await response.json();
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Musical history in every note.";

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Musical Insight Error:", error);
    return NextResponse.json({ insight: "Distilled musical elegance." });
  }
}
