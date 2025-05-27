
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Calendar, MapPin, Briefcase } from 'lucide-react';
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

  const currentYear = new Date().getFullYear();
  const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : null;
  const deathYear = member.deathDate ? new Date(member.deathDate).getFullYear() : null;
  const age = deathYear ? deathYear - (birthYear || 0) : (birthYear ? currentYear - birthYear : null);

  return (
    <div className="family-member-node">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white !shadow-sm"
      />
      
      <div
        onClick={handleClick}
        className={`
          relative w-48 bg-white border border-slate-200 rounded-2xl shadow-lg 
          cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
          overflow-hidden group
          ${isHighlighted ? 'ring-2 ring-amber-400 shadow-amber-200/50' : ''}
        `}
      >
        {/* Header with gradient */}
        <div className={`
          h-20 bg-gradient-to-br relative
          ${member.gender === 'male' 
            ? 'from-blue-500 via-blue-600 to-indigo-600' 
            : 'from-rose-500 via-pink-600 to-purple-600'
          }
        `}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:16px_16px]" />
          
          {/* Avatar */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-12 bg-white rounded-full p-0.5 shadow-lg">
              <div className={`
                w-full h-full rounded-full flex items-center justify-center overflow-hidden
                ${member.gender === 'male' ? 'bg-blue-50' : 'bg-rose-50'}
              `}>
                {member.photo ? (
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className={`w-6 h-6 ${member.gender === 'male' ? 'text-blue-600' : 'text-rose-600'}`} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-8 pb-4 px-4 space-y-3">
          {/* Name */}
          <div className="text-center">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
              {member.name}
            </h3>
            {age && (
              <div className="flex items-center justify-center text-xs text-slate-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{age} years old</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2">
            {member.birthPlace && (
              <div className="flex items-center text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                <MapPin className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                <span className="truncate">{member.birthPlace}</span>
              </div>
            )}
            
            {member.occupation && (
              <div className="flex items-center text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                <Briefcase className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                <span className="truncate">{member.occupation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white !shadow-sm"
      />
    </div>
  );
};

export default FamilyMemberNode;
