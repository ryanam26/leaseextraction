declare module 'react-pdf' {
  import { ComponentType, ReactElement } from 'react';
  
  export interface DocumentProps {
    file: string | { url: string } | { data: Uint8Array } | { range: Uint8Array };
    onLoadSuccess?: (pdf: any) => void;
    onLoadError?: (error: Error) => void;
    loading?: ReactElement;
    noData?: ReactElement;
    options?: any;
    children?: React.ReactNode;
  }
  
  export interface PageProps {
    pageNumber: number;
    width?: number;
    height?: number;
    scale?: number;
    rotate?: number;
    canvasBackground?: string;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
    renderMode?: string;
    onLoadSuccess?: (page: any) => void;
    onLoadError?: (error: Error) => void;
    loading?: ReactElement;
    noData?: ReactElement;
    className?: string;
  }
  
  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  export const pdfjs: any;
} 