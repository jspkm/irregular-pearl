import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question, track } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    if (!question?.trim() || !track?.title || !track?.composer) {
      return NextResponse.json({ error: "Question and track are required" }, { status: 400 });
    }

    const prompt = `You are answering a listener's question about the currently playing classical recording.

Current track:
- Title: ${track.title}
- Composer: ${track.composer}
- Performers: ${(track.performers ?? []).join(", ")}
- Conductor: ${track.conductor || "Unknown"}

User question: ${question.trim()}

Answer in 2-4 sentences. Stay grounded in this track and its musical or historical context. If the question asks something broader, connect it back to the current recording. Avoid bullet points and avoid mentioning that you are an AI.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "I couldn't draw out a useful note on this performance just now.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Track Chat Error:", error);
    return NextResponse.json(
      { error: "Unable to answer this question right now." },
      { status: 500 }
    );
  }
}
