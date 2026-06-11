import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useFileUpload } from '../../hooks';
import { useProjectStore } from '../../store/projectStore';
import VersionStageSelect from './VersionStageSelect';
import UploadProgress from './UploadProgress';

export default function DragDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [versionStage, setVersionStage] = useState('raw');
  const fileInputRef = useRef(null);
  const { mutate: uploadFiles, isPending } = useFileUpload();
  const addNotification = useProjectStore((s) => s.addNotification);

  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
  const MAX_FILES = 10;
  const ALLOWED_TYPES = ['image', 'video', 'audio', 'model', 'application/zip'];

  const isAllowedFile = (file) => {
    const topLevel = file.type.split('/')[0];
    return ALLOWED_TYPES.includes(topLevel) || file.type.includes('zip');
  };

  const validateFiles = (fileList) => {
    const validated = [];
    const errors = [];

    Array.from(fileList).forEach((file) => {
      if (!isAllowedFile(file)) {
        errors.push(`${file.name} - unsupported file type`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} - exceeds 1GB limit`);
        return;
      }
      validated.push(file);
    });

    if (validated.length + files.length > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} files per upload`);
    }

    if (errors.length > 0) {
      errors.forEach((error) => {
        addNotification({
          type: 'error',
          message: error,
          duration: 4000,
        });
      });
    }

    return validated.slice(0, MAX_FILES - files.length);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const fileList = e.dataTransfer.files;
    const validated = validateFiles(fileList);
    setFiles((prev) => [...prev, ...validated]);
  };

  const handleFileSelect = (e) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const validated = validateFiles(fileList);
    setFiles((prev) => [...prev, ...validated]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    
    uploadFiles(
      { files, versionStage },
      {
        onSuccess: () => {
          setFiles([]);
          setVersionStage('raw');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Drag drop area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Drag and drop files here
          </p>
          <p className="text-xs text-gray-500">
            or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              click to select
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Max 10 files, 1GB each. Supports image, video, audio, model, zip
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,.mp4,.mp3,.wav,.gltf,.glb,.zip"
        />
      </div>

      {/* Selected files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Selected Files ({files.length}/{MAX_FILES})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, idx) => (
              <UploadProgress key={idx} file={file} onRemove={() => removeFile(idx)} />
            ))}
          </div>
        </div>
      )}

      {/* Version stage selector */}
      {files.length > 0 && (
        <VersionStageSelect value={versionStage} onChange={setVersionStage} />
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isPending ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
