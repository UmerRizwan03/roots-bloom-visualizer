
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
    onNodeClick: (member: FamilyMember) => void; // Added for modal opening
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
    hasChildren,
    onNodeClick // Destructured onNodeClick
  } = data;

  const handleClick = useCallback(() => {
    onSelect(member);
    onNodeClick(member); // Call onNodeClick
  }, [member, onSelect, onNodeClick]);

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }, [handleClick]);

  return (
    <div 
      className="family-member-node"
      role="treeitem" // Added role
      aria-label={`Family member: ${member.name}, ${member.occupation || 'details available on click'}`} // Added aria-label
      tabIndex={0} // Added tabIndex to make it focusable
      onKeyDown={handleKeyDown} // Added keyboard handler for selection
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 !border-2 !border-white dark:!border-slate-700 !shadow-sm"
      />
      
      <div
        // onClick is already on the outer div, but if we want to ensure this inner div also triggers it (though redundant now):
        // onClick={handleClick} 
        // The main click/keyboard interaction is now on the root `family-member-node` div.
        className={` 
          relative w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-700/50
          cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1
          overflow-hidden group 
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 // Added focus styles for the card itself
          ${isHoverHighlighted && !isDimmed ? 'ring-2 ring-green-500 dark:ring-green-400 shadow-green-300/50 dark:shadow-green-700/50' : ''}
          ${isHighlighted && focusedRelationType !== 'self' && !isHoverHighlighted ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-amber-200/50 dark:shadow-amber-600/50' : ''}
          ${isCollapsed ? 'opacity-80' : ''}
          ${isDimmed && !isHoverHighlighted ? 'opacity-30 dark:opacity-40' : ''} // Ensure hover highlight isn't dimmed; slightly less dim for dark mode
          ${!isDimmed && focusedRelationType === 'self' ? 'border-blue-500 dark:border-blue-400 ring-4 ring-blue-500 dark:ring-blue-400 shadow-blue-300/50 dark:shadow-blue-600/50' :
            !isDimmed && focusedRelationType === 'parent' ? 'border-sky-400 dark:border-sky-500' :
            !isDimmed && focusedRelationType === 'spouse' ? 'border-pink-400 dark:border-pink-500' :
            !isDimmed && (focusedRelationType === 'child' || focusedRelationType === 'descendant') ? 'border-green-400 dark:border-green-500' :
            !isDimmed && focusedRelationType === 'sibling' ? 'border-purple-400 dark:border-purple-500' :
            'border-slate-200 dark:border-slate-700' // Default border
          }
        `}
      >
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1 z-10">
          <button
            onClick={handleEdit}
            aria-label={`Edit details for ${member.name}`} // Added aria-label
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            aria-label={`Delete member ${member.name}`} // Added aria-label
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
            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full p-0.5 shadow-lg">
              <div className={`
                w-full h-full rounded-full flex items-center justify-center overflow-hidden
                ${member.gender === 'male' ? 'bg-blue-50 dark:bg-blue-900' : 'bg-rose-50 dark:bg-pink-900'}
              `}>
                {member.photo ? (
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className={`w-6 h-6 ${member.gender === 'male' ? 'text-blue-600 dark:text-blue-300' : 'text-rose-600 dark:text-pink-300'}`} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-4 pb-4 px-4 space-y-3">
          {/* Name and Age Section */}
          <div className="text-center min-h-[4rem]">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg leading-tight mb-1 min-h-[2.5rem] flex items-center justify-center">
              <span className="truncate max-w-full">{member.name}</span>
            </h3>
            <div className="min-h-[1.25rem] flex items-center justify-center">
              {age && (
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{age} years old</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {/* Mobile Number Display */}
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg px-2 py-1 min-h-[2rem]">
              {member.mobileNumber ? (
                <>
                  <Phone className="w-3 h-3 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <span className="truncate">{member.mobileNumber}</span>
                </>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
            
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg px-2 py-1 min-h-[2rem]">
              {member.occupation ? (
                <>
                  <Briefcase className="w-3 h-3 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <span className="truncate">{member.occupation}</span>
                </>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
          </div>
        </div>

        {/* Hover effect overlay - subtle change for dark mode if needed, or keep as is if it looks good */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl dark:from-black/10" />
      
        {/* Collapse/Expand Button - Colors are specific, should be fine in dark/light */}
        {hasChildren && onToggleCollapse && (
          <button
            onClick={handleToggleCollapse}
            className={`
              absolute top-2 left-2
              w-8 h-8 rounded-full border-2 border-white dark:border-slate-700
              flex items-center justify-center shadow-lg
              transition-all duration-300 hover:scale-110 z-20
              opacity-0 group-hover:opacity-100 
              ${isCollapsed ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-sky-500 hover:bg-sky-600'}
            `}
            aria-label={isCollapsed ? `Expand children of ${member.name}` : `Collapse children of ${member.name}`}
            aria-expanded={!isCollapsed}
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
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 !border-2 !border-white dark:!border-slate-700 !shadow-sm"
      />
    </div>
  );
};

export default React.memo(FamilyMemberNodeInternal);
