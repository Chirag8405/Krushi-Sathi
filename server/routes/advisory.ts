import { RequestHandler } from "express";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AdvisoryRequest, AdvisoryResponse, LangCode } from "@shared/api";

const ReqSchema = z.object({
  question: z.string().optional(),
  imageBase64: z.string().optional(),
  lang: z.custom<LangCode>(),
});

const titles: Record<string, string> = {
  en: "Crop Advisory",
  ml: "കൃഷി നിർദ്ദേശം",
  hi: "कृषि सलाह",
  mr: "पिक सल्ला",
  kn: "ಬೆಳೆ ಸಲಹೆ",
  gu: "પાક સલાહ",
  te: "పంట సలహా",
};

const stepsMap: Record<string, string[]> = {
  en: ["Inspect leaves", "Isolate affected area", "Apply organic pesticide", "Control irrigation"],
  ml: ["ഇലകൾ പരിശോധിക്കുക", "ബാധിത ഭാഗം വേർതിരിക്കുക", "ജൈവ കീടനാശിനി പ്രയോഗിക്കുക", "വെള്ളം നിയന്ത്രിക്കുക"],
  hi: ["पत्तों की जाँच करें", "संक्रमित भाग अलग करें", "जैविक कीटनाशक लगाएँ", "सिंचाई नियंत्रित करें"],
  mr: ["पाने तपासा", "संक्रमित भाग वेगळा करा", "सेंद्रिय कीटकनाशक वापरा", "पाणी नियंत्रित करा"],
  kn: ["ಎಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ", "ಪೀಡಿತ ಭಾಗವನ್ನು ಬೇರ್ಪಡಿಸಿ", "ಸೇಂದ್ರೀಯ ಕೀಟನಾಶಕ ಬಳಸಿ", "ನೀರಾವರಿ ನಿಯಂತ್ರಿಸಿ"],
  gu: ["પાંદડા તપાસો", "સંક્રમિત ભાગ અલગ કરો", "સજીવ કીટનાશક લગાવો", "સિંચાઈ નિયંત્રિત કરો"],
  te: ["ఆకులను పరిశీలించండి", "బాధిత భాగాన్ని వేరుచేయండ���", "సేంద్రీయ పురుగుమందు వాడండి", "పారుదల నియంత్రించండి"],
};

const intro: Record<string, string> = {
  en: "Here are personalized steps for your crop.",
  ml: "നിങ്ങളുടെ വിളയ്ക്ക് ആവശ്യമായ സഹായ നിർദ്ദേശങ്ങൾ താഴെ നൽകിയിരിക്കുന്നു.",
  hi: "आपकी फसल के लिए आवश्यक सलाह नीचे दी गई है।",
  mr: "तुमच्या पिकासाठी आवश्यक पायऱ्या खाली दिलेल्या आहेत.",
  kn: "ನಿಮ್ಮ ಬೆಳೆಗಾಗಿ ವೈಯಕ್ತಿಕ ಹಂತಗಳು ಕೆಳಗೆ ನೀಡಲಾಗಿದೆ.",
  gu: "તમારી પાક માટે વ્યક્તિગત પગલાં નીચે આપેલ છે.",
  te: "మీ పంట కోసం సూచనలు క్రింద ఉన్నాయి.",
};

export const postAdvisory: RequestHandler = async (req, res) => {
  const parsed = ReqSchema.safeParse(req.body as AdvisoryRequest);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { question = "", lang, imageBase64 } = parsed.data;

  // Basic image size validation (~4/3 of bytes to base64 length). Limit ~5MB.
  if (imageBase64) {
    const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
    if (approxBytes > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Image too large (max 5MB)" });
    }
  }

  const safeQuestion = String(question).slice(0, 2000);
  const useAI = !!process.env.AI_API_KEY;

  let response: AdvisoryResponse;
  if (useAI) {
    try {
      // Initialize Google Gemini AI with configuration
      const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      // Create simplified system prompt for faster response
      const systemPrompt = `You are an agricultural expert. Answer in ${lang === 'en' ? 'English' : 'the local language'}. 

Respond as JSON with:
{
  "title": "Brief advisory title",
  "text": "Practical farming advice", 
  "steps": ["step1", "step2", "step3"],
  "lang": "${lang}",
  "source": "ai"
}

Keep it concise and practical.`;

      let prompt = systemPrompt + "\n\nFarmer's question: " + safeQuestion;
      
      // Create a timeout promise for AI requests (15 seconds for better reliability)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout')), 15000);
      });
      
      // Handle image if provided
      let aiPromise: Promise<any>;
      if (imageBase64) {
        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        aiPromise = model.generateContent([
          { text: prompt + "\n\nPlease also analyze the attached image of the crop/farm." },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          } as any
        ]);
      } else {
        aiPromise = model.generateContent([{ text: prompt }]);
      }

      // Race between AI request and timeout
      const aiResult = await Promise.race([aiPromise, timeoutPromise]) as any;
      const aiResponse = aiResult.response.text();
      
      // Try to parse AI response as JSON, fallback to template if parsing fails
      try {
        const parsedResponse = JSON.parse(aiResponse);
        response = {
          title: parsedResponse.title || titles[lang] || titles.en,
          text: parsedResponse.text || `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
          steps: parsedResponse.steps || stepsMap[lang] || stepsMap.en,
          lang,
          source: "ai",
        };
      } catch (parseError) {
        // If AI response isn't valid JSON, clean and format the AI text
        let cleanText = aiResponse;
        
        // Try to extract meaningful content if it looks like JSON
        if (aiResponse.includes('{') && aiResponse.includes('}')) {
          try {
            // Attempt to extract text from malformed JSON
            const textMatch = aiResponse.match(/"text"\s*:\s*"([^"]+)"/);
            if (textMatch) {
              cleanText = textMatch[1];
            } else {
              // Fallback: clean up JSON-like formatting
              cleanText = aiResponse
                .replace(/[{}"]/g, '')
                .replace(/title\s*:\s*/gi, '')
                .replace(/text\s*:\s*/gi, '')
                .replace(/steps\s*:\s*/gi, '')
                .replace(/lang\s*:\s*/gi, '')
                .replace(/source\s*:\s*/gi, '')
                .replace(/,\s*$/gm, '')
                .trim();
            }
          } catch {
            // If all else fails, use the original response but clean it up
            cleanText = aiResponse.replace(/[{}"[\]]/g, '').trim();
          }
        }
        
        response = {
          title: titles[lang] || titles.en,
          text: cleanText || `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
          steps: stepsMap[lang] || stepsMap.en,
          lang,
          source: "ai",
        };
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // Fallback to template response
      response = {
        title: titles[lang] || titles.en,
        text: `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
        steps: stepsMap[lang] || stepsMap.en,
        lang,
        source: "template",
      };
    }
  } else {
    response = {
      title: titles[lang] || titles.en,
      text: `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
      steps: stepsMap[lang] || stepsMap.en,
      lang,
      source: "template",
    };
  }
  return res.json(response);
};
