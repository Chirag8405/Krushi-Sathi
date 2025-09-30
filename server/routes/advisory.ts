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
        model: "gemini-2.0-flash-exp", // Use the most reliable available model
        generationConfig: {
          temperature: 0.8, // Slightly higher for more engaging responses
          maxOutputTokens: 3000, // Increased for detailed structured content
        },
      });

      // Create detailed and engaging prompt for comprehensive agricultural advice
      // Create detailed and engaging prompt for comprehensive agricultural advice
      const systemPrompt = `You are Dr. Krishi, an Indian agricultural expert helping farmers with all agricultural questions.

CRITICAL: You MUST respond with ONLY valid JSON. No text before or after. Start with { and end with }.

Read the farmer's question carefully and provide relevant advice. Questions can be about:
- Which crops to grow in specific regions/states/districts
- Pest/disease problems and treatments  
- Farming techniques and best practices
- Seasonal planning and crop selection
- Soil management and fertilization
- Market prices and crop economics
- Any other agricultural topic

JSON format required:
{
  "title": "🌱 [Title matching the question topic]", 
  "text": "**[Content that directly answers the farmer's question with bold headings, practical advice, and costs in ₹]**",
  "steps": ["🔍 Step 1", "💧 Step 2", "👀 Step 3", "🛡️ Step 4"],
  "lang": "${lang}",
  "source": "ai"
}

CONTENT GUIDELINES:
✅ READ the actual question and answer it specifically
✅ Use **bold** for headings and key points
✅ Include emojis: 🌱🌾🐛💧🔍👨‍🌾💡⚠️✨🛡️💪
✅ Keep conversational and supportive tone  
✅ Include costs in ₹ when relevant
✅ Provide practical, actionable advice

EXAMPLE RESPONSES:
- "crops grown in Kerala" → List major crops like rice, coconut, spices, rubber with growing conditions
- "pest problem on tomato" → Identify pest, provide organic treatments with costs
- "best time to plant wheat" → Seasonal timing, variety recommendations, preparation steps

IMPORTANT: Answer the ACTUAL question asked. Don't default to pest advice unless the question is about pests.



CONTENT STRUCTURE for "text" field (300-500 words max):
**🔍 Problem:** Identify the issue and reassure it's fixable
**💡 Cause:** Explain why this happens simply  
**🛠️ Solutions:** List 2-3 organic treatments with quantities and costs
**👀 Monitoring:** What to watch for in next 3-7 days
**🛡️ Prevention:** Future protection tips
**💪 Encouragement:** Positive, supportive closing

WRITING STYLE: Warm, personal, simple language, practical tips

STEPS field (4 steps, each 15-30 words):
🔍 Start with emoji + specific action + timing
� Include quantities and materials (neem, turmeric, etc.)
� Mention monitoring frequency and signs
�️ End with prevention tip

REMEMBER: Output ONLY valid JSON. No extra text, explanations, or markdown formatting outside the JSON structure.`;

      let prompt = systemPrompt + `

FARMER'S QUESTION: "${safeQuestion}"

CONTEXT: Indian agriculture, post-monsoon season, budget under ₹500, prefer organic solutions.

RESPOND WITH ONLY JSON - NO EXPLANATIONS OR EXTRA TEXT:`;

      
      // Create a timeout promise for AI requests (25 seconds for detailed responses)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout')), 25000);
      });
      
      // Handle image if provided
      let aiPromise: Promise<any>;
      if (imageBase64) {
        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        aiPromise = model.generateContent([
          { text: prompt + `

📸 **IMAGE ANALYSIS REQUIRED:**
The farmer has uploaded an image of their crop/farm. Please provide detailed visual analysis:

**🔍 Visual Assessment:**
• Identify the crop type and growth stage
• Note leaf color, texture, and any discoloration patterns
• Look for pest damage, disease symptoms, or nutrient deficiencies
• Assess soil condition visible in image
• Check plant spacing, overall health, and environmental conditions

**💡 Image-Specific Insights:**
• Describe exactly what you observe in the image
• Correlate visual symptoms with possible causes
• Provide image-based evidence for your recommendations
• Include stage-specific advice based on plant growth visible

**🎯 Targeted Solutions:**
Combine your visual analysis with the farmer's question to provide laser-focused, image-specific advice in your detailed JSON response. Be specific about what you see and how it relates to the solution.` },
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
      let aiResult;
      try {
        aiResult = await Promise.race([aiPromise, timeoutPromise]) as any;
      } catch (error: any) {
        // If we get a 404 model not found error, try fallback models
        if (error.status === 404 && error.message?.includes('not found')) {
          console.log('Model not found, trying fallback model...');
          const fallbackModel = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2500,
            },
          });
          
          if (imageBase64) {
            const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            aiResult = await fallbackModel.generateContent([
              { text: prompt + `\n\nIMAGE ANALYSIS REQUIRED: Please analyze the uploaded image and provide specific advice based on what you observe.` },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              } as any
            ]);
          } else {
            aiResult = await fallbackModel.generateContent([{ text: prompt }]);
          }
        } else {
          throw error; // Re-throw if it's not a model availability issue
        }
      }
      
      let aiResponse = aiResult.response.text();
      
      console.log('=== AI RESPONSE DEBUG ===');
      console.log('Length:', aiResponse.length);
      console.log('Starts with {:', aiResponse.trim().startsWith('{'));
      console.log('Ends with }:', aiResponse.trim().endsWith('}'));
      console.log('Preview:', aiResponse.substring(0, 300));
      console.log('========================');
      
      // Multiple strategies to extract valid JSON
      let parsedResponse = null;
      
      // Strategy 1: Try parsing as-is (if AI returned clean JSON)
      try {
        parsedResponse = JSON.parse(aiResponse.trim());
        console.log('✅ Direct JSON parse successful');
      } catch (e1) {
        console.log('Direct parse failed, trying cleanup...');
        
        // Strategy 2: Remove markdown and extra text
        let cleanedResponse = aiResponse
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/^[^{]*({.*})[^}]*$/s, '$1')
          .trim();
        
        try {
          parsedResponse = JSON.parse(cleanedResponse);
          console.log('✅ Cleaned JSON parse successful');
        } catch (e2) {
          console.log('Cleaned parse failed, trying extraction...');
          
          // Strategy 3: Extract JSON object more aggressively
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsedResponse = JSON.parse(jsonMatch[0]);
              console.log('✅ Extracted JSON parse successful');
            } catch (e3) {
              console.log('All JSON parsing strategies failed');
            }
          }
        }
      }
      
      // If we successfully parsed JSON, validate and use it
      if (parsedResponse && parsedResponse.title && parsedResponse.text && parsedResponse.steps && Array.isArray(parsedResponse.steps)) {
        response = {
          title: parsedResponse.title,
          text: parsedResponse.text,
          steps: parsedResponse.steps,
          lang,
          source: "ai",
        };
        console.log('✅ Using complete AI response');
      } else if (parsedResponse) {
        // Partial parsing success - fill in missing fields
        console.log('⚠️ AI response missing some fields, using hybrid approach');
        response = {
          title: parsedResponse.title || titles[lang] || titles.en,
          text: parsedResponse.text || `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
          steps: Array.isArray(parsedResponse.steps) && parsedResponse.steps.length > 0 ? parsedResponse.steps : stepsMap[lang] || stepsMap.en,
          lang,
          source: "ai",
        };
      } else {
        // Complete parsing failure - return error
        console.log('❌ Failed to parse AI response as JSON');
        return res.status(503).json({
          error: 'AI service returned invalid response format. Please try again.',
          code: 'AI_PARSE_ERROR'
        });
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // Return error instead of template response
      return res.status(503).json({
        error: 'Service temporarily unavailable. Our AI advisory service is currently experiencing technical difficulties. Please try again in a few minutes.',
        code: 'AI_SERVICE_ERROR'
      });
    }
  } else {
    // No AI API key configured, return error
    return res.status(503).json({
      error: 'Service configuration error. AI advisory service is not properly configured. Please contact support.',
      code: 'AI_CONFIG_ERROR'
    });
  }
  
  console.log('Final response:', response); // Debug log
  return res.json(response);
};