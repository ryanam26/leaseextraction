import { useState } from 'react';
import './App.css';
import PDFViewer from './components/PDFViewer';
import PDFUploader from './components/PDFUploader';
import ExtractedData from './components/ExtractedData';
import { LeaseData } from './types';

function App() {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<LeaseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePdfUrlSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setPdfData(null);
    
    try {
      // First, get the PDF data for viewing
      const proxyResponse = await fetch('/api/proxy-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl: url }),
      });
      
      if (!proxyResponse.ok) {
        throw new Error('Failed to load PDF for viewing');
      }
      
      const proxyResult = await proxyResponse.json();
      setPdfData(proxyResult.pdfData);
      
      // Then, extract data from the PDF
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl: url }),
      });
      
      if (!extractResponse.ok) {
        throw new Error('Failed to extract data from PDF');
      }
      
      const extractResult = await extractResponse.json();
      setExtractedData(extractResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error processing PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>📄 Extracted Lease Information</h1>
      </header>
      
      <main>
        <PDFUploader onSubmit={handlePdfUrlSubmit} isLoading={isLoading} />
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div className="content-container">
          {pdfData && (
            <div className="pdf-container">
              <PDFViewer pdfUrl={pdfData} />
            </div>
          )}
          
          {extractedData && (
            <div className="data-container">
              <ExtractedData data={extractedData} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 