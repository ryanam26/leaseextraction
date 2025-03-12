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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handlePdfUrlSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setPdfData(null);
    
    try {
      // Check if we're in test mode
      if (url === 'test') {
        // Skip PDF loading for test mode
        setPdfData('data:application/pdf;base64,TEST_MODE');
        
        // Call test endpoint
        const testResponse = await fetch('/api/test');
        if (!testResponse.ok) {
          throw new Error(`API test failed: ${testResponse.status} ${testResponse.statusText}`);
        }
        
        const testResult = await testResponse.json();
        console.log('API test result:', testResult);
        
        // Call extract with test parameter
        const extractResponse = await fetch('/api/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfUrl: 'test' }),
        });
        
        if (!extractResponse.ok) {
          const errorData = await extractResponse.json();
          throw new Error(`Test extraction failed: ${errorData.error || extractResponse.statusText}`);
        }
        
        const extractResult = await extractResponse.json();
        setExtractedData(extractResult.data);
        return;
      }
      
      // First, get the PDF data for viewing
      const proxyResponse = await fetch('/api/proxy-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl: url }),
      });
      
      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to load PDF for viewing: ${proxyResponse.status} ${proxyResponse.statusText}`;
        setErrorDetails(errorData.details || errorData.stack || null);
        throw new Error(errorMessage);
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
        const errorData = await extractResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to extract data from PDF: ${extractResponse.status} ${extractResponse.statusText}`;
        setErrorDetails(errorData.details || errorData.stack || null);
        throw new Error(errorMessage);
      }
      
      const extractResult = await extractResponse.json();
      setExtractedData(extractResult.data);
    } catch (err: any) {
      console.error('Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // If we haven't already set error details from the response
      if (!errorDetails && typeof err === 'object' && err !== null) {
        // Try to extract any additional properties that might contain details
        const details = Object.entries(err)
          .filter(([key]) => key !== 'message' && key !== 'stack')
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('\n');
        
        if (details) {
          setErrorDetails(details);
        }
      }
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
            {errorDetails && (
              <details>
                <summary>Error Details</summary>
                <pre>{errorDetails}</pre>
              </details>
            )}
            <p className="error-help">
              Try using the "test" keyword instead of a URL to test the API functionality.
            </p>
          </div>
        )}
        
        <div className="content-container">
          {pdfData && (
            <div className="pdf-container">
              {pdfData === 'data:application/pdf;base64,TEST_MODE' ? (
                <div className="test-mode-message">
                  <h3>Test Mode</h3>
                  <p>Running in test mode - PDF viewer disabled</p>
                </div>
              ) : (
                <PDFViewer pdfUrl={pdfData} />
              )}
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