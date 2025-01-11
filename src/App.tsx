import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { BatchOverview } from './components/BatchOverview';
import { Upload, ArrowRight } from 'lucide-react';
import { AWSCredentials } from './components/AWSCredentials';

function App() {
  const [uploadStats, setUploadStats] = React.useState({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    uploadedSize: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleUploadProgress = (stats: typeof uploadStats) => {
    setUploadStats(stats);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Upload className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              Uploader
            </h1>
            <button
              onClick={openModal}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Upload AWS Credentials
            </button>
          </div>
        </div>
      </header>


      {/* //carete dware for AWSCredentials */}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!uploadStats.totalFiles ? (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Upload Large File Batches with Ease
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Handle up to 20,000 files simultaneously with our advanced chunked upload system.
              Pause, resume, and track progress with real-time updates.
            </p>
          </div>
        ) : null}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-96 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload AWS Credentials</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                close ✕
              </button>

              <AWSCredentials />
            </div>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className={`space-y-6 ${uploadStats.totalFiles ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="p-6">

                <FileUploader onProgress={handleUploadProgress} />
              </div>
            </div>
          </div>

          {uploadStats.totalFiles > 0 && (
            <div className="lg:col-span-2 space-y-6">

              <BatchOverview {...uploadStats} />

              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                <ul className="space-y-3">
                  {[
                    'Resumable uploads',
                    'Real-time progress tracking',
                    'Automatic retry on failure',
                    'Drag and drop support',
                    'Large file handling'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <ArrowRight className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;