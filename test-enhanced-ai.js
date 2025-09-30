import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function testEnhancedAI() {
  console.log('🧪 Testing Enhanced AI Responses...');
  console.log('📋 Testing detailed, formatted agricultural advice\n');
  
  if (!process.env.AI_API_KEY) {
    console.error('❌ No AI API key found');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 3000,
      },
    });

    // Test question about plant disease
    const testQuestion = "My tomato plants have yellow leaves and small holes. Some leaves are curling up. What should I do?";
    
    console.log('📤 Testing with question:', testQuestion);
    console.log('⏳ Generating detailed AI response...\n');
    
    const systemPrompt = `You are Dr. Krishi, a friendly and experienced agricultural expert with 25+ years of field experience across Indian farming systems. You provide detailed, engaging advice that farmers love to read and follow.

CRITICAL: Respond ONLY with a valid JSON object in this exact format:

{
  "title": "🌱 Engaging, actionable title with emoji (max 60 characters)",
  "text": "Detailed, well-formatted agricultural advice with emojis, bullet points, and clear sections",
  "steps": ["🔍 Step 1: Detailed action with timing and method", "💧 Step 2: Specific treatment with quantities", "👀 Step 3: Monitoring signs and frequency", "🛡️ Step 4: Prevention strategy for future"],
  "lang": "en",
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

**👀 Monitoring & Signs:**
• Daily checks: What to look for
• Signs of improvement (timeline: 3-7 days)
• Warning signs that need immediate attention

**🛡️ Prevention Strategy:**
• Seasonal preparation tips
• Soil health maintenance
• Natural pest deterrents
• Long-term crop management

WRITING STYLE:
✓ Warm, encouraging, and supportive tone
✓ Use "you" and "your crops" to be personal  
✓ Simple language that any farmer can understand
✓ Include local farming terms and practices
✓ Add practical tips from years of experience
✓ Balance traditional wisdom with modern methods
✓ Make it feel like advice from a trusted friend

FARMER'S QUESTION: "${testQuestion}"

CONTEXT & GUIDELINES:
🌍 Location: Indian agricultural context (diverse climate zones)
👨‍🌾 Farmer Profile: Small to medium-scale farming, resource-conscious
💰 Budget Preference: Cost-effective solutions under ₹500 preferred
🌿 Method Preference: Organic and sustainable methods first
📅 Current Season: Post-monsoon season (September-October)
🏪 Materials: Focus on locally available items (neem, turmeric, cow dung, compost)

Provide comprehensive, encouraging, and detailed agricultural advice following the exact JSON format. Make your response engaging with emojis, clear formatting, and practical steps that build farmer confidence.`;

    const result = await model.generateContent([{ text: systemPrompt }]);
    const response = result.response.text();
    
    console.log('📄 Raw AI Response:');
    console.log('═'.repeat(60));
    console.log(response);
    console.log('═'.repeat(60));
    
    // Clean and parse the response
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleaned);
      console.log('\n✅ Successfully parsed JSON!');
      console.log('📋 Response Analysis:');
      console.log('  Title:', parsed.title);
      console.log('  Source:', parsed.source);
      console.log('  Text length:', parsed.text?.length || 0, 'characters');
      console.log('  Steps count:', parsed.steps?.length || 0);
      console.log('  Contains emojis:', /[\u{1F300}-\u{1F9FF}]/u.test(parsed.text || ''));
      console.log('  Contains bold text:', /\*\*.*\*\*/.test(parsed.text || ''));
      console.log('  Contains bullet points:', /[•·]/.test(parsed.text || ''));
      
      console.log('\n📝 Formatted Response Preview:');
      console.log('─'.repeat(50));
      console.log('🏷️ TITLE:', parsed.title);
      console.log('\n📄 TEXT PREVIEW (first 500 chars):');
      console.log(parsed.text?.substring(0, 500) + '...');
      console.log('\n📋 STEPS:');
      parsed.steps?.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
      
      if (parsed.text && parsed.text.length > 300 && /[\u{1F300}-\u{1F9FF}]/u.test(parsed.text)) {
        console.log('\n🎉 SUCCESS: AI is now generating detailed, formatted responses with emojis!');
      } else {
        console.log('\n⚠️ The response could be more detailed or better formatted');
      }
      
    } catch (parseError) {
      console.log('\n❌ Failed to parse JSON:', parseError.message);
      console.log('Trying to extract JSON from response...');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully extracted JSON from response');
          console.log('Title:', extracted.title);
          console.log('Text length:', extracted.text?.length || 0);
        } catch (extractError) {
          console.log('❌ Extraction also failed:', extractError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ AI test failed:', error.message);
  }
}

testEnhancedAI().catch(console.error);