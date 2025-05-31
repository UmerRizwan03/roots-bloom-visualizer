
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Calendar, MapPin, Briefcase, Edit, Trash2, PlusCircle, MinusCircle, ChevronDown, ChevronRight } from 'lucide-react'; // Added Chevron icons
import { FamilyMemberNodeData } from '../types/family'; // Use the new comprehensive type
import { NodeProps } from '@xyflow/react'; // Import NodeProps
import { memo } from 'react'; // Import memo

// Interface now uses NodeProps with FamilyMemberNodeData
const FamilyMemberNode: React.FC<NodeProps<FamilyMemberNodeData>> = ({ data }) => {
  // Destructure all necessary fields from data, which is FamilyMemberNodeData
  const {
    // FamilyMember fields (already part of FamilyMemberNodeData)
    name,
    birthDate,
    deathDate,
    occupation,
    photo,
    gender,
    birthPlace,
    id: memberId, // id is directly from FamilyMember part of FamilyMemberNodeData

    // Callbacks
    onSelect,
    onEdit,
    onDelete,
    onToggleCollapse,

    // UI state flags
    isSearchMatch, // Renamed from isHighlighted in previous attempts, aligning with prompt
    isFocused,     // isFocused from prompt
    isCollapsed,
    descendantCount, // from prompt
    hasChildren,    // Keep if distinct from descendantCount > 0 logic needed by UI

    // Authorization flag
    canEdit,

    // Layout specific flags (if needed by rendering logic, e.g. for Handles)
    // isManagingSpouseLayout,
    // spouseId
  } = data;

  // Construct a FamilyMember object from data for callbacks that expect it
  // This assumes FamilyMemberNodeData directly spreads FamilyMember props.
  const memberDataForCallback = { ...data } as unknown as FamilyMember;


  const handleClick = () => {
    onSelect(memberDataForCallback);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(memberDataForCallback);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Using memberId directly as it's part of FamilyMemberNodeData
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      onDelete(memberId);
    }
  };

  const currentYear = new Date().getFullYear();
  const birthYearCalc = birthDate ? new Date(birthDate).getFullYear() : null;
  const deathYearCalc = deathDate ? new Date(deathDate).getFullYear() : null;
  const age = deathYearCalc ? deathYearCalc - (birthYearCalc || 0) : (birthYearCalc ? currentYear - birthYearCalc : null);

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Using memberId directly
    if (onToggleCollapse) { // onToggleCollapse is optional in FamilyMemberNodeData
        onToggleCollapse(memberId);
    }
  };

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
          relative w-52 bg-white border border-slate-200 rounded-2xl shadow-lg
          cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
          overflow-hidden group
          ${isFocused ? 'ring-2 ring-emerald-500 shadow-emerald-300/50' : ''}
          ${isSearchMatch ? 'border-amber-400' : ''}
          ${isCollapsed ? 'opacity-80' : ''}
        `}
      >
        {/* Conditional Action Buttons */}
        {canEdit && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1 z-10">
            <button
              onClick={handleEdit}
              className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              aria-label="Edit member"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              aria-label="Delete member"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header with gradient */}
        <div className={`
          h-20 bg-gradient-to-br relative
          ${gender === 'male'
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
                ${gender === 'male' ? 'bg-blue-50' : 'bg-rose-50'}
              `}>
                {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className={`w-6 h-6 ${gender === 'male' ? 'text-blue-600' : 'text-rose-600'}`} />
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
              {name}
            </h3>
            {age !== null && (
              <div className="flex items-center justify-center text-xs text-slate-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{age} years old</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2">
            {birthPlace && (
              <div className="flex items-center text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                <MapPin className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                <span className="truncate">{birthPlace}</span>
              </div>
            )}

            {occupation && (
              <div className="flex items-center text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                <Briefcase className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" />
                <span className="truncate">{occupation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

        {/* Collapse/Expand Button */}
        {/* Using descendantCount as per prompt's FamilyMemberNodeData, or hasChildren if preferred */}
        {(descendantCount !== undefined && descendantCount > 0 || hasChildren) && onToggleCollapse && (
          <button
            onClick={handleToggleCollapse}
            className={`
              absolute -bottom-3 left-1/2 -translate-x-1/2
              w-7 h-7 rounded-full border-2 border-white
              flex items-center justify-center shadow-md
              transition-all duration-200 hover:scale-110 z-20
              ${isCollapsed ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-sky-500 hover:bg-sky-600'}
            `}
            aria-label={isCollapsed ? `Show ${descendantCount || ''} descendants` : 'Hide descendants'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white" /> // Using Chevron as per common UX for expand/collapse
            ) : (
              <ChevronDown className="w-4 h-4 text-white" /> // Using Chevron
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

export default memo(FamilyMemberNode); // Export with memo
