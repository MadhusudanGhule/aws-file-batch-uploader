import React from 'react';
import { FileCheck, AlertCircle, Clock } from 'lucide-react';

interface BatchOverviewProps {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
}

export function BatchOverview({
  totalFiles,
  completedFiles,
  failedFiles,
  totalSize,
  uploadedSize,
}: BatchOverviewProps) {
  const remainingFiles = totalFiles - completedFiles - failedFiles;
  const progress = (uploadedSize / totalSize) * 100;

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FileCheck className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-700">{completedFiles}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-red-600 font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-700">{failedFiles}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Remaining</p>
              <p className="text-2xl font-bold text-blue-700">{remainingFiles}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Total Progress</span>
          <span className="text-gray-600">{formatSize(uploadedSize)} / {formatSize(totalSize)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}