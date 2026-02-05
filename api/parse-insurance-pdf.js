// Vercel Serverless Function for Insurance PDF Parsing
const pdf = require('pdf-parse');

// Extract insurance data using Gemini AI
async function extractWithGemini(pdfText) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured in Vercel environment variables');
    }
    
    if (!pdfText || pdfText.length < 50) {
        return {
            Name: "Scanned PDF or Empty",
            Category: "medical",
            "Company Name": "Unknown",
            "Sum Assured": "",
            "Annual Limit": 0,
            "Basic Price": 0,
            "Standard Price": 0,
            "Premium Price": 0,
            "Key Features": "This PDF appears to be scanned or empty. Please enter data manually."
        };
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

    try {
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
                        maxOutputTokens: 2048,
                        responseMimeType: "application/json"
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
            throw new Error('No valid JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and ensure numeric fields
        const validated = {
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
        
        return validated;
        
    } catch (error) {
        throw new Error(`AI extraction failed: ${error.message}`);
    }
}

// Main Vercel serverless function handler
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { content, filename } = req.body;
        
        if (!content) {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF content provided',
                hint: 'Send base64-encoded PDF in "content" field'
            });
        }

        // Decode base64 to PDF buffer
        const pdfBuffer = Buffer.from(content, 'base64');
        
        if (pdfBuffer.length < 100) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid or corrupted PDF data'
            });
        }

        // Parse PDF to extract text
        let pdfData;
        try {
            pdfData = await pdf(pdfBuffer);
        } catch (pdfError) {
            return res.status(400).json({
                success: false,
                error: 'Failed to parse PDF. It may be corrupted or password-protected.',
                details: pdfError.message
            });
        }

        const extractedText = pdfData.text;
        
        if (!extractedText || extractedText.length < 20) {
            // Scanned PDF with no text
            return res.status(200).json({
                success: true,
                data: {
                    Name: "Scanned PDF Detected",
                    Category: "medical",
                    "Company Name": "Unknown",
                    "Sum Assured": "",
                    "Annual Limit": 0,
                    "Basic Price": 0,
                    "Standard Price": 0,
                    "Premium Price": 0,
                    "Key Features": "This appears to be a scanned/image PDF. Please enter data manually."
                },
                warning: 'PDF has no extractable text. It may be scanned.'
            });
        }

        // Extract data using AI
        const extractedData = await extractWithGemini(extractedText);

        return res.status(200).json({
            success: true,
            data: extractedData,
            metadata: {
                filename: filename || 'unknown.pdf',
                textLength: extractedText.length,
                pages: pdfData.numpages
            }
        });

    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Unknown server error',
            type: error.name
        });
    }
};