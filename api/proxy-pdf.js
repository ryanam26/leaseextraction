import fetch from 'node-fetch';

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
    console.log('Proxy PDF API called with body:', JSON.stringify(req.body));
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      console.log('No PDF URL provided');
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    console.log('Fetching PDF from URL:', pdfUrl);
    // Fetch the PDF from the provided URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const pdfResponse = await fetch(pdfUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);
      
      if (!pdfResponse.ok) {
        console.log('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText);
        return res.status(pdfResponse.status).json({ 
          error: `Failed to fetch PDF: ${pdfResponse.statusText}` 
        });
      }
      
      console.log('PDF fetched successfully, converting to base64');
      const arrayBuffer = await pdfResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Check if the file is too large
      if (buffer.length > 5 * 1024 * 1024) { // 5MB limit
        console.log('PDF file too large:', buffer.length, 'bytes');
        return res.status(413).json({ error: 'PDF file too large (max 5MB)' });
      }
      
      // Return the PDF data as base64
      const base64Data = `data:application/pdf;base64,${buffer.toString('base64')}`;
      console.log('Sending base64 data, length:', base64Data.length);
      res.json({ 
        pdfData: base64Data
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.log('Fetch request timed out');
        return res.status(504).json({ error: 'Request timed out while fetching PDF' });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error proxying PDF:', error);
    res.status(500).json({ 
      error: 'Failed to proxy PDF',
      details: error.message,
      stack: error.stack
    });
  }
} 