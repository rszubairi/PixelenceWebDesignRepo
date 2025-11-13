// components/imaging/DicomViewer.js
import React, { useState } from 'react';

const DicomViewer = ({ images }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('single'); // single, compare, grid

  const selectedImage = images[selectedImageIndex];

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div>
      {/* View Mode Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'single' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setViewMode('single')}
          >
            Single
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'compare' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setViewMode('compare')}
          >
            Compare
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {selectedImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Image Viewer */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        {viewMode === 'single' && (
          <div className="h-full flex items-center justify-center">
            <img
              src={selectedImage.url}
              alt={`DICOM Image ${selectedImageIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 px-2 py-1 rounded text-xs">
              {selectedImage.type}
            </div>
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="h-full grid grid-cols-2 gap-2 p-2">
            {images.slice(0, 2).map((image, index) => (
              <div key={index} className="relative bg-white rounded flex items-center justify-center">
                <img
                  src={image.url}
                  alt={`DICOM Image ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 px-2 py-1 rounded text-xs">
                  {image.type}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="h-full grid grid-cols-3 gap-2 p-2">
            {images.map((image, index) => (
              <div key={index} className="relative bg-white rounded flex items-center justify-center">
                <img
                  src={image.url}
                  alt={`DICOM Image ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 px-2 py-1 rounded text-xs">
                  {image.type}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Controls for Single View */}
        {viewMode === 'single' && images.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1"
              onClick={handlePreviousImage}
            >
              <svg className="h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1"
              onClick={handleNextImage}
            >
              <svg className="h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
              index === selectedImageIndex ? 'border-purple-600' : 'border-gray-300'
            }`}
            onClick={() => setSelectedImageIndex(index)}
          >
            <img
              src={image.url}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover rounded"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default DicomViewer;