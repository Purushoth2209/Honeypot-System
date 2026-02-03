
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeLog(log: any) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this security log entry for malicious activity and explain the potential threat in detail. If it's a known attack pattern (like SQLi, XSS, etc.), provide a breakdown of the payload and mitigation steps.
        
        Log Entry:
        ${JSON.stringify(log, null, 2)}`,
        config: {
          systemInstruction: "You are an expert Cybersecurity Analyst. Provide concise, technical, and actionable insights.",
          temperature: 0.2
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Unable to perform AI analysis at this time. Please check your API configuration.";
    }
  }

  async analyzeThreatLandscape(summary: any, attackers: any[], detections: any[]) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following security analytics data, provide a high-level executive summary of the current threat landscape. Identify the most critical risks and suggest immediate defensive measures.
        
        Summary: ${JSON.stringify(summary)}
        Top Attackers: ${JSON.stringify(attackers)}
        Active Detections: ${JSON.stringify(detections)}`,
        config: {
          systemInstruction: "You are a Chief Information Security Officer (CISO). Provide strategic and technical summaries of security events.",
          temperature: 0.3
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Landscape Analysis Error:", error);
      return "Unable to analyze the threat landscape at this time.";
    }
  }
}

export const geminiService = new GeminiService();
