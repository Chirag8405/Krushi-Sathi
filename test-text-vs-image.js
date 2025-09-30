import 'dotenv/config';

async function testTextVsImageAI() {
  console.log('🧪 Testing Text vs Image AI Response Differences...\n');
  
  // Test 1: Text-only question
  console.log('📝 TEST 1: Text-only question');
  await testQuestion({
    question: "My tomato plants have yellow leaves and black spots, what should I do?",
    lang: "en"
  }, "TEXT QUESTION");
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Test 2: Image with question (simulated)
  console.log('🖼️ TEST 2: Image upload with question');
  await testQuestion({
    question: "What's wrong with my plant?",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/", // Fake base64
    lang: "en"
  }, "IMAGE QUESTION");
  
  console.log('\n🔍 Analysis complete!');
}

async function testQuestion(payload, testType) {
  try {
    console.log(`📤 Sending ${testType}...`);
    console.log(`Question: "${payload.question}"`);
    if (payload.imageBase64) {
      console.log(`Image: Yes (${payload.imageBase64.length} chars)`);
    }
    
    const response = await fetch('http://localhost:8083/api/advisory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`📄 ${testType} Response:`);
    console.log(`   Source: ${result.source}`);
    console.log(`   Title: ${result.title}`);
    console.log(`   Text length: ${result.text?.length || 0} chars`);
    console.log(`   Steps: ${result.steps?.length || 0} items`);
    
    if (result.source === 'ai') {
      console.log(`✅ ${testType}: AI working correctly!`);
      console.log(`   First 100 chars: "${result.text?.substring(0, 100)}..."`);
    } else {
      console.log(`⚠️  ${testType}: Using template response`);
      console.log(`   Template text: "${result.text?.substring(0, 100)}..."`);
    }
    
  } catch (error) {
    console.error(`❌ ${testType} failed:`, error.message);
  }
}

// Wait for server to be ready
setTimeout(testTextVsImageAI, 1000);