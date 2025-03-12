import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
} 