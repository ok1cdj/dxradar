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

  const isDigital = mode === 'FT8' || mode === 'FT4';
  const prompt = `
    Analyze these DX spots for ${callsign} on ${band} ${mode}.
    User location: ${userContinent || 'Unknown'}.
    
    Spots: ${JSON.stringify(spotsContext)}
    
    Task: Provide a VERY CONCISE summary (max 2 short bullet points).
    ${isDigital ? `
    - For FT8/FT4, identify if it is **Fox/Hound (FH)**, **SuperFox**, or **MSHV** in bold.
    - Signal scale for FT8/FT4: >0dB is **Extremely Strong**, -10 to 0dB is **Strong**, -18 to -11dB is **Moderate**, <-18dB is **Weak**.
    ` : `
    - Highlight **SPLIT** info (UP/QSX) in bold if found.
    - Signal scale for CW/SSB: S9+ is **Very Strong**, S7-S9 is **Strong**, S3-S6 is **Moderate**, S1-S2 is **Weak**.
    `}
    - Describe **SIGNAL STRENGTH** in bold based on reports from ${userContinent}. Avoid just "average", describe the overall trend.
    ${mode === 'CW' ? '- Mention **WPM** in bold if found.' : ''}
    
    Example format:
    ${isDigital ? '- Operating **SuperFox** mode.' : '- Operating **SPLIT UP 5-10**.'}
    - **Strong** signals in **${userContinent}** (peaking -04dB).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
  });

  return response.text || "Could not generate summary.";
}
