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
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} text here...`}
        disabled={disabled}
        className="w-full bg-gray-50 border border-gray-100 p-6 
                   text-gray-900 placeholder-gray-400
                   focus:outline-none focus:border-brand-primary/30 focus:bg-white
                   disabled:opacity-50 disabled:cursor-not-allowed 
                   min-h-[180px] transition-all duration-300 resize-none rounded-2xl font-medium"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-8 text-center transition-all duration-300 rounded-2xl ${dragActive
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-gray-100 bg-gray-50/50 hover:border-brand-primary/30 hover:bg-white'
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
          className={`cursor-pointer flex flex-col items-center gap-3 ${disabled ? 'pointer-events-none' : ''}`}
        >
          {file ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
              <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-brand-primary text-sm font-bold">{file.name}</span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFileChange(null)
                }}
                className="text-brand-primary/40 hover:text-red-500 transition-colors"
                disabled={disabled}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <span className="text-sm text-gray-600 font-bold">
                Drop file here or click to upload
              </span>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                PDF, DOCX, or TXT
              </span>
            </>
          )}
        </label>
      </div>
    </div>
  )
}
