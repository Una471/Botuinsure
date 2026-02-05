// Local Test Script for PDF Parser
// Run with: node test-parser.js

const fs = require('fs');
const pdf = require('pdf-parse');

// Put your Gemini API key here for testing
const GEMINI_API_KEY = 'AIzaSyBeSfDbjoeUYmGN7UIk6vU5Iukn7FKIPFc';

async function testPDFParser(pdfPath) {
    console.log('🧪 Testing PDF Parser Locally\n');
    console.log('📄 Reading PDF:', pdfPath);
    
    try {
        // Read the PDF file
        const dataBuffer = fs.readFileSync(pdfPath);
        console.log('✅ PDF file read successfully');
        console.log('📊 File size:', (dataBuffer.length / 1024).toFixed(2), 'KB\n');
        
        // Parse PDF
        console.log('🔍 Parsing PDF...');
        const pdfData = await pdf(dataBuffer);
        console.log('✅ PDF parsed successfully');
        console.log('📑 Pages:', pdfData.numpages);
        console.log('📝 Text length:', pdfData.text.length, 'characters\n');
        
        console.log('=== FIRST 500 CHARACTERS ===');
        console.log(pdfData.text.substring(0, 500));
        console.log('=== END PREVIEW ===\n');
        
        if (pdfData.text.length < 50) {
            console.log('⚠️  WARNING: PDF has very little text. It might be scanned/image-based.');
            return;
        }
        
        // Test Gemini extraction
        console.log('🤖 Testing Gemini AI extraction...');
        const extractedData = await extractWithGemini(pdfData.text);
        
        console.log('\n✅ EXTRACTION SUCCESSFUL!\n');
        console.log('📋 Extracted Data:');
        console.log(JSON.stringify(extractedData, null, 2));
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
    }
}

async function extractWithGemini(pdfText) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'AIzaSyBeSfDbjoeUYmGN7UIk6vU5Iukn7FKIPFc') {
        throw new Error('Please set GEMINI_API_KEY in test-parser.js');
    }
    
    const prompt = `You are an insurance data extraction expert for Botswana insurance products. Extract the following details from the insurance brochure text and return ONLY valid JSON (no markdown formatting, no backticks).

Return this exact structure:
{
  "Name": "Product Name",
  "Category": "medical",
  "Company Name": "Insurance Company Name",
  "Sum Assured": "Amount or description",
  "Annual Limit": 0,
  "Basic Price": 0,
  "Standard Price": 0,
  "Premium Price": 0,
  "Key Features": "Brief summary of key benefits"
}

Rules:
- Category must be one of: medical, life, funeral, health, property, liability, workers_compensation
- Annual Limit, Basic Price, Standard Price, Premium Price MUST be numbers (use 0 if not found)
- Extract monthly prices if available, or convert annual to monthly
- Look for product names like "PulaMed Classic", "BPOMAS Gold", etc.
- Key Features should be a concise summary (max 200 chars)

Brochure Text:
${pdfText.substring(0, 15000)}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048
                }
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini');
    }

    let jsonText = result.candidates[0].content.parts[0].text.trim();
    
    // Clean up any markdown formatting
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.log('Raw Gemini response:', jsonText);
        throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and ensure numeric fields
    return {
        Name: String(parsed.Name || 'Unknown Product'),
        Category: String(parsed.Category || 'medical'),
        "Company Name": String(parsed["Company Name"] || 'Unknown Company'),
        "Sum Assured": String(parsed["Sum Assured"] || ''),
        "Annual Limit": Number(parsed["Annual Limit"]) || 0,
        "Basic Price": Number(parsed["Basic Price"]) || 0,
        "Standard Price": Number(parsed["Standard Price"]) || 0,
        "Premium Price": Number(parsed["Premium Price"]) || 0,
        "Key Features": String(parsed["Key Features"] || '')
    };
}

// Get PDF path from command line argument
const pdfPath = process.argv[2];

if (!pdfPath) {
    console.log('Usage: node test-parser.js <path-to-pdf>');
    console.log('Example: node test-parser.js ./sample.pdf');
    process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
    console.error('Error: PDF file not found:', pdfPath);
    process.exit(1);
}

// Run the test
testPDFParser(pdfPath);