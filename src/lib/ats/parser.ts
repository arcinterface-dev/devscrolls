import type { ExtractedResumeData } from './types';

declare global {
  interface Window {
    mammoth?: {
      extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: any[] }>;
    };
  }
}

let mammothLoadingPromise: Promise<void> | null = null;

async function ensureMammothLoaded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.mammoth) return;
  if (mammothLoadingPromise) return mammothLoadingPromise;

  mammothLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/mammoth.browser.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Word document (.docx) parsing library.'));
    document.head.appendChild(script);
  });

  return mammothLoadingPromise;
}

export async function parseResumeFile(file: File): Promise<ExtractedResumeData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension !== 'pdf' && extension !== 'docx') {
    throw new Error('Unsupported file format. Please upload a PDF (.pdf) or Microsoft Word (.docx) document.');
  }

  // 10MB client-side limit
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds the 10MB limit. Please upload an optimized PDF or DOCX file.');
  }

  if (file.size === 0) {
    throw new Error('The uploaded file is empty (0 bytes). Please upload a valid resume.');
  }

  const arrayBuffer = await file.arrayBuffer();

  if (extension === 'pdf') {
    return parsePdf(arrayBuffer, file.name, file.size);
  } else {
    return parseDocx(arrayBuffer, file.name, file.size);
  }
}

async function parsePdf(buffer: ArrayBuffer, fileName: string, fileSize: number): Promise<ExtractedResumeData> {
  // Dynamically import pdfjs-dist only when a PDF is parsed
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Sort items by vertical position (Y descending), then horizontal (X ascending)
      const items = (textContent.items as any[])
        .filter((item) => item.str && item.str.trim().length > 0)
        .map((item) => ({
          str: item.str,
          x: item.transform ? item.transform[4] : 0,
          y: item.transform ? item.transform[5] : 0,
          hasEOL: item.hasEOL,
        }));

      // Group into lines based on approximate Y coordinate (within 4px threshold)
      const lineMap: { [yKey: number]: { x: number; str: string }[] } = {};
      for (const item of items) {
        const roundedY = Math.round(item.y / 4) * 4;
        if (!lineMap[roundedY]) {
          lineMap[roundedY] = [];
        }
        lineMap[roundedY].push({ x: item.x, str: item.str });
      }

      // Sort lines by Y descending (top of page to bottom)
      const sortedY = Object.keys(lineMap)
        .map(Number)
        .sort((a, b) => b - a);

      const pageLines: string[] = [];
      for (const y of sortedY) {
        // Sort items inside line by X ascending (left to right)
        const lineItems = lineMap[y].sort((a, b) => a.x - b.x);
        const lineStr = lineItems.map((i) => i.str).join(' ').trim();
        if (lineStr) {
          pageLines.push(lineStr);
        }
      }

      // Extract hyperlink annotations (e.g. clickable LinkedIn/GitHub links in text)
      try {
        const annotations = await page.getAnnotations();
        const urls: string[] = [];
        for (const annot of annotations) {
          if (annot?.url && typeof annot.url === 'string') {
            urls.push(annot.url);
          }
        }
        if (urls.length > 0) {
          pageLines.push(urls.join(' '));
        }
      } catch {
        // Annotation parsing failure is non-fatal
      }

      pageTexts.push(pageLines.join('\n'));
    }

    const fullText = pageTexts.join('\n\n').trim();
    const words = fullText.split(/\s+/).filter(Boolean);

    // Check for scanned / image-only PDFs
    if (words.length < 30) {
      throw new Error(
        'This PDF appears to be a scanned image or lacks a selectable text layer. ' +
        'Real ATS parsers (Workday, Greenhouse) cannot parse image-only resumes. ' +
        'Please re-export your resume from Google Docs, Word, Canva, or Figma with "Selectable Text" enabled.'
      );
    }

    const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

    return {
      text: fullText,
      pageCount: numPages,
      wordCount: words.length,
      characterCount: fullText.length,
      lines,
      fileName,
      fileSize,
      fileType: 'pdf',
    };
  } catch (err: any) {
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Please upload an unprotected copy so ATS parsers can read it.');
    }
    throw err;
  }
}

async function parseDocx(buffer: ArrayBuffer, fileName: string, fileSize: number): Promise<ExtractedResumeData> {
  await ensureMammothLoaded();

  if (!window.mammoth) {
    throw new Error('Mammoth DOCX parser failed to initialize. Please try saving as a PDF and upload again.');
  }

  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  const rawText = result.value.trim();
  const words = rawText.split(/\s+/).filter(Boolean);

  if (words.length < 30) {
    throw new Error(
      'This DOCX document contains less than 30 words. Please ensure your resume file contains readable text.'
    );
  }

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Estimate page count for DOCX (standard ~450 words per single-spaced page)
  const estimatedPages = Math.max(1, Math.round(words.length / 450));

  return {
    text: rawText,
    pageCount: estimatedPages,
    wordCount: words.length,
    characterCount: rawText.length,
    lines,
    fileName,
    fileSize,
    fileType: 'docx',
  };
}
