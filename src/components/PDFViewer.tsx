import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PDFViewer.css';

// Set up the worker for PDF.js with more options for better rendering
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Configure PDF.js for better rendering
const options = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/'
};

interface PDFViewerProps {
  pdfUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  // Update container width on resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 40); // Subtract padding
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    // Reset to first page when loading a new document
    setPageNumber(1);
    // Reset scale and rotation
    setScale(1.0);
    setRotation(0);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please check the URL and try again.');
    setLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return numPages ? Math.min(Math.max(1, newPageNumber), numPages) : 1;
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);
  
  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);
  
  const rotateClockwise = () => setRotation(prevRotation => (prevRotation + 90) % 360);
  const rotateCounterClockwise = () => setRotation(prevRotation => (prevRotation - 90 + 360) % 360);

  return (
    <div className="pdf-viewer">
      <div className="pdf-document-container" ref={containerRef}>
        {loading && <div className="pdf-loading">Loading PDF...</div>}
        
        {error && <div className="pdf-error">{error}</div>}
        
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="pdf-loading">Loading PDF...</div>}
          options={options}
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            scale={scale}
            rotate={rotation}
            width={containerWidth}
            canvasBackground="#ffffff"
            renderMode="canvas"
          />
        </Document>
      </div>
      
      {numPages && (
        <>
          <div className="pdf-zoom-controls">
            <button 
              onClick={zoomOut} 
              disabled={scale <= 0.5}
              className="pdf-control-button"
              title="Zoom Out"
            >
              -
            </button>
            
            <span className="pdf-zoom-info">
              {Math.round(scale * 100)}%
            </span>
            
            <button 
              onClick={zoomIn} 
              disabled={scale >= 3.0}
              className="pdf-control-button"
              title="Zoom In"
            >
              +
            </button>
            
            <button 
              onClick={resetZoom} 
              className="pdf-control-button"
              title="Reset Zoom"
            >
              Reset
            </button>
            
            <button 
              onClick={rotateCounterClockwise} 
              className="pdf-control-button"
              title="Rotate Left"
            >
              ↺
            </button>
            
            <button 
              onClick={rotateClockwise} 
              className="pdf-control-button"
              title="Rotate Right"
            >
              ↻
            </button>
          </div>
          
          <div className="pdf-controls">
            <button 
              onClick={previousPage} 
              disabled={pageNumber <= 1}
              className="pdf-control-button"
            >
              Previous
            </button>
            
            <span className="pdf-page-info">
              Page {pageNumber} of {numPages}
            </span>
            
            <button 
              onClick={nextPage} 
              disabled={pageNumber >= numPages}
              className="pdf-control-button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFViewer; 