
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Calendar, Briefcase, Edit, Trash2, PlusCircle, MinusCircle, Phone, UserPlus } from 'lucide-react';
import { FamilyMember } from '../types/family';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FamilyMemberNodeProps {
  data: {
    member: FamilyMember;
    onSelect: (member: FamilyMember) => void;
    onEdit: (member: FamilyMember) => void;
    onDelete: (memberId: string) => void;
    isHighlighted?: boolean;
    isDimmed?: boolean;
    focusedRelationType?: string | null;
    isHoverHighlighted?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: (memberId: string) => void;
    hasChildren?: boolean;
    onNodeClick: (member: FamilyMember) => void;
    onAddChild?: (member: FamilyMember) => void; // New optional prop
    canEdit?: boolean; // New optional prop
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
    isHoverHighlighted,
    isCollapsed,
    onToggleCollapse,
    hasChildren,
    onNodeClick,
    onAddChild, // Destructure new prop
    canEdit,    // Destructure new prop
  } = data;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    // This function is for the main node body click
    setIsMenuOpen(prev => !prev); // Toggle menu
    onSelect(member);      // Still select/focus the node
    onNodeClick(member);   // Still trigger detail panel/modal
  }, [member, onSelect, onNodeClick, setIsMenuOpen]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(member);
    setIsMenuOpen(false);
  }, [member, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      onDelete(member.id);
    }
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  }, [member.id, onToggleCollapse]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(); // This will now toggle the menu
    }
  }, [handleClick]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      className="family-member-node" // Outermost div, handles main click via propagation
      onClick={handleClick} // Main click handler to toggle menu
      role="treeitem"
      aria-label={`Family member: ${member.name}, ${member.occupation || 'details available on click'}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white !shadow-sm"
      />
      
      <div
        className={` 
          relative w-52 bg-white rounded-2xl shadow-lg
          cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1
          overflow-visible group  /* Changed overflow-hidden to overflow-visible */
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2
          ${isHoverHighlighted && !isDimmed ? 'ring-2 ring-green-500 shadow-green-300/50' : ''}
          ${isHighlighted && focusedRelationType !== 'self' && !isHoverHighlighted ? 'ring-2 ring-amber-400 shadow-amber-200/50' : ''}
          ${isCollapsed ? 'opacity-80' : ''}
          ${isDimmed && !isHoverHighlighted ? 'opacity-30' : ''}
          ${!isDimmed && focusedRelationType === 'self' ? 'border-blue-500 ring-4 ring-blue-500 shadow-blue-300/50' :
            !isDimmed && focusedRelationType === 'parent' ? 'border-sky-400' :
            !isDimmed && focusedRelationType === 'spouse' ? 'border-pink-400' :
            !isDimmed && (focusedRelationType === 'child' || focusedRelationType === 'descendant') ? 'border-green-400' :
            !isDimmed && focusedRelationType === 'sibling' ? 'border-purple-400' :
            'border-slate-200'
          }
        `}
      >
        {/* Floating Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-1/2 -translate-y-1/2 left-full ml-2 p-1 bg-card shadow-xl rounded-lg border z-30 flex flex-col space-y-1"
            onClick={(e) => e.stopPropagation()} // Prevent menu clicks from closing itself via node's main click
          >
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleEdit}
                    className="p-2 hover:bg-accent rounded-md"
                    aria-label="Edit Member"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Member</p></TooltipContent>
              </Tooltip>
            )}
            {canEdit && onAddChild && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (onAddChild) onAddChild(member); setIsMenuOpen(false); }}
                    className="p-2 hover:bg-accent rounded-md"
                    aria-label="Add Child"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Add Child</p></TooltipContent>
              </Tooltip>
            )}
            {hasChildren && onToggleCollapse && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleToggleCollapse}
                    className="p-2 hover:bg-accent rounded-md"
                    aria-label={isCollapsed ? "Expand Children" : "Collapse Children"}
                  >
                    {isCollapsed ? <PlusCircle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>{isCollapsed ? "Expand Children" : "Collapse Children"}</p></TooltipContent>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-accent rounded-md"
                    aria-label="Delete Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Delete Member</p></TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Header with gradient (original content starts here) */}
        <div className={`
          h-20 bg-gradient-to-br relative /* overflow-hidden removed from here to allow menu visibility */
          ${member.gender === 'male'
            ? 'from-blue-500 via-blue-600 to-indigo-600'
            : 'from-rose-500 via-pink-600 to-purple-600'
          }
        `}>
          <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:16px_16px]" />
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

        <div className="pt-4 pb-4 px-4 space-y-3">
          <div className="text-center min-h-[4rem]">
            <h3 className="font-semibold text-slate-900 text-lg leading-tight mb-1 min-h-[2.5rem] flex items-center justify-center">
              <span className="truncate max-w-full">{member.name}</span>
            </h3>
            <div className="min-h-[1.25rem] flex items-center justify-center">
              {age && (
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{age} years old</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg px-2 py-1 min-h-[2rem]">
              {member.mobileNumber ? (
                <>
                  <Phone className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{member.mobileNumber}</span>
                </>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
            
            <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg px-2 py-1 min-h-[2rem]">
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
        
        {/* Original Collapse/Expand Button - Keep if desired, or rely on menu */}
        {hasChildren && onToggleCollapse && !isMenuOpen && ( // Hide if menu is open to avoid overlap/confusion
            <button
                onClick={(e) => { e.stopPropagation(); handleToggleCollapse(e); }} // Ensure propagation is stopped here too
                className={`
                  absolute top-2 left-2 
                  w-7 h-7 rounded-full border border-white/50
                  flex items-center justify-center shadow-md
                  transition-all duration-200 hover:scale-105 z-10 
                  opacity-50 group-hover:opacity-100 
                  ${isCollapsed ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-sky-500 hover:bg-sky-600'}
                `}
                aria-label={isCollapsed ? `Expand children of ${member.name}` : `Collapse children of ${member.name}`}
                aria-expanded={!isCollapsed}
            >
                {isCollapsed ? <PlusCircle className="w-4 h-4 text-white" /> : <MinusCircle className="w-4 h-4 text-white" />}
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
