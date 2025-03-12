import { useState, FormEvent } from 'react';
import './PDFUploader.css';

interface PDFUploaderProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onSubmit, isLoading }) => {
  const [pdfUrl, setPdfUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pdfUrl.trim()) {
      onSubmit(pdfUrl.trim());
    }
  };

  return (
    <div className="pdf-uploader">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="pdf-url">Enter PDF URL:</label>
          <input
            type="url"
            id="pdf-url"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="https://example.com/document.pdf"
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading || !pdfUrl.trim()}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            'Extract Data'
          )}
        </button>
      </form>
    </div>
  );
};

export default PDFUploader; 