import React from 'react';

export const MinimalTest: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Minimal Test Component
      </h3>
      <p className="text-gray-600 mb-4">
        This is a minimal test component to verify React rendering works.
      </p>
      <button 
        onClick={() => alert('Button clicked!')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Button
      </button>
    </div>
  );
};