'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResolveCasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caseData, setCaseData] = useState<{
    customer_name: string;
    customer_email: string;
    citation_number: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch case details
  useEffect(() => {
    async function fetchCase() {
      try {
        const response = await fetch(`/api/admin/cases/${caseId}`);
        if (!response.ok) throw new Error('Case not found');
        const data = await response.json();
        setCaseData({
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          citation_number: data.citation_number,
        });
      } catch (err) {
        setError('Case not found');
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);

      const response = await fetch('/api/admin/cases/resolve', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resolution Sent!</h1>
          <p className="text-gray-600 mb-6">
            The disposition has been uploaded and the client has been notified via email.
          </p>
          <button
            onClick={() => router.push('/admin/dashboard/cases')}
            className="w-full bg-black text-white py-3 px-6 rounded-xl font-semibold"
          >
            Back to Cases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Resolve Case</h1>
          {caseData && (
            <div className="text-sm text-gray-600">
              <p><strong>{caseData.customer_name}</strong></p>
              <p>Citation: {caseData.citation_number || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-yellow-500 transition-colors"
            >
              <div className="text-4xl mb-3">📄</div>
              <p className="text-lg font-semibold text-gray-700">Tap to Upload Disposition</p>
              <p className="text-sm text-gray-500 mt-1">Take a photo or select a file</p>
            </button>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-xl object-contain max-h-64"
                />
              ) : (
                <div className="bg-gray-100 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">📎</div>
                  <p className="text-sm text-gray-600 truncate">{file.name}</p>
                </div>
              )}

              {/* Change File */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-gray-600 py-2 text-sm underline"
              >
                Change file
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full mt-6 py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              file && !uploading
                ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                Sending...
              </span>
            ) : (
              'Upload & Send to Client'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            This will save the file and email it to the client automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
