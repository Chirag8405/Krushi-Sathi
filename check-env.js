import 'dotenv/config';

console.log('🔍 Environment Check:');
console.log('AI_API_KEY exists:', !!process.env.AI_API_KEY);
console.log('AI_API_KEY length:', process.env.AI_API_KEY?.length || 0);
console.log('PORT:', process.env.PORT || 'not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

// Test if we can create the Google AI instance
try {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
  console.log('✅ GoogleGenerativeAI instance created successfully');
} catch (error) {
  console.log('❌ Failed to create GoogleGenerativeAI:', error.message);
}