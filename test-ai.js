import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function testDirectAPI() {
  console.log('Testing direct API call...');
  
  if (!process.env.AI_API_KEY) {
    console.error('No API key found in environment');
    return;
  }
  
  // Test direct API call to see what models are available
  const apiKey = process.env.AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  try {
    console.log('Fetching available models...');
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.models && data.models.length > 0) {
      console.log('\nAvailable models:');
      data.models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        if (model.supportedGenerationMethods) {
          console.log(`   Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });
      
      // Try to use the first available model that supports generateContent
      const textModel = data.models.find(m => 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent')
      );
      
      if (textModel) {
        console.log(`\n🎯 Trying to use model: ${textModel.name}`);
        await testModelGeneration(textModel.name.replace('models/', ''));
      }
    }
    
  } catch (error) {
    console.error('Direct API test failed:', error);
  }
}

async function testModelGeneration(modelName) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log(`Generating content with ${modelName}...`);
    const result = await model.generateContent([
      { text: 'Respond with: {"test": "success", "model": "' + modelName + '"}' }
    ]);
    
    const response = result.response.text();
    console.log('✅ SUCCESS! Raw response:', response);
    
    // Try to parse it
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      console.log('✅ Parsed JSON:', parsed);
      return true;
    } catch (parseError) {
      console.log('⚠️ Model works but JSON parsing failed');
      console.log('Raw response for debugging:', JSON.stringify(response));
      return true; // Still counts as success
    }
    
  } catch (error) {
    console.log(`❌ Model ${modelName} failed:`, error.message);
    return false;
  }
}

async function testAI() {
  await testDirectAPI();
}

testAI().catch(console.error);