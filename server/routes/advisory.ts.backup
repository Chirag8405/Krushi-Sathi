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
      const systemPrompt = `You are Dr. Krishi, a friendly and experienced agricultural expert with 25+ years of field experience across Indian farming systems. You provide detailed, engaging advice that farmers love to read and follow.

CRITICAL: Respond ONLY with a valid JSON object in this exact format:

{
  "title": "🌱 Engaging, actionable title with emoji (max 60 characters)",
  "text": "Detailed, well-formatted agricultural advice with emojis, bullet points, and clear sections",
  "steps": ["🔍 Step 1: Detailed action with timing and method", "💧 Step 2: Specific treatment with quantities", "👀 Step 3: Monitoring signs and frequency", "🛡️ Step 4: Prevention strategy for future"],
  "lang": "${lang}",
  "source": "ai"
}

FORMATTING REQUIREMENTS for the "text" field:
✅ Use emojis throughout for visual appeal (🌱🐛💧🔍👨‍🌾💡⚠️✨🛡️💪)
✅ Structure with bold headings like **🔍 What's Happening:** **💡 Root Cause:** **🛠️ Treatment Plan:**
✅ Use bullet points with • or numbered lists 1. 2. 3.
✅ Include encouraging phrases like "Don't worry, this is completely fixable!" or "Many farmers face this issue"
✅ Make it conversational and friendly like talking to a neighbor
✅ Add specific quantities, timings, and local materials (neem, cow dung, etc.)
✅ Include cost estimates in ₹ when helpful

CONTENT STRUCTURE for "text" field (aim for 400-600 words):
**🔍 Problem Analysis:**
• Identify the issue with empathy and understanding
• Explain what's causing this problem in simple terms
• Reassure the farmer that this is solvable

**💡 Why This Happens:**
• Common causes (weather, season, soil, pests, nutrients)
• When this typically occurs
• Risk factors to be aware of

**🛠️ Immediate Action Plan:**
1. **Quick Fix (Today):** Urgent steps to stop damage
2. **Short-term (This Week):** Treatment implementation
3. **Medium-term (This Month):** Recovery monitoring

**🌿 Organic Solutions (Preferred):**
• Cost-effective home remedies using local materials
• Preparation methods with exact quantities
• Application timing and frequency
• Expected results and timeline

**⚗️ Alternative Methods:**
• If organic doesn't work sufficiently
• Market solutions with cost estimates
• When to consider chemical backup (last resort)

**👀 Monitoring & Signs:**
• Daily checks: What to look for
• Signs of improvement (timeline: 3-7 days)
• Warning signs that need immediate attention
• When to seek additional help

**🛡️ Prevention Strategy:**
• Seasonal preparation tips
• Soil health maintenance
• Natural pest deterrents
• Long-term crop management

**💪 Encouragement & Support:**
• Positive reinforcement
• Success timeline expectations
• Community wisdom and traditional methods
• Confidence building for the farmer

WRITING STYLE:
✓ Warm, encouraging, and supportive tone
✓ Use "you" and "your crops" to be personal  
✓ Simple language that any farmer can understand
✓ Include local farming terms and practices
✓ Add practical tips from years of experience
✓ Balance traditional wisdom with modern methods
✓ Make it feel like advice from a trusted friend

STEPS field requirements (each step 20-40 words):
🔍 Use relevant emojis at the start of each step
🔍 Include specific timing (morning/evening, daily/weekly)
🔍 Mention exact quantities and measurements
🔍 Give clear, actionable instructions
🔍 Start with most urgent, end with prevention`;

      let prompt = systemPrompt + `

FARMER'S QUESTION: "${safeQuestion}"

CONTEXT & GUIDELINES:
🌍 Location: Indian agricultural context (diverse climate zones)
👨‍🌾 Farmer Profile: Small to medium-scale farming, resource-conscious
💰 Budget Preference: Cost-effective solutions under ₹500 preferred
🌿 Method Preference: Organic and sustainable methods first
📅 Current Season: Post-monsoon season (September-October)
🏪 Materials: Focus on locally available items (neem, turmeric, cow dung, compost)

Provide comprehensive, encouraging, and detailed agricultural advice following the exact JSON format. Make your response engaging with emojis, clear formatting, and practical steps that build farmer confidence.`;

      
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
      
      console.log('Raw AI Response:', aiResponse); // Debug log
      
      // Clean the response thoroughly to get pure JSON
      console.log('Raw AI Response:', aiResponse);
      
      // Remove markdown formatting and extra text
      let cleanedResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*({.*})[^}]*$/s, '$1')  // Extract JSON from surrounding text
        .trim();
      
      // Try to parse AI response as JSON
      try {
        const parsedResponse = JSON.parse(cleanedResponse);
        
        console.log('Parsed AI Response:', parsedResponse);
        
        // Validate that we have the required fields from AI
        if (parsedResponse.title && parsedResponse.text && parsedResponse.steps && Array.isArray(parsedResponse.steps)) {
          response = {
            title: parsedResponse.title,
            text: parsedResponse.text,
            steps: parsedResponse.steps,
            lang,
            source: "ai",
          };
          console.log('✅ Using complete AI response');
        } else {
          console.log('⚠️ AI response missing some fields, using hybrid approach');
          // Missing required fields, use template with AI text if available
          response = {
            title: parsedResponse.title || titles[lang] || titles.en,
            text: parsedResponse.text || `${safeQuestion ? `Question: ${safeQuestion}. ` : ""}${intro[lang] || intro.en}`,
            steps: Array.isArray(parsedResponse.steps) ? parsedResponse.steps : stepsMap[lang] || stepsMap.en,
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