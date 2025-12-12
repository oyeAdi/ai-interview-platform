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
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} or upload file`}
        disabled={disabled}
        className="w-full bg-dark-black border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[150px] transition-all"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive
            ? 'border-primary-orange bg-primary-orange/10 scale-105'
            : 'border-gray-700 hover:border-primary-orange/50 hover:bg-gray-800/50'
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
          className={`cursor-pointer ${disabled ? 'pointer-events-none' : ''}`}
        >
          {file ? (
            <span className="text-primary-orange">{file.name}</span>
          ) : (
            <span className="text-gray-400">
              Drag and drop a file here, or click to select
            </span>
          )}
        </label>
        {file && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFileChange(null)
            }}
            className="ml-2 text-red-400 hover:text-red-300"
            disabled={disabled}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

