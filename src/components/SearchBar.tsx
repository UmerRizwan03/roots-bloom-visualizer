
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search family members..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                     transition-colors bg-white shadow-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                       h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 
                        rounded-lg shadow-lg z-10 p-2">
          <div className="text-sm text-gray-600">
            Searching for: <span className="font-semibold text-emerald-600">"{query}"</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
