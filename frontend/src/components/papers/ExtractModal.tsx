'use client';

import { useRef, useEffect, useState } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { createPortal } from 'react-dom';

export default function ExtractModal() {
  const {
    extractModalOpen,
    currentPaper,
    extractFormData,
    saveExtractLoading,
    saveExtractError,
    saveExtractSuccess,
    closeExtractModal,
    updateExtractFormData,
    saveExtract
  } = usePaperStore();
  
  const modalRef = useRef<HTMLDivElement>(null);
  
  // word count tracking
  const [extractWordCount, setExtractWordCount] = useState(0);
  const [additionalInfoWordCount, setAdditionalInfoWordCount] = useState(0);
  
  const MAX_EXTRACT_WORDS = 500;
  const MAX_ADDITIONAL_INFO_WORDS = 200;
  
  // calculate word counts when form data changes
  useEffect(() => {
    if (extractFormData.extract) {
      setExtractWordCount(countWords(extractFormData.extract));
    } else {
      setExtractWordCount(0);
    }
    
    if (extractFormData.additional_info) {
      setAdditionalInfoWordCount(countWords(extractFormData.additional_info));
    } else {
      setAdditionalInfoWordCount(0);
    }
  }, [extractFormData.extract, extractFormData.additional_info]);
  
  // helper function to count words
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word !== '').length;
  };
  
  // close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeExtractModal();
      }
    }
    
    if (extractModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [extractModalOpen, closeExtractModal]);
  
  // handle esc key to close modal
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeExtractModal();
      }
    }
    
    if (extractModalOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [extractModalOpen, closeExtractModal]);
  
  if (!extractModalOpen || !currentPaper) {
    return null;
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // check word count
    if (extractWordCount > MAX_EXTRACT_WORDS) {
      alert(`Extract exceeds maximum of ${MAX_EXTRACT_WORDS} words`);
      return;
    }
    
    if (additionalInfoWordCount > MAX_ADDITIONAL_INFO_WORDS) {
      alert(`Additional information exceeds maximum of ${MAX_ADDITIONAL_INFO_WORDS} words`);
      return;
    }
    
    // check if page number is provided
    if (!extractFormData.page_number.trim()) {
      alert('Page number is required');
      return;
    }
    
    saveExtract();
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'page_number') {
      const numericValue = value.replace(/\D/g, '');
      updateExtractFormData({ [name]: numericValue });
      return;
    }
    
    // check word count but still update the value
    updateExtractFormData({ [name]: value });
  };
  
  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999
      }}
    >
      <div 
        ref={modalRef}
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4"
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Save Paper Extract</h2>
          <button
            onClick={closeExtractModal}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Paper info (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1">Paper Title</label>
              <div className="p-2 bg-gray-700 rounded text-gray-300">
                {extractFormData.title}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">DOI</label>
              <div className="p-2 bg-gray-700 rounded text-gray-300">
                {extractFormData.doi || 'Not available'}
              </div>
            </div>
            
            {/* User input fields */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="extract" className="block text-sm font-medium">
                  Extract <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${extractWordCount > MAX_EXTRACT_WORDS ? 'text-red-500' : 'text-gray-400'}`}>
                  {extractWordCount}/{MAX_EXTRACT_WORDS} words
                </span>
              </div>
              <textarea
                id="extract"
                name="extract"
                value={extractFormData.extract}
                onChange={handleInputChange}
                placeholder="Enter the extract text here..."
                rows={5}
                required
                className={`w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 ${
                  extractWordCount > MAX_EXTRACT_WORDS 
                  ? 'focus:ring-red-500 border border-red-500' 
                  : 'focus:ring-blue-500'
                }`}
              />
            </div>
            
            <div>
              <label htmlFor="page_number" className="block text-sm font-medium mb-1">
                Page Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="page_number"
                name="page_number"
                value={extractFormData.page_number}
                onChange={handleInputChange}
                placeholder="Enter page number (numbers only)"
                pattern="[0-9]*"
                inputMode="numeric"
                required
                className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="additional_info" className="block text-sm font-medium">
                  Additional Information
                </label>
                <span className={`text-xs ${additionalInfoWordCount > MAX_ADDITIONAL_INFO_WORDS ? 'text-red-500' : 'text-gray-400'}`}>
                  {additionalInfoWordCount}/{MAX_ADDITIONAL_INFO_WORDS} words
                </span>
              </div>
              <textarea
                id="additional_info"
                name="additional_info"
                value={extractFormData.additional_info}
                onChange={handleInputChange}
                placeholder="Add notes, context, or any other information..."
                rows={3}
                className={`w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 ${
                  additionalInfoWordCount > MAX_ADDITIONAL_INFO_WORDS 
                  ? 'focus:ring-red-500 border border-red-500' 
                  : 'focus:ring-blue-500'
                }`}
              />
            </div>
          </div>
          
          {saveExtractError && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
              {saveExtractError}
            </div>
          )}
          
          {saveExtractSuccess && (
            <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded-md">
              Extract saved successfully!
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={closeExtractModal}
              className="mr-3 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveExtractLoading || extractWordCount > MAX_EXTRACT_WORDS || additionalInfoWordCount > MAX_ADDITIONAL_INFO_WORDS || !extractFormData.page_number.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveExtractLoading ? 'Saving...' : 'Save Extract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  // createPortal to render the modal at the document body level before the model was rendered in the middle of the search results 
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
} 