const pdf = require('pdf-parse');

// Extract insurance data using Gemini AI
async function extractWithGemini(base64Content) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return null;

    try {
        const pdfBuffer = Buffer.from(base64Content, 'base64');
        const pdfData = await pdf(pdfBuffer);
        const text = pdfData.text;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an insurance data extraction expert. Extract the following details from the insurance brochure text and return ONLY valid JSON.
                        
                        Fields to extract:
                        - Name (Product Name)
                        - Category (Choose one: medical, life, funeral, health, property, liability, workers_compensation)
                        - Company Name
                        - Sum Assured (Coverage amount)
                        - Annual Limit (Number only)
                        - Waiting Period Natural (e.g., "6 months")
                        - Waiting Period Accidental (e.g., "None")
                        - Co Payment (Details about what the user pays)
                        - Hospital Network (List of hospitals or "All")
                        - Key Features (Summary of main benefits)
                        - Basic Price (Monthly premium for lowest tier - number only)
                        - Standard Price (Monthly premium for middle tier - number only)
                        - Premium Price (Monthly premium for top tier - number only)
                        - Price Notes (e.g., "Per person", "Family of 4")
                        - Plan Tiers (Description of the different plans available)

                        If a field is not found, leave it as an empty string.
                        
                        Brochure Text:
                        ${text.substring(0, 15000)}`
                    }]
                }]
            })
        });

        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Gemini Error:', error);
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { content, filename } = req.body;
        const extractedData = await extractWithGemini(content);

        if (!extractedData) {
            return res.status(400).json({ error: 'Extraction failed' });
        }

        res.status(200).json({
            success: true,
            data: extractedData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}