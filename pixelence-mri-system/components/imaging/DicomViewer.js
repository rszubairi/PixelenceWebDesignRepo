// components/imaging/DicomViewer.js
import React, { useState, useEffect, useRef } from 'react';
import * as dicomParser from 'dicom-parser';

const DicomViewer = ({ images }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('single'); // single, compare, grid
  const [dicomData, setDicomData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRefs = useRef([]);
  const viewerContainerRef = useRef(null);

  // Debug: Verify component is mounting
  console.log('=== DicomViewer component mounted ===');

  // Single DICOM file path containing multiple frames
  const dicomFilePath = '/dicom images/01.dcm';
  
  // Target sequence types to extract
  const targetSequences = ['T1', 'T2', 'FLAIR', 'DSW'];

  useEffect(() => {
    // Load DICOM files when component mounts
    loadDicomFiles();
  }, []);

  // Render images after they are loaded
  useEffect(() => {
    if (dicomData.length > 0) {
      dicomData.forEach((imageData, index) => {
        if (canvasRefs.current[index]) {
          renderDicomImage(imageData, index);
        }
      });
    }
  }, [dicomData, viewMode, selectedImageIndex]);

  const loadDicomFiles = async () => {
    setLoading(true);
    try {
      // Try to load multiple DICOM files (for single-frame files)
      const dicomFilePaths = [
        '/dicom images/01.dcm',
        '/dicom images/02.dcm',
        '/dicom images/03.dcm',
        '/dicom images/04.dcm'
      ];
      
      const extractedFrames = [];
      let loadedSuccessfully = false;
      
      // Try loading 4 separate DICOM files first
      for (let i = 0; i < dicomFilePaths.length; i++) {
        try {
          const response = await fetch(dicomFilePaths[i]);
          if (!response.ok) {
            console.warn(`File ${dicomFilePaths[i]} not found, will try multi-frame approach`);
            break;
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const byteArray = new Uint8Array(arrayBuffer);
          const dataSet = dicomParser.parseDicom(byteArray);
          
          // Extract image information
          const rows = dataSet.uint16('x00280010');
          const columns = dataSet.uint16('x00280011');
          const pixelDataElement = dataSet.elements.x7fe00010;
          
          if (!pixelDataElement) {
            console.error(`No pixel data in ${dicomFilePaths[i]}`);
            continue;
          }
          
          // Get bits allocated
          const bitsAllocated = dataSet.uint16('x00280100') || 16;
          const pixelDataOffset = pixelDataElement.dataOffset;
          
          // Extract pixel data
          let framePixelData;
          if (bitsAllocated === 16) {
            framePixelData = new Uint16Array(
              byteArray.buffer,
              pixelDataOffset,
              rows * columns
            );
          } else if (bitsAllocated === 8) {
            framePixelData = new Uint8Array(
              byteArray.buffer,
              pixelDataOffset,
              rows * columns
            );
          } else {
            console.error(`Unsupported bits allocated: ${bitsAllocated}`);
            continue;
          }
          
          console.log(`Loaded ${dicomFilePaths[i]}: ${rows}x${columns}, ${bitsAllocated} bits`);
          
          extractedFrames.push({
            type: targetSequences[i],
            frameIndex: i,
            dataSet: dataSet,
            rows: rows,
            columns: columns,
            pixelData: framePixelData,
            byteArray: byteArray,
            bitsAllocated: bitsAllocated,
            index: i
          });
          
          loadedSuccessfully = true;
        } catch (error) {
          console.error(`Failed to load ${dicomFilePaths[i]}:`, error);
        }
      }
      
      // If loading separate files failed, try multi-frame approach with first file
      if (extractedFrames.length === 0) {
        console.log('Trying multi-frame DICOM approach...');
        
        const response = await fetch('/dicom images/01.dcm');
        if (!response.ok) {
          throw new Error('Failed to fetch DICOM file');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);
        
        // Extract basic image information
        const rows = dataSet.uint16('x00280010');
        const columns = dataSet.uint16('x00280011');
        const pixelDataElement = dataSet.elements.x7fe00010;
        
        if (!pixelDataElement) {
          throw new Error('No pixel data found in DICOM file');
        }
        
        // Check if this is a multi-frame image
        let numberOfFrames = 1;
        try {
          numberOfFrames = dataSet.intString('x00280008') || 1;
        } catch (e) {
          numberOfFrames = 1;
        }
        
        console.log(`Multi-frame DICOM: ${rows}x${columns}, ${numberOfFrames} frame(s)`);
        
        // Get bits allocated to determine pixel size
        const bitsAllocated = dataSet.uint16('x00280100') || 16;
        const bytesPerPixel = bitsAllocated / 8;
        const pixelDataOffset = pixelDataElement.dataOffset;
        const frameSize = rows * columns * bytesPerPixel;
        
        // Determine how many frames to extract (min of 4 or available frames)
        const framesToExtract = Math.min(4, numberOfFrames);
        
        for (let i = 0; i < framesToExtract; i++) {
          const frameOffset = pixelDataOffset + (i * frameSize);
          
          // Extract pixel data for this frame
          let framePixelData;
          if (bitsAllocated === 16) {
            framePixelData = new Uint16Array(
              byteArray.buffer,
              frameOffset,
              rows * columns
            );
          } else if (bitsAllocated === 8) {
            framePixelData = new Uint8Array(
              byteArray.buffer,
              frameOffset,
              rows * columns
            );
          } else {
            console.error(`Unsupported bits allocated: ${bitsAllocated}`);
            continue;
          }
          
          extractedFrames.push({
            type: targetSequences[i],
            frameIndex: i,
            dataSet: dataSet,
            rows: rows,
            columns: columns,
            pixelData: framePixelData,
            byteArray: byteArray,
            bitsAllocated: bitsAllocated,
            index: i
          });
        }
      }
      
      // Fill remaining slots with placeholders if needed
      while (extractedFrames.length < 4) {
        extractedFrames.push({
          type: targetSequences[extractedFrames.length],
          dataSet: null,
          error: `${targetSequences[extractedFrames.length]} not available`,
          index: extractedFrames.length
        });
      }
      
      setDicomData(extractedFrames);
      
      console.log('Final extracted frames:', extractedFrames.map(f => ({
        type: f.type,
        hasData: !!f.pixelData,
        dimensions: f.rows && f.columns ? `${f.rows}x${f.columns}` : 'N/A',
        bitsAllocated: f.bitsAllocated
      })));
      
    } catch (error) {
      console.error('Failed to load DICOM files:', error);
      
      // Create error placeholders for all 4 sequences
      const errorFrames = targetSequences.map((type, index) => ({
        type: type,
        dataSet: null,
        error: `Failed to load: ${error.message}`,
        index: index
      }));
      
      setDicomData(errorFrames);
    } finally {
      setLoading(false);
    }
  };

  const renderDicomImage = (imageData, index) => {
    const canvas = canvasRefs.current[index];
    if (!canvas || !imageData.pixelData) {
      // Render placeholder for failed/missing images
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DICOM Image', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText(imageData.type, canvas.width / 2, canvas.height / 2 + 15);
        if (imageData.error) {
          ctx.font = '12px Arial';
          ctx.fillStyle = '#ef4444';
          ctx.fillText(`Error: ${imageData.error}`, canvas.width / 2, canvas.height / 2 + 40);
        }
      }
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      const rows = imageData.rows;
      const columns = imageData.columns;
      
      // Set canvas size to match DICOM image
      canvas.width = columns;
      canvas.height = rows;
      
      // Use the pre-extracted pixel data for this frame
      const pixelData = imageData.pixelData;
      
      // Find min and max pixel values for normalization
      let minPixelValue = pixelData[0];
      let maxPixelValue = pixelData[0];
      for (let i = 0; i < pixelData.length; i++) {
        if (pixelData[i] < minPixelValue) minPixelValue = pixelData[i];
        if (pixelData[i] > maxPixelValue) maxPixelValue = pixelData[i];
      }
      
      // Create image data for canvas
      const imageDataObj = ctx.createImageData(columns, rows);
      const range = maxPixelValue - minPixelValue;
      
      // Convert DICOM pixel data to RGBA
      for (let i = 0; i < pixelData.length; i++) {
        const normalizedValue = ((pixelData[i] - minPixelValue) / range) * 255;
        const pixelIndex = i * 4;
        imageDataObj.data[pixelIndex] = normalizedValue;     // R
        imageDataObj.data[pixelIndex + 1] = normalizedValue; // G
        imageDataObj.data[pixelIndex + 2] = normalizedValue; // B
        imageDataObj.data[pixelIndex + 3] = 255;             // A
      }
      
      // Draw the image data to canvas
      ctx.putImageData(imageDataObj, 0, 0);
      
    } catch (error) {
      console.error('Failed to render DICOM image:', error);
      // Fallback rendering
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Render Error', canvas.width / 2, canvas.height / 2);
    }
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? dicomData.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === dicomData.length - 1 ? 0 : prev + 1));
  };

  const getContainerStyle = () => {
    const baseStyle = isFullscreen 
      ? { height: '100vh', width: '100vw' }
      : {};
    
    if (viewMode === 'single') return { ...baseStyle, minHeight: '500px' };
    if (viewMode === 'compare') return { ...baseStyle, minHeight: '400px' };
    if (viewMode === 'grid') return { ...baseStyle, minHeight: '600px' };
    return { ...baseStyle, minHeight: '500px' };
  };

  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (viewerContainerRef.current.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen();
      } else if (viewerContainerRef.current.webkitRequestFullscreen) {
        viewerContainerRef.current.webkitRequestFullscreen();
      } else if (viewerContainerRef.current.msRequestFullscreen) {
        viewerContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes (e.g., when user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

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
        <div className="flex items-center space-x-3">
          <button
            className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <div className="text-sm text-gray-500">
            {dicomData.length > 0 ? `${selectedImageIndex + 1} / ${dicomData.length}` : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <span className="ml-4 text-gray-600">Loading DICOM images...</span>
        </div>
      )}

      {/* Image Viewer */}
      {!loading && dicomData.length > 0 && (
        <div 
          ref={viewerContainerRef}
          className={`relative bg-black overflow-hidden p-4 ${isFullscreen ? '' : 'rounded-lg'}`} 
          style={getContainerStyle()}
        >
          {viewMode === 'single' && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="relative">
                <canvas
                  ref={(el) => (canvasRefs.current[selectedImageIndex] = el)}
                  className="max-w-full max-h-[500px] object-contain"
                  style={{ 
                    imageRendering: 'pixelated',
                    transform: isFullscreen ? 'scale(1.5)' : 'scale(1)',
                    transition: 'transform 0.3s ease'
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 px-3 py-1 rounded text-sm font-medium">
                  {dicomData[selectedImageIndex]?.type || 'Unknown'}
                </div>
              </div>
              
              {/* Navigation Controls for Single View */}
              {dicomData.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition-all"
                    onClick={handlePreviousImage}
                  >
                    <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition-all"
                    onClick={handleNextImage}
                  >
                    <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {viewMode === 'compare' && (
            <div className="h-full grid grid-cols-2 gap-4">
              {dicomData.slice(0, 2).map((imageData, index) => (
                <div key={index} className="relative flex items-center justify-center">
                  <canvas
                    ref={(el) => (canvasRefs.current[index] = el)}
                    className="max-w-full max-h-[400px] object-contain"
                    style={{ 
                      imageRendering: 'pixelated',
                      transform: isFullscreen ? 'scale(1.5)' : 'scale(1)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 px-3 py-1 rounded text-sm font-medium">
                    {imageData.type}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="h-full grid grid-cols-2 gap-4">
              {dicomData.map((imageData, index) => (
                <div key={index} className="relative flex items-center justify-center">
                  <canvas
                    ref={(el) => (canvasRefs.current[index] = el)}
                    className="max-w-full max-h-[250px] object-contain cursor-pointer"
                    style={{ 
                      imageRendering: 'pixelated',
                      transform: isFullscreen ? 'scale(1.5)' : 'scale(1)',
                      transition: 'transform 0.3s ease'
                    }}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setViewMode('single');
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 px-3 py-1 rounded text-sm font-medium">
                    {imageData.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thumbnail Strip */}
      {dicomData.length > 0 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {dicomData.map((imageData, index) => (
            <button
              key={index}
              className={`relative flex-shrink-0 w-20 h-20 rounded border-2 ${
                index === selectedImageIndex ? 'border-purple-600' : 'border-gray-300'
              } overflow-hidden transition-all hover:border-purple-400`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <canvas
                ref={(el) => {
                  if (el && !canvasRefs.current.includes(el)) {
                    const thumbIndex = dicomData.length + index;
                    canvasRefs.current[thumbIndex] = el;
                    if (imageData.dataSet) {
                      renderDicomImage(imageData, thumbIndex);
                    }
                  }
                }}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs text-center py-1">
                {imageData.type}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {!loading && dicomData.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Failed to load DICOM images. Please check if the DICOM files exist in the public/dicom images folder.</div>
        </div>
      )}
    </div>
  );
};

export default DicomViewer;
