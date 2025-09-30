import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Test the exact same setup as the advisory.ts file
async function testAdvisoryAI() {
  console.log('🧪 Testing Advisory AI Setup...');
  
  if (!process.env.AI_API_KEY) {
    console.error('❌ No AI API key found');
    return;
  }

  try {
    // Use the same setup as advisory.ts
    const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2500,
      },
    });

    // Test with the same prompt structure as advisory.ts
    const lang = "en";
    const safeQuestion = "My tomato plants have yellow leaves. What should I do?";
    
    const systemPrompt = `You are Dr. Krishi, an experienced agricultural advisor. Respond ONLY with a valid JSON object in this exact format:

{
  "title": "Brief agricultural advice title (max 50 characters)",
  "text": "Clear, practical farming advice with specific steps and solutions",
  "steps": ["Step 1: Specific action", "Step 2: Treatment method", "Step 3: Monitoring", "Step 4: Prevention"],
  "lang": "${lang}",
  "source": "ai"
}

Rules:
- Respond with ONLY the JSON object
- No markdown formatting or code blocks
- No text before or after the JSON
- Use practical, actionable advice for Indian farmers
- Include organic and cost-effective solutions
- Each step should be 1-2 sentences maximum`;

    const prompt = systemPrompt + `

FARMER'S QUESTION: "${safeQuestion}"

Provide practical agricultural advice for Indian farmers. Focus on organic solutions, cost-effective methods, and locally available materials.`;

    console.log('📡 Sending request to AI...');
    const result = await model.generateContent([{ text: prompt }]);
    const aiResponse = result.response.text();
    
    console.log('📄 Raw AI Response:');
    console.log(aiResponse);
    console.log('--- End Raw Response ---\n');
    
    // Test the parsing logic
    let cleanedResponse = aiResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^[^{]*({.*})[^}]*$/s, '$1')
      .trim();
    
    console.log('🧹 Cleaned Response:');
    console.log(cleanedResponse);
    console.log('--- End Cleaned Response ---\n');
    
    try {
      const parsed = JSON.parse(cleanedResponse);
      console.log('✅ SUCCESS! Parsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Validate required fields
      if (parsed.title && parsed.text && parsed.steps && Array.isArray(parsed.steps)) {
        console.log('✅ All required fields present');
        console.log('🎯 AI Advisory system is working correctly!');
      } else {
        console.log('⚠️ Some fields missing:', {
          hasTitle: !!parsed.title,
          hasText: !!parsed.text,
          hasSteps: !!parsed.steps,
          stepsIsArray: Array.isArray(parsed.steps)
        });
      }
      
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message);
      console.log('This would trigger the fallback template response');
    }
    
  } catch (error) {
    console.error('❌ AI test failed:', error);
  }
}

testAdvisoryAI().catch(console.error);