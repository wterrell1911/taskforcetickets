'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  description: string;
  accept?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
}

export function FileUpload({
  label,
  description,
  accept = 'image/*,.pdf',
  value,
  onChange,
  required,
  error,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      onChange(file);
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-[#1A1A1A]">
        {label}
        {required && <span className="text-[#CF2A27] ml-1">*</span>}
      </label>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer',
          isDragging && 'border-[#FFD100] bg-[#FFD100]/5',
          error && 'border-[#CF2A27] bg-[#CF2A27]/5',
          !isDragging && !error && 'border-[#E5E5E5] hover:border-[#1A1A1A]/30'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {value ? (
          <div className="flex items-center gap-5">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-[#E5E5E5]"
              />
            ) : (
              <div className="w-20 h-20 bg-[#F8F8F8] rounded-lg flex items-center justify-center border border-[#E5E5E5]">
                <svg className="w-8 h-8 text-[#4A4A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-[#1A1A1A]">{value.name}</p>
              <p className="text-sm text-[#4A4A4A]">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFile(null);
                }}
                className="text-sm text-[#CF2A27] hover:underline font-medium mt-1"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-[#4A4A4A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-sm text-[#4A4A4A]">{description}</p>
            <p className="mt-1 text-xs text-[#4A4A4A]/60">
              Drag and drop or click to upload
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-[#CF2A27]">{error}</p>}
    </div>
  );
}
