import React, { useState } from 'react';
import axios from 'axios';
import './RuleUploader.css';

const RuleUploader = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post('/api/rules/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Extracted rules:', response.data.rules);
      setSuccess(true);
      
      // Here you can handle the extracted rules
      // For example, store them in context or pass to a parent component

    } catch (error) {
      setError(error.response?.data?.error || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rule-uploader">
      <h2>Upload Game Rules PDF</h2>
      <div className="upload-container">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
        />
        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="upload-button"
        >
          {loading ? 'Processing...' : 'Upload and Process'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          Rules successfully extracted and processed!
        </div>
      )}
    </div>
  );
};

export default RuleUploader; 