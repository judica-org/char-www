"use client";
import { useState } from "react";

interface SecretFieldProps {
  value: string;
}

export const SecretField: React.FC<SecretFieldProps> = ({ value }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value).then(() => {
      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
    });
  };

  return (
    <div className="flex items-center space-x-2 relative">
      <div className="flex-grow relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          readOnly
          className="w-full bg-gray-100 p-3 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200"
        />
        <button
          onClick={toggleVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition duration-200"
          aria-label={isVisible ? "Hide secret" : "Show secret"}
        >
          {!isVisible ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      <div className="relative">
        <button
          onClick={copyToClipboard}
          className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 shadow-md"
          aria-label="Copy to clipboard"
        >
          📋
        </button>
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg whitespace-nowrap">
        Copied to clipboard!
            <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-800 transform rotate-45 -translate-x-1/2"></div>
      </div>
        )}
    </div>
    </div>
  );
};
