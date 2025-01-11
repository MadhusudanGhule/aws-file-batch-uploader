import React, { useState, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'paused';
  error?: string;
  sessionId?: string;
  completedChunks: Set<number>;
  retryCount: number;
}

interface UploadSession {
  sessionId: string;
  completedChunks: number[];
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_FILES = 20000;
const MAX_PARALLEL_UPLOADS = 3;
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export function FileUploader() {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
      completedChunks: new Set<number>(),
      retryCount: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, [files]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const initializeUploadSession = async (file: File): Promise<UploadSession> => {
    try {
      const response = await fetch('YOUR_BACKEND_URL/init-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
        }),
      });

      if (!response.ok) throw new Error('Failed to initialize upload session');
      
      return await response.json();
    } catch (error) {
      console.error('Failed to initialize upload session:', error);
      throw error;
    }
  };

  const uploadChunkWithRetry = async (
    file: File,
    chunk: Blob,
    chunkIndex: number,
    sessionId: string,
    retryCount: number = 0
  ): Promise<boolean> => {
    try {
      const response = await fetch('YOUR_BACKEND_URL/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          chunkIndex,
          sessionId,
        }),
      });

      const { presignedUrl } = await response.json();

      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: chunk,
      });

      if (!uploadResponse.ok) throw new Error('Chunk upload failed');

      // Notify backend of successful chunk upload
      await fetch('YOUR_BACKEND_URL/chunk-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chunkIndex,
        }),
      });

      return true;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadChunkWithRetry(file, chunk, chunkIndex, sessionId, retryCount + 1);
      }
      console.error('Chunk upload failed after retries:', error);
      return false;
    }
  };

  const uploadFile = async (fileStatus: FileStatus) => {
    const { file } = fileStatus;
    const chunks: Blob[] = [];
    
    // Split file into chunks
    for (let i = 0; i < file.size; i += CHUNK_SIZE) {
      chunks.push(file.slice(i, i + CHUNK_SIZE));
    }

    try {
      // Initialize or resume session
      const session = fileStatus.sessionId
        ? { sessionId: fileStatus.sessionId, completedChunks: Array.from(fileStatus.completedChunks) }
        : await initializeUploadSession(file);

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                status: 'uploading',
                sessionId: session.sessionId,
                completedChunks: new Set(session.completedChunks),
              }
            : f
        )
      );

      let uploadedChunks = fileStatus.completedChunks.size;
      const totalChunks = chunks.length;

      // Upload remaining chunks in parallel with limit
      for (let i = 0; i < chunks.length; i += MAX_PARALLEL_UPLOADS) {
        const chunkPromises = chunks
          .slice(i, i + MAX_PARALLEL_UPLOADS)
          .map(async (chunk, index) => {
            const chunkIndex = i + index;
            if (fileStatus.completedChunks.has(chunkIndex)) return true;
            return uploadChunkWithRetry(file, chunk, chunkIndex, session.sessionId);
          });

        const results = await Promise.all(chunkPromises);
        uploadedChunks += results.filter(Boolean).length;

        const progress = Math.round((uploadedChunks / totalChunks) * 100);

        setFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? {
                  ...f,
                  progress,
                  completedChunks: new Set([...f.completedChunks, ...results
                    .map((success, idx) => success ? i + idx : -1)
                    .filter(idx => idx !== -1)
                  ]),
                }
              : f
          )
        );
      }

      // Verify upload completion with backend
      const verifyResponse = await fetch('YOUR_BACKEND_URL/verify-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
        }),
      });

      if (!verifyResponse.ok) throw new Error('Upload verification failed');

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'completed', progress: 100 }
            : f
        )
      );
    } catch (error) {
      console.error('Upload failed:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );
    }
  };

  const pauseUpload = (fileToUpdate: File) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.file === fileToUpdate
          ? { ...f, status: 'paused' }
          : f
      )
    );
  };

  const resumeUpload = (fileToUpdate: File) => {
    const fileStatus = files.find(f => f.file === fileToUpdate);
    if (fileStatus) {
      uploadFile(fileStatus);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter(({ file }) => file !== fileToRemove));
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter(f => 
      f.status === 'pending' || f.status === 'error' || f.status === 'paused'
    );

    for (let i = 0; i < pendingFiles.length; i += MAX_PARALLEL_UPLOADS) {
      const batch = pendingFiles.slice(i, i + MAX_PARALLEL_UPLOADS);
      await Promise.all(batch.map(uploadFile));
    }
    setIsUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Up to {MAX_FILES.toLocaleString()} files supported
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          {files.map(({ file, progress, status, error }) => (
            <div
              key={file.name}
              className="bg-white rounded-lg shadow p-4 flex items-center"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <div className="ml-2 flex space-x-2">
                    {status === 'uploading' && (
                      <button
                        onClick={() => pauseUpload(file)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Pause</span>
                        ||
                      </button>
                    )}
                    {(status === 'paused' || status === 'error') && (
                      <button
                        onClick={() => resumeUpload(file)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(file)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`rounded-full h-2 transition-all ${
                        status === 'error'
                          ? 'bg-red-500'
                          : status === 'completed'
                          ? 'bg-green-500'
                          : status === 'paused'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
              </div>

              <div className="ml-4">
                {status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                {status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {(status === 'pending' || status === 'uploading') && (
                  <span className="text-sm text-gray-500">{progress}%</span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={uploadAllFiles}
            disabled={isUploading}
            className={`mt-4 w-full rounded-lg px-4 py-2 transition-colors ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload All Files'}
          </button>
        </div>
      )}
    </div>
  );
}