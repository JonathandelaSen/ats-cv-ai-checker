"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure worker using local path instead of unpkg to avoid CORS/network issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewProps {
  url: string;
}

export function PDFPreview({ url }: PDFPreviewProps) {
  const [scale, setScale] = useState(0.85);
  
  // Keep track of the current and previous URL to overlap them during loading
  const [urls, setUrls] = useState<string[]>([url]);
  const [numPagesMap, setNumPagesMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setUrls((prev) => {
      if (prev[prev.length - 1] === url) return prev;
      return [...prev.slice(-1), url];
    });
  }, [url]);

  function handleLoadSuccess(loadedUrl: string, numPages: number) {
    setNumPagesMap((prev) => ({ ...prev, [loadedUrl]: numPages }));
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Zoom Toolbar */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full bg-[#1a1a24]/80 backdrop-blur-md border border-white/10 p-1.5 shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs font-medium text-zinc-300">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          onClick={() => setScale((s) => Math.min(2, s + 0.1))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-auto bg-[#050509] scrollbar-thin pb-20">
        <div className="grid min-h-full items-start justify-center p-8">
          {urls.map((u, i) => {
            const isLatest = i === urls.length - 1;
            const isOld = !isLatest;
            const pagesToRender = numPagesMap[u] || 1;

            return (
              <div 
                key={u} 
                className="col-start-1 row-start-1 transition-opacity duration-300"
                style={{ 
                  zIndex: isLatest ? 10 : 1,
                  opacity: isOld ? 0.4 : 1,
                  filter: isOld ? "grayscale(100%) blur(2px)" : "none"
                }}
              >
                <Document
                  file={u}
                  onLoadSuccess={({ numPages }) => handleLoadSuccess(u, numPages)}
                  loading={
                    urls.length === 1 ? (
                      <div className="flex items-center justify-center p-12 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : null // If there is an old document, don't show loading spinner, let the old one be visible
                  }
                  className="flex flex-col items-center gap-4"
                >
                  {Array.from(new Array(pagesToRender), (el, index) => (
                    <div 
                      key={`page_${index + 1}`} 
                      className="shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5 bg-white overflow-hidden relative"
                    >
                      <Page
                        pageNumber={index + 1}
                        scale={scale}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={
                          urls.length === 1 ? (
                            <div className="flex items-center justify-center p-12 text-zinc-500" style={{ width: 595 * scale, height: 842 * scale }}>
                              <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                          ) : null
                        }
                      />
                    </div>
                  ))}
                </Document>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
