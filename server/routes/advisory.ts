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
      // Initialize Google Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create system prompt based on language
      const systemPrompt = `You are an expert agricultural advisor. Provide practical, actionable advice for farmers in ${lang === 'en' ? 'English' : 'the local language'}. 
      
Format your response as a JSON object with:
- title: A brief title for the advisory
- text: A detailed explanation of the issue and solution
- steps: An array of 3-4 specific action steps
- lang: "${lang}"
- source: "ai"

Keep advice practical, safe, and suitable for small-scale farmers. Focus on organic and sustainable methods when possible.`;

      let prompt = systemPrompt + "\n\nFarmer's question: " + safeQuestion;
      
      // Handle image if provided
      if (imageBase64) {
        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const result = await model.generateContent([
          { text: prompt + "\n\nPlease also analyze the attached image of the crop/farm." },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          } as any
        ]);
        const aiResponse = result.response.text();
        
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
          // If AI response isn't valid JSON, create a response with AI text
          response = {
            title: titles[lang] || titles.en,
            text: aiResponse,
            steps: stepsMap[lang] || stepsMap.en,
            lang,
            source: "ai",
          };
        }
      } else {
        const result = await model.generateContent([{ text: prompt }]);
        const aiResponse = result.response.text();
        
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
          // If AI response isn't valid JSON, create a response with AI text
          response = {
            title: titles[lang] || titles.en,
            text: aiResponse,
            steps: stepsMap[lang] || stepsMap.en,
            lang,
            source: "ai",
          };
        }
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
