import 'dotenv/config';

async function testLiveAPI() {
  console.log('🧪 Testing Live API Endpoint...');
  
  const testQuestion = "My corn plants are getting eaten by insects, what should I do?";
  
  try {
    const response = await fetch('http://localhost:8083/api/advisory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: testQuestion,
        lang: 'en'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('📄 API Response:');
    console.log('Title:', result.title);
    console.log('Source:', result.source);
    console.log('Text Preview:', result.text?.substring(0, 200) + '...');
    console.log('Steps Count:', result.steps?.length || 0);
    
    if (result.source === 'ai') {
      console.log('✅ SUCCESS: API is returning AI-generated responses!');
    } else if (result.source === 'template') {
      console.log('⚠️  WARNING: API is falling back to template responses');
      console.log('   This might indicate an issue with the AI service');
    } else {
      console.log('❓ UNKNOWN: Response source is', result.source);
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

// Wait a moment for the server to be ready, then test
setTimeout(testLiveAPI, 2000);