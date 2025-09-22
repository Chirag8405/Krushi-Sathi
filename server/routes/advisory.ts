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
          temperature: 0.8, // Slightly higher for more engaging responses
          maxOutputTokens: 2500, // Increased for structured, engaging content
        },
      });

      // Create comprehensive system prompt for engaging agricultural advice
const systemPrompt = `You are Dr. Krishi, a friendly and experienced agricultural expert with 25+ years of field experience across Indian farming systems. Provide engaging, easy-to-understand advice for farmers in ${lang === 'en' ? 'English' : 'the local language'}.

IMPORTANT: You must respond ONLY with a valid JSON object. Do not include any explanatory text before or after the JSON. Do not wrap the JSON in markdown code blocks. Your entire response must be this exact format:
{
  "title": "Brief, actionable title (max 60 characters)",
  "text": "Engaging, step-wise explanation written in conversational style with clear sections and bullet points",
  "steps": ["Step 1: Clear action with timing", "Step 2: Specific treatment method", "Step 3: Monitoring technique", "Step 4: Prevention strategy"],
  "lang": "${lang}",
  "source": "ai"
}

WRITING STYLE for the "text" field:
- Use conversational, friendly tone like talking to a friend
- Break content into clear sections with headings like "🔍 What's happening:", "💡 Why this occurs:", "🛠️ Solution approach:"
- Use bullet points and numbered lists within the text
- Include emojis sparingly for visual appeal
- Keep sentences short and clear
- Use local farming terminology farmers understand
- Add encouraging phrases like "Don't worry, this is fixable!" or "Many farmers face this"

CONTENT STRUCTURE for the "text" field:
🔍 **Problem Identification:**
- Acknowledge the farmer's concern warmly
- Clearly identify what's happening

💡 **Root Cause:**
- Explain why this happens in simple terms
- Mention common triggers (weather, season, etc.)

🛠️ **Treatment Options:**
1. **Organic solution** (preferred, cost-effective)
2. **Alternative method** (if organic doesn't work)
3. **Chemical backup** (last resort)

⏰ **Best Timing:**
- When to apply treatments
- Time of day considerations

🔍 **How to Monitor:**
- Signs of improvement to watch for
- Warning signs of worsening

🛡️ **Prevention Tips:**
- How to avoid this in future
- Seasonal preparation advice

Guidelines for your response:
✓ Write like you're talking to a neighbor farmer over tea
✓ Use simple, practical language that any farmer can understand
✓ Focus on solutions that work with limited resources
✓ Include cost estimates when possible (₹50-100 range preferred)
✓ Mention locally available materials (neem, turmeric, cow dung, etc.)
✓ Give specific timings (early morning, after sunset, etc.)
✓ Add encouraging words and confidence boosters
✓ Keep everything practical and actionable
✓ Use bullet points and clear sections within the text
✓ Include both quick fixes and long-term solutions

STEPS field guidelines:
- Each step should be ONE specific action
- Include timing/frequency in each step
- Start with the most urgent action
- End with prevention for next season
- Use action verbs: "Mix", "Apply", "Check", "Spray"
- Be specific about quantities and timing

Make your advice:
✓ Practical and implementable for small-scale farmers
✓ Focused on sustainable and organic methods first
✓ Include both immediate and long-term solutions
✓ Culturally appropriate for Indian farming practices
✓ Cost-effective using locally available materials when possible
✓ Safe for farmers, crops, and environment

Remember: Farmers rely on this advice for their livelihood. Be thorough, accurate, and compassionate.`;

      let prompt = systemPrompt + `

FARMER'S QUESTION: "${safeQuestion}"

CONTEXT:
- Location: Indian agricultural context
- Farmer Type: Small to medium scale farming
- Language Preference: ${lang === 'en' ? 'English' : 'Local Indian language'}
- Season: Consider current season in India (September - post-monsoon/kharif season)

Please provide your detailed agricultural advisory in the JSON format specified above.`;

      
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
          { text: prompt + `

IMAGE ANALYSIS REQUIRED:
The farmer has uploaded an image of their crop/farm. Please:
1. Carefully analyze the image for signs of disease, pests, nutrient deficiency, or other issues
2. Identify the crop type if possible
3. Note any visible symptoms (leaf discoloration, spots, wilting, insect damage, etc.)
4. Assess the overall plant health and growing conditions
5. Provide specific advice based on what you observe in the image
6. Include image-specific recommendations in your detailed response

Combine your image analysis with the farmer's question to provide the most accurate and helpful advice.` },
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
      let aiResponse = aiResult.response.text();
      
      console.log('Raw AI Response:', aiResponse); // Debug log
      
      // Clean the response if it has markdown formatting
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to parse AI response as JSON, fallback to template if parsing fails
      try {
        const parsedResponse = JSON.parse(aiResponse);
        
        // Validate that we have the required fields from AI
        if (parsedResponse.title && parsedResponse.text && parsedResponse.steps && Array.isArray(parsedResponse.steps)) {
          response = {
            title: parsedResponse.title,
            text: parsedResponse.text,
            steps: parsedResponse.steps,
            lang,
            source: "ai",
          };
        } else {
          // Missing required fields, use template with AI text if available
          response = {
            title: parsedResponse.title || titles[lang] || titles.en,
            text: parsedResponse.text || `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
            steps: parsedResponse.steps || stepsMap[lang] || stepsMap.en,
            lang,
            source: "ai",
          };
        }
      } catch (parseError) {
        console.log('JSON Parse Error:', parseError); // Debug log
        console.log('Attempting JSON extraction from response...'); // Debug log
        
        // Try to extract JSON from the response if it's embedded in text
        let extractedJson = null;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            extractedJson = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted JSON:', extractedJson); // Debug log
            
            if (extractedJson.title && extractedJson.text && extractedJson.steps) {
              response = {
                title: extractedJson.title,
                text: extractedJson.text,
                steps: extractedJson.steps,
                lang,
                source: "ai",
              };
            } else {
              throw new Error('Extracted JSON missing required fields');
            }
          } catch (extractError) {
            console.log('JSON extraction failed:', extractError); // Debug log
            extractedJson = null; // Make sure it's null for the next check
          }
        }
        
        // If JSON extraction failed, clean and format the AI text
        if (!extractedJson) {
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
                  .replace(/[{}"[\]]/g, '')
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
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      console.log('Falling back to template response');
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
    // No AI API key configured, use template response
    response = {
      title: titles[lang] || titles.en,
      text: `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
      steps: stepsMap[lang] || stepsMap.en,
      lang,
      source: "template",
    };
  }
  
  console.log('Final response:', response); // Debug log
  return res.json(response);
};
