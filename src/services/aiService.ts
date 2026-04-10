import { GoogleGenAI } from "@google/genai";
import { Spot } from "../App";

export async function generateAIAnalysis(
  apiKey: string,
  callsign: string,
  band: string,
  mode: string,
  spots: Spot[],
  userContinent: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const spotsContext = spots.slice(0, 15).map(s => ({
    spotter: s.spotter,
    freq: s.freq,
    time: s.time,
    comment: s.comment || '',
    isSkimmer: s.isSkimmer
  }));

  const prompt = `
    Analyze these DX spots for ${callsign} on ${band} ${mode}.
    User location: ${userContinent || 'Unknown'}.
    
    Spots: ${JSON.stringify(spotsContext)}
    
    Task: Provide a VERY CONCISE summary (max 2 short bullet points).
    - Highlight **SPLIT** info (UP/QSX) in bold if found.
    - Highlight **SIGNAL STRENGTH** in bold (prioritize reports from ${userContinent}).
    - If CW, mention **WPM** in bold.
    
    Example format:
    - Operating **SPLIT UP 5-10**.
    - Strong signals in **${userContinent}** (avg 20dB).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "Could not generate summary.";
}
