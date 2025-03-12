import fetch from 'node-fetch';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Extract API called with body:', JSON.stringify(req.body));
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      console.log('No PDF URL provided');
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    // Check if we're in a test mode
    if (pdfUrl === 'test') {
      return res.json({ 
        data: {
          monthlyRent: 1500.00,
          annualRent: 18000.00,
          address: "123 Test St, Test City, CA",
          tenantName: "Test Tenant",
          ownerName: "Test Owner",
          isSigned: true,
          leaseTerm: 12,
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          isMonthToMonth: false
        }
      });
    }

    console.log('Fetching PDF from URL:', pdfUrl);
    // Fetch the PDF from the provided URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let pdfResponse;
    try {
      pdfResponse = await fetch(pdfUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Error fetching PDF:', fetchError);
      return res.status(500).json({ 
        error: 'Failed to fetch PDF', 
        details: fetchError.message 
      });
    }
    
    if (!pdfResponse.ok) {
      console.log('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText);
      return res.status(pdfResponse.status).json({ 
        error: `Failed to fetch PDF: ${pdfResponse.statusText}` 
      });
    }
    
    console.log('PDF fetched successfully, converting to base64');
    let arrayBuffer;
    try {
      arrayBuffer = await pdfResponse.arrayBuffer();
    } catch (bufferError) {
      console.error('Error converting response to array buffer:', bufferError);
      return res.status(500).json({ 
        error: 'Failed to process PDF data', 
        details: bufferError.message 
      });
    }
    
    const buffer = Buffer.from(arrayBuffer);
    const pdfBase64 = buffer.toString('base64');
    console.log('PDF converted to base64, length:', pdfBase64.length);
    
    // Check if the file is too large for Anthropic
    if (pdfBase64.length > 10 * 1024 * 1024) { // 10MB limit
      console.log('PDF file too large for Anthropic API:', pdfBase64.length, 'bytes');
      return res.status(413).json({ error: 'PDF file too large for processing (max 10MB)' });
    }
    
    // Set your API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('ANTHROPIC_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set' });
    }
    
    console.log('Creating Anthropic client');
    let anthropic;
    try {
      anthropic = new Anthropic({ apiKey });
    } catch (clientError) {
      console.error('Error creating Anthropic client:', clientError);
      return res.status(500).json({ 
        error: 'Failed to initialize AI service', 
        details: clientError.message 
      });
    }
    
    console.log('Sending request to Anthropic API');
    let response;
    try {
      response = await anthropic.messages.create({
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
    } catch (apiError) {
      console.error('Error calling Anthropic API:', apiError);
      return res.status(500).json({ 
        error: 'AI service error', 
        details: apiError.message,
        type: apiError.type || 'unknown'
      });
    }
    
    console.log('Received response from Anthropic API');
    
    // Extract the JSON from markdown formatting if present
    let responseText = '';
    if (response.content && response.content[0] && response.content[0].type === 'text') {
      responseText = response.content[0].text;
      console.log('Response text:', responseText);
    } else {
      console.error('Unexpected response format:', JSON.stringify(response.content));
      return res.status(500).json({ error: 'Unexpected response format from AI service' });
    }
    
    // Remove markdown code block formatting if present
    responseText = responseText.replace(/```json\s*|\s*```/g, '');
    
    try {
      const extractedData = JSON.parse(responseText);
      console.log('Extracted data:', JSON.stringify(extractedData));
      res.json({ data: extractedData });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse AI response', 
        details: parseError.message,
        rawResponse: responseText
      });
    }
  } catch (error) {
    console.error('Error extracting PDF data:', error);
    res.status(500).json({ 
      error: 'Failed to extract PDF data',
      details: error.message,
      stack: error.stack
    });
  }
} 