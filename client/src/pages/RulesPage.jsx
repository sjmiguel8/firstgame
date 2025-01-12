import React from 'react';
import RuleUploader from '../components/RuleUploader/RuleUploader';

const RulesPage = () => {
  return (
    <div className="rules-page">
      <h1>Yu-Gi-Oh! Rules Management</h1>
      <RuleUploader />
      
      {/* You can add additional rules-related components here */}
      <div className="rules-info">
        <h2>How to Upload Rules</h2>
        <ol>
          <li>Prepare your PDF file containing Yu-Gi-Oh! rules</li>
          <li>Click "Choose File" and select your PDF</li>
          <li>Click "Upload and Process"</li>
          <li>The rules will be automatically integrated into the game</li>
        </ol>
      </div>
    </div>
  );
};

export default RulesPage; 