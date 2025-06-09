
import React, { useCallback, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Calendar, Briefcase, Edit, Trash2, PlusCircle, MinusCircle, Phone } from 'lucide-react';
import { FamilyMember } from '../types/family';

interface FamilyMemberNodeProps {
  data: {
    member: FamilyMember;
    onSelect: (member: FamilyMember) => void;
    onEdit: (member: FamilyMember) => void;
    onDelete: (memberId: string) => void;
    isHighlighted?: boolean;
    isDimmed?: boolean;
    focusedRelationType?: string | null;
    isHoverHighlighted?: boolean; // Added isHoverHighlighted
    isCollapsed?: boolean;
    onToggleCollapse?: (memberId: string) => void;
    hasChildren?: boolean;
    // Consider adding canEdit if it determines button visibility and can change
  };
}

const FamilyMemberNodeInternal: React.FC<FamilyMemberNodeProps> = ({ data }) => {
  const {
    member,
    onSelect,
    onEdit,
    onDelete,
    isHighlighted,
    isDimmed,
    focusedRelationType,
    isHoverHighlighted, // Added isHoverHighlighted
    isCollapsed,
    onToggleCollapse,
    hasChildren
  } = data;

  const handleClick = useCallback(() => {
    onSelect(member);
  }, [member, onSelect]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(member);
  }, [member, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      onDelete(member.id);
    }
  }, [member.id, member.name, onDelete]);

  const age = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : null;
    const deathYear = member.deathDate ? new Date(member.deathDate).getFullYear() : null;
    return deathYear ? deathYear - (birthYear || 0) : (birthYear ? currentYear - birthYear : null);
  }, [member.birthDate, member.deathDate]);

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCollapse) {
      onToggleCollapse(member.id);
    }
  }, [member.id, onToggleCollapse]);

  // Diagnostic log
  console.log(`Node: ${member.name}, hasChildren: ${hasChildren}, onToggleCollapse defined: ${!!onToggleCollapse}`);

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
          relative w-52 bg-white rounded-2xl shadow-lg
          cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1
          overflow-hidden group
          ${isHoverHighlighted && !isDimmed ? 'ring-2 ring-green-500 shadow-green-300/50' : ''}
          ${isHighlighted && focusedRelationType !== 'self' && !isHoverHighlighted ? 'ring-2 ring-amber-400 shadow-amber-200/50' : ''}
          ${isCollapsed ? 'opacity-80' : ''}
          ${isDimmed && !isHoverHighlighted ? 'opacity-30' : ''} // Ensure hover highlight isn't dimmed
          ${!isDimmed && focusedRelationType === 'self' ? 'border-blue-500 ring-4 ring-blue-500 shadow-blue-300/50' :
            !isDimmed && focusedRelationType === 'parent' ? 'border-sky-400' :
            !isDimmed && focusedRelationType === 'spouse' ? 'border-pink-400' :
            !isDimmed && (focusedRelationType === 'child' || focusedRelationType === 'descendant') ? 'border-green-400' :
            !isDimmed && focusedRelationType === 'sibling' ? 'border-purple-400' :
            'border-slate-200' // Default border
          }
        `}
      >
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1 z-10">
          <button
            onClick={handleEdit}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

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
        <div className="pt-4 pb-4 px-4 space-y-3"> {/* Adjusted padding: pt-8 to pt-4 */}
          {/* Name and Age Section */}
          <div className="text-center min-h-[4rem]">
            <h3 className="font-semibold text-slate-900 text-lg leading-tight mb-1 min-h-[2.5rem] flex items-center justify-center"> {/* Font size: text-sm to text-lg */}
              <span className="truncate max-w-full">{member.name}</span>
            </h3>
            <div className="min-h-[1.25rem] flex items-center justify-center"> {/* Approx 1 line height for age */}
              {age && (
                <div className="flex items-center text-sm text-slate-500"> {/* Font size: text-xs to text-sm */}
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{age} years old</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {/* Mobile Number Display */}
            <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg px-2 py-1 min-h-[2rem]"> {/* Font size: text-xs to text-sm; min-h-8 */}
              {member.mobileNumber ? (
                <>
                  <Phone className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{member.mobileNumber}</span>
                </>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
            
            <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg px-2 py-1 min-h-[2rem]"> {/* Font size: text-xs to text-sm; min-h-8 */}
              {member.occupation ? (
                <>
                  <Briefcase className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{member.occupation}</span>
                </>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      
        {/* Collapse/Expand Button */}
        {hasChildren && onToggleCollapse && (
          <button
            onClick={handleToggleCollapse}
            className={`
              absolute -bottom-4 left-1/2 -translate-x-1/2
              w-8 h-8 rounded-full border-2 border-white
              flex items-center justify-center shadow-lg
              transition-all duration-200 hover:scale-110 z-20
              ${isCollapsed ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-sky-500 hover:bg-sky-600'}
            `}
            aria-label={isCollapsed ? 'Expand children' : 'Collapse children'}
          >
            {isCollapsed ? (
              <PlusCircle className="w-5 h-5 text-white" />
            ) : (
              <MinusCircle className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white !shadow-sm"
      />
    </div>
  );
};

export default React.memo(FamilyMemberNodeInternal);
