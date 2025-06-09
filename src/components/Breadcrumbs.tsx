import React from 'react';
import { FamilyMember } from '../types/family';
import { getAncestors } from '../lib/treeUtils'; // Assuming getAncestors is in treeUtils
import { ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  focusedMemberId: string | null;
  members: FamilyMember[];
  onSelectMember: (memberId: string) => void;
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  focusedMemberId,
  members,
  onSelectMember,
  className = '',
}) => {
  if (!focusedMemberId) {
    return <div className={`h-6 ${className}`}></div>; // Return empty div with same height for layout consistency or a placeholder
  }

  const memberMap = new Map(members.map(m => [m.id, m]));
  const focusedMember = memberMap.get(focusedMemberId);

  if (!focusedMember) {
    return <div className={`h-6 ${className}`}></div>; // Should not happen if ID is valid
  }

  // Get ancestors. getAncestors includes the focused member itself as the first element if generation param is 1.
  // For breadcrumbs, we want root -> ... -> parent -> focused.
  // getAncestors currently returns: [focused, parent, grandparent, ...]
  // So we need to reverse it.
  const ancestorPath = getAncestors(focusedMemberId, members, 1).reverse();

  return (
    <nav aria-label="breadcrumb" className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      {ancestorPath.map((member, index) => (
        <React.Fragment key={member.id}>
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          <button
            onClick={() => onSelectMember(member.id)}
            className={`hover:underline ${member.id === focusedMemberId ? 'font-semibold text-primary' : ''}`}
            disabled={member.id === focusedMemberId} // Disable click on the last item
          >
            {member.name}
          </button>
        </React.Fragment>
      ))}
      {ancestorPath.length === 0 && focusedMember && ( // Case where focused member has no known parents in data
         <span className="font-semibold text-primary">{focusedMember.name}</span>
      )}
    </nav>
  );
};

export default Breadcrumbs;
