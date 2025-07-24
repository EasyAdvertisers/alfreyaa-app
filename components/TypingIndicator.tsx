
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-start py-2 px-4">
      <div className="flex items-center space-x-3 bg-gray-800 rounded-full p-3">
        <div className="w-2.5 h-2.5 bg-deep-purple-400 rounded-full animate-pulse"></div>
        <div className="w-2.5 h-2.5 bg-deep-purple-400 rounded-full animate-pulse delay-75"></div>
        <div className="w-2.5 h-2.5 bg-deep-purple-400 rounded-full animate-pulse delay-150"></div>
        <span className="text-sm text-gray-400 ml-2">Alfreyaa is thinking...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
