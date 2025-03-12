import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Proxy endpoint for PDF files
app.post('/api/proxy-pdf', async (req, res) => {
  console.log('Received proxy-pdf request:', req.body);
  try {
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      console.log('No PDF URL provided');
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    console.log('Fetching PDF from URL:', pdfUrl);
    // Fetch the PDF from the provided URL
    const pdfResponse = await fetch(pdfUrl);
    
    if (!pdfResponse.ok) {
      console.log('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText);
      return res.status(pdfResponse.status).json({ 
        error: `Failed to fetch PDF: ${pdfResponse.statusText}` 
      });
    }
    
    console.log('PDF fetched successfully, converting to base64');
    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Return the PDF data as base64
    const base64Data = `data:application/pdf;base64,${buffer.toString('base64')}`;
    console.log('Sending base64 data (truncated):', base64Data.substring(0, 100) + '...');
    res.json({ 
      pdfData: base64Data
    });
  } catch (error) {
    console.error('Error proxying PDF:', error);
    res.status(500).json({ error: 'Failed to proxy PDF' });
  }
});

// Extract PDF data endpoint
app.post('/api/extract', async (req, res) => {
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
    const apiKey = process.env.ANTHROPIC_API_KEY || "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";
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
    // Handle different response formats
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
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// For Vercel serverless deployment
export default app; 