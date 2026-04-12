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
    isSkimmer: s.isSkimmer,
    continent: s.spotterCont
  }));

  const isDigital = mode === 'FT8' || mode === 'FT4';
  const prompt = `
    Analyze these DX spots for ${callsign} on ${band} ${mode}.
    User location: ${userContinent || 'Unknown'}.
    
    Spots: ${JSON.stringify(spotsContext)}
    
    Task: Provide a VERY CONCISE summary (max 2 short bullet points).
    ${isDigital ? `
    - For FT8/FT4, identify if it is **Fox/Hound (FH)**, **SuperFox**, or **MSHV** in bold. 
    - IMPORTANT: This information can ONLY be found in the "comment" field of human spots (where "isSkimmer" is false). 
    - DO NOT GUESS. If no human comment mentions the mode, omit this point entirely.
    - Signal scale for FT8/FT4 (negative dB): >0dB is **Extremely Strong**, -10 to 0dB is **Strong**, -18 to -11dB is **Moderate**, <-18dB is **Weak**.
    ` : `
    - Highlight **SPLIT** info (UP/QSX) in bold if found.
    - Signal scale for CW (positive dB SNR from skimmers): >30dB is **Extremely Strong**, 15-30dB is **Strong**, 5-15dB is **Moderate**, <5dB is **Weak**.
    - Signal scale for SSB: ONLY describe signal strength if explicit reports like "59", "599", "strong", "loud", "weak" are found in comments. **DO NOT GUESS or invent signal strength for SSB if not explicitly mentioned.**
    `}
    - Mention activity status in bold if found in comments: **Big pileup**, **Busy**, **Alone/Calling CQ**, **Easy to work**, etc.
    ${band === '6m' ? `
    - For 6m band, be very specific about geography. List specific countries where the station is being heard based on spotter callsigns (e.g., "Heard in **Italy**, **France** and **Spain**").
    - Look for propagation types in comments: **ES** (Sporadic E), **TEP**, **AUR**, **F2**, **MS** and mention them if found.
    ` : ''}
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
