'use client'

import { useState } from 'react'

interface FileUploadProps {
  label: string
  text: string
  onTextChange: (text: string) => void
  file: File | null
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

export default function FileUpload({
  label,
  text,
  onTextChange,
  file,
  onFileChange,
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0])
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} text here...`}
        disabled={disabled}
        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] p-4 
                   text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600
                   focus:outline-none focus:border-brand-primary 
                   disabled:opacity-50 disabled:cursor-not-allowed 
                   min-h-[150px] transition-colors duration-200 resize-none"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border border-dashed p-6 text-center transition-all duration-200 ${
          dragActive
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-gray-300 dark:border-[#3A3A3A] hover:border-brand-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          id={`file-${label}`}
          accept=".pdf,.docx,.txt"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        <label
          htmlFor={`file-${label}`}
          className={`cursor-pointer flex flex-col items-center gap-2 ${disabled ? 'pointer-events-none' : ''}`}
        >
          {file ? (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-brand-primary text-sm">{file.name}</span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFileChange(null)
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                disabled={disabled}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Drop file here or click to upload
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                PDF, DOCX, or TXT
              </span>
            </>
          )}
        </label>
      </div>
    </div>
  )
}
