import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function explainConcept(concept: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As a top-tier ECE YouTuber, explain the topic "${concept}".
    
    Structure the response with these sections:
    1. **YouTube Style TL;DR**: Fast-paced hook.
    2. **Interactive Walkthrough**: Provide 3 steps formatted as [STEP X].
    3. **Technical Rigor**: Core math.
    4. **Simulation Assignment**: Quick project.
    
    CRITICAL FEATURE: If the explanation involves code, a circuit netlist, or a structured lab report, wrap that specific content in [ARTIFACT: title] tags.
    Example: [ARTIFACT: 8085 Assembler Code] { code here } [/ARTIFACT]
    
    Tone: Energetic and witty.`,
    config: {
      temperature: 0.8,
    }
  });

  return response.text;
}

export async function generateSchedule(subjects: string[], routine: { wakeUp: string, sleep: string }, tasks: string[]) {
  const prompt = `As a Chief of Staff for an ECE student, generate a daily schedule.
  Subjects: ${subjects.join(', ')}
  Routine: Wake up at ${routine.wakeUp}, Sleep at ${routine.sleep}
  Specific Tasks: ${tasks.join(', ')}
  
  Break the day into "Deep Work" (90-min sessions for tough subjects) and "Shallow Work" (routine tasks).
  Ensuring logical flow and breaks. 
  Respond in JSON format:
  {
    "schedule": [
      { "time": "08:00 AM", "activity": "Wake up", "type": "routine" },
      ...
    ]
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || '{}');
}
