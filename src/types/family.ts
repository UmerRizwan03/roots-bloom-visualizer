
export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  occupation?: string;
  bio?: string;
  photo?: string;
  gender: 'male' | 'female';
  generation: number;
  parents?: string[];
  children?: string[];
  // spouse?: string; // Replaced by new partners field
  // partners?: string[]; // Replaced by new partners field, now a comma-separated string
  // Comma-separated string of partner names
  partners?: string;
  bloodType?: string;
  mobileNumber?: string;
  email?: string;
  coParentName?: string; // Add this line
  isCollapsed?: boolean; // Optional: for UI state, true if children are collapsed
}

export interface FamilyConnection {
  id: string;
  source: string;
  target: string;
  type: 'parent' | 'spouse';
}

// Data structure for nodes in ReactFlow, extending FamilyMember with UI-specific properties and callbacks
export interface FamilyMemberNodeData extends FamilyMember {
  // Callbacks passed from the tree/page
  onSelect: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  onToggleCollapse: (memberId: string) => void;

  // UI state flags determined during layout
  isSearchMatch?: boolean;
  isFocused?: boolean;
  // isCollapsed is already in FamilyMember, but could be overridden or explicitly set here too
  descendantCount?: number;
  hasChildren?: boolean; // Explicit flag if node has children visible in the current layout

  // Authorization flag
  canEdit?: boolean;

  // Layout specific flags (optional, might be handled internally by layout or node)
  isManagingSpouseLayout?: boolean; 
  spouseId?: string; // To help with spouse handle rendering if needed directly in node
}
