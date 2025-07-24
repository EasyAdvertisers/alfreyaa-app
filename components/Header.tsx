
import React from 'react';

interface HeaderProps {
  onClearHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClearHistory }) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm shadow-lg sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <h1 className="text-xl font-bold text-white">Alfreyaa AI Assistant</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={onClearHistory}
              aria-label="Clear chat history"
              title="Clear chat history"
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
