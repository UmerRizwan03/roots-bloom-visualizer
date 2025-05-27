
import React from 'react';
import { Plus } from 'lucide-react';

interface GenerationAddButtonProps {
  data: {
    generation: number;
    onAdd: (generation: number) => void;
  };
}

const GenerationAddButton: React.FC<GenerationAddButtonProps> = ({ data }) => {
  const { generation, onAdd } = data;

  const handleClick = () => {
    onAdd(generation);
  };

  return (
    <div className="generation-add-button">
      <button
        onClick={handleClick}
        className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 
                   text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
                   flex items-center justify-center group border-2 border-white/20 hover:border-white/40
                   hover:scale-110 active:scale-95"
        title={`Add member to Generation ${generation}`}
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>
      
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                      bg-emerald-800 text-white px-3 py-1 rounded-full text-xs font-medium
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Gen {generation}
      </div>
    </div>
  );
};

export default GenerationAddButton;
