import React, { useState, useEffect } from 'react';
import { Key, Save, Trash2, Eye, EyeOff } from 'lucide-react';

interface AWSCredentials {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export function AWSCredentials() {
  const [credentials, setCredentials] = useState<AWSCredentials>({
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isStored, setIsStored] = useState(false);

  useEffect(() => {
    const storedCredentials = localStorage.getItem('awsCredentials');
    if (storedCredentials) {
      setCredentials(JSON.parse(storedCredentials));
      setIsStored(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveCredentials = () => {
    localStorage.setItem('awsCredentials', JSON.stringify(credentials));
    setIsStored(true);
  };

  const removeCredentials = () => {
    localStorage.removeItem('awsCredentials');
    setCredentials({
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucketName: '',
    });
    setIsStored(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Key className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">AWS Credentials</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            AWS Region
          </label>
          <input
            type="text"
            id="region"
            name="region"
            value={credentials.region}
            onChange={handleInputChange}
            placeholder="e.g., us-east-1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700 mb-1">
            Access Key ID
          </label>
          <input
            type="text"
            id="accessKeyId"
            name="accessKeyId"
            value={credentials.accessKeyId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="secretAccessKey" className="block text-sm font-medium text-gray-700 mb-1">
            Secret Access Key
          </label>
          <div className="relative">
            <input
              type={showSecretKey ? 'text' : 'password'}
              id="secretAccessKey"
              name="secretAccessKey"
              value={credentials.secretAccessKey}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecretKey(!showSecretKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showSecretKey ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="bucketName" className="block text-sm font-medium text-gray-700 mb-1">
            Bucket Name
          </label>
          <input
            type="text"
            id="bucketName"
            name="bucketName"
            value={credentials.bucketName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            onClick={saveCredentials}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Credentials
          </button>
          
          {isStored && (
            <button
              onClick={removeCredentials}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Credentials
            </button>
          )}
        </div>
      </div>
    </div>
  );
}