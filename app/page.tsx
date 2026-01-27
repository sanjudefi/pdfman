'use client';

import { useState, useCallback } from 'react';
import PDFViewer from '@/components/PDFViewer';
import ChatPanel from '@/components/ChatPanel';

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    setUploading(true);

    try {
      // Upload to Vercel Blob
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const data = await uploadRes.json();
      setDocumentId(data.documentId);
      setCurrentVersion(data.versionNum);
      setPdfUrl(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleApply = async (message: string) => {
    if (!documentId) return;

    const response = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        currentVersion,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to apply changes');
    }

    const data = await response.json();
    setCurrentVersion(data.versionNum);
    setPdfUrl(data.url);
  };

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 shadow-md">
        <h1 className="text-2xl font-bold">PDF Editor</h1>
        <p className="text-sm text-blue-100">AI-powered PDF editing with Claude</p>
      </header>

      {/* Upload overlay */}
      {!documentId && (
        <div
          className="flex-1 flex items-center justify-center bg-gray-50"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div
              className={`border-4 border-dashed rounded-lg p-12 transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {uploading ? 'Uploading...' : 'Drop your PDF here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label className="cursor-pointer">
                <span className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block">
                  Choose File
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main content - split view */}
      {documentId && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: PDF Viewer */}
          <div className="w-1/2 border-r">
            <PDFViewer pdfUrl={pdfUrl} />
          </div>

          {/* Right: Chat Panel */}
          <div className="w-1/2">
            <ChatPanel
              documentId={documentId}
              currentVersion={currentVersion}
              onApply={handleApply}
              onDownload={handleDownload}
              disabled={uploading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
