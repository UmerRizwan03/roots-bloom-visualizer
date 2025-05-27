
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Calendar, MapPin } from 'lucide-react';
import { FamilyMember } from '../types/family';

interface FamilyMemberNodeProps {
  data: {
    member: FamilyMember;
    onSelect: (member: FamilyMember) => void;
    isHighlighted?: boolean;
  };
}

const FamilyMemberNode: React.FC<FamilyMemberNodeProps> = ({ data }) => {
  const { member, onSelect, isHighlighted } = data;

  const handleClick = () => {
    onSelect(member);
  };

  const getBorderColor = () => {
    if (isHighlighted) return 'border-yellow-400 shadow-lg shadow-yellow-200';
    return member.gender === 'male' 
      ? 'border-blue-200 hover:border-blue-400' 
      : 'border-pink-200 hover:border-pink-400';
  };

  const getGradient = () => {
    return member.gender === 'male'
      ? 'from-blue-50 to-blue-100'
      : 'from-pink-50 to-pink-100';
  };

  const currentYear = new Date().getFullYear();
  const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : null;
  const deathYear = member.deathDate ? new Date(member.deathDate).getFullYear() : null;
  const age = deathYear ? deathYear - (birthYear || 0) : (birthYear ? currentYear - birthYear : null);

  return (
    <div className="family-member-node">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
      
      <div
        onClick={handleClick}
        className={`
          w-40 bg-gradient-to-br ${getGradient()} 
          border-2 ${getBorderColor()}
          rounded-xl p-4 shadow-md cursor-pointer 
          transition-all duration-200 hover:shadow-xl hover:scale-105
          ${isHighlighted ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
        `}
      >
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${member.gender === 'male' ? 'bg-blue-200' : 'bg-pink-200'}
          `}>
            {member.photo ? (
              <img 
                src={member.photo} 
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className={`w-6 h-6 ${member.gender === 'male' ? 'text-blue-600' : 'text-pink-600'}`} />
            )}
          </div>
        </div>

        {/* Name */}
        <div className="text-center mb-2">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight">
            {member.name}
          </h3>
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs text-gray-600">
          {age && (
            <div className="flex items-center justify-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{age} years old</span>
            </div>
          )}
          
          {member.birthPlace && (
            <div className="flex items-center justify-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{member.birthPlace}</span>
            </div>
          )}
          
          {member.occupation && (
            <div className="text-center">
              <span className="bg-white bg-opacity-50 px-2 py-1 rounded text-xs font-medium">
                {member.occupation}
              </span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
};

export default FamilyMemberNode;
