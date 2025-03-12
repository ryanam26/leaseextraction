import fetch from 'node-fetch';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    // Fetch the PDF from the provided URL
    const pdfResponse = await fetch(pdfUrl);
    const arrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Set your API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set' });
    }
    
    const anthropic = new Anthropic({ apiKey });
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: `Extract the following data points from this lease agreement and return them in the exact JSON format provided below. If you cannot find a specific piece of information, use null for that field. Do not make up or assume any values. Only include data that is explicitly stated in the document.

IMPORTANT: Return ONLY the raw JSON with no additional formatting, markdown, or explanations.

Required JSON format:
{
 "monthlyRent": 1500.00,
 "annualRent": 18000.00,
 "address": "7136 Jamacha Rd Unit#B, San Diego, California 92114",
 "tenantName": "Jose Figueroa",
 "ownerName": "Angel Alberto Contreras Chiroque",
 "isSigned": false,
 "leaseTerm": 1,
 "startDate": "2024-05-01",
 "endDate": null,
 "isMonthToMonth": true
}

The above is just an example with sample values. Please replace with actual values from the document.`,
            },
          ],
        },
      ],
    });
    
    // Extract the JSON from markdown formatting if present
    let responseText = '';
    if (response.content[0].type === 'text') {
      responseText = response.content[0].text;
    } else {
      console.error('Unexpected response format:', response.content[0]);
      return res.status(500).json({ error: 'Unexpected response format from AI service' });
    }
    
    // Remove markdown code block formatting if present
    responseText = responseText.replace(/```json\s*|\s*```/g, '');
    
    const extractedData = JSON.parse(responseText);
    
    res.json({ data: extractedData });
  } catch (error) {
    console.error('Error extracting PDF data:', error);
    res.status(500).json({ error: 'Failed to extract PDF data' });
  }
} 