// frontend/src/components/papers/PaperSearch.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePaperStore } from '@/store/paperStore';

export default function PaperSearch() {
  const { 
    query, 
    results, 
    isLoading, 
    error, 
    cooldownActive,
    setQuery, 
    search 
  } = usePaperStore();
  
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  
  // for dropdown toggle
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const dropdownRefs = useRef<Array<HTMLDivElement | null>>([]);
  
  // handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdownIndex !== null && 
          dropdownRefs.current[openDropdownIndex] && 
          !dropdownRefs.current[openDropdownIndex]?.contains(event.target as Node)) {
        setOpenDropdownIndex(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownIndex]);
  
//   // Log metadata whenever results change
//   useEffect(() => {
//     if (results.length > 0) {
//       console.log('Scholar Search Results Metadata:', 
//         results.map(result => ({
//           title: result.title,
//           position: result.position,
//           doi: result.doi || 'Not available',
//           publication_info: result.publication_info || 'Not available',
//           resources: result.resources || 'Not available',
//           inline_links: result.inline_links || 'Not available',
//           all_data: result // Include the complete result for debugging
//         }))
//       );
//     }
//   }, [results]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search();
    setCurrentPage(1); // reset to first page on new search
  };
  
  // calculate pagination
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(results.length / resultsPerPage);
  
  // change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // toggle dropdown
  const toggleDropdown = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google Scholar..."
            className="flex-grow p-3 bg-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || cooldownActive}
            className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : cooldownActive ? 'Wait...' : 'Search'}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {currentResults.map((result, index) => {
          // check if any pdf resources are available
          const resources = result.resources || [];
          const hasPdfResources = resources.length > 0;
          const pdfResource = hasPdfResources ? resources[0] : null;
          const hasMultipleResources = resources.length > 1;
          
          // calculate unique index for this dropdown in the page
          const dropdownIndex = (currentPage - 1) * resultsPerPage + index;
          
          return (
            <div key={index} className="bg-gray-700 rounded-lg p-4 relative">
              
              <h2 className="text-xl font-semibold mb-2 pr-28">
                <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {result.title}
                </a>
              </h2>
              
              {result.publication_info?.summary && (
                <p className="mb-1 text-gray-300">
                  {result.publication_info.summary}
                </p>
              )}
              
              {/* doi moved right under the author information */}
              {result.doi ? (
                <p className="text-sm text-gray-300 mb-2">
                  DOI: <a href={`https://doi.org/${result.doi}`} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{result.doi}</a>
                </p>
              ) : (
                <p className="text-sm text-gray-300 mb-2">DOI: Not available</p>
              )}
              
              {/* combined pdf access area for primary pdf and additional resources */}
              <div className="mb-2 mt-3">
                {/* first priority: unpaywall pdf */}
                {result.unpaywall?.pdf_url ? (
                  <div className="inline-block relative">
                    <div>
                      <a 
                        href={result.unpaywall.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-4 py-1.5 rounded-l text-sm hover:bg-green-700 inline-block"
                      >
                        Open PDF
                      </a>
                      
                      {/* if there are additional resources, add a dropdown-style menu */}
                      {hasPdfResources && (
                        <div 
                          ref={el => {
                            dropdownRefs.current[dropdownIndex] = el;
                          }}
                          className="relative inline-block"
                        >
                          <button 
                            className="bg-green-600 text-white px-2 py-1.5 border-l border-green-500 rounded-r text-sm hover:bg-green-700"
                            onClick={() => toggleDropdown(dropdownIndex)}
                          >
                            ▼
                          </button>
                          
                          {openDropdownIndex === dropdownIndex && (
                            <div className="absolute left-0 mt-1 z-10 bg-gray-800 border border-gray-600 rounded-md shadow-md">
                              {resources.map((resource, i) => (
                                <a 
                                  key={i}
                                  href={resource.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-4 py-2 text-sm hover:bg-gray-600 whitespace-nowrap"
                                >
                                  Google Scholar: {resource.title} [{resource.file_format}]
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Source: Unpaywall</div>
                  </div>
                ) : hasPdfResources && pdfResource ? (
                  // second priority: resource pdf if no unpaywall pdf
                  <div className="inline-block relative">
                    <div>
                      <a 
                        href={pdfResource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-4 py-1.5 rounded-l text-sm hover:bg-green-700 inline-block"
                      >
                        Open PDF
                      </a>
                      
                      {/* if there are multiple resources, add a dropdown */}
                      {hasMultipleResources && (
                        <div 
                          ref={el => {
                            dropdownRefs.current[dropdownIndex] = el;
                          }}
                          className="relative inline-block"
                        >
                          <button 
                            className="bg-green-600 text-white px-2 py-1.5 border-l border-green-500 rounded-r text-sm hover:bg-green-700"
                            onClick={() => toggleDropdown(dropdownIndex)}
                          >
                            ▼
                          </button>
                          
                          {openDropdownIndex === dropdownIndex && (
                            <div className="absolute left-0 mt-1 z-10 bg-gray-800 border border-gray-600 rounded-md shadow-md">
                              {resources.slice(1).map((resource, i) => (
                                <a 
                                  key={i}
                                  href={resource.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-4 py-2 text-sm hover:bg-gray-600 whitespace-nowrap"
                                >
                                  Google Scholar: {resource.title} [{resource.file_format}]
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Source: Google Scholar</div>
                  </div>
                ) : (
                  // no pdfs available
                  <div className="inline-block">
                    <span className="bg-gray-600 text-gray-300 px-4 py-1.5 rounded text-sm inline-block cursor-not-allowed">
                      PDF Not Available
                    </span>
                  </div>
                )}
              </div>
              
              {result.snippet && (
                <p className="mb-3 text-gray-300">{result.snippet}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                {/* citation link */}
                {result.inline_links?.cited_by && (
                  <a 
                    href={result.inline_links.cited_by.link}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="bg-blue-900 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-800"
                  >
                    Cited by {result.inline_links.cited_by.total}
                  </a>
                )}
              </div>
            </div>
          );
        })}
        
        {results.length === 0 && !isLoading && query && !error && (
          <p className="text-gray-400">No results found.</p>
        )}
      </div>
      
      {/* pagination */}
      {results.length > 0 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 rounded-l hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="flex">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`px-3 py-1 ${
                    currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 rounded-r hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}