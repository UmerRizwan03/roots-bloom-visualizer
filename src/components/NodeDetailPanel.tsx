// src/components/NodeDetailPanel.tsx
import React from 'react';
import { FamilyMember } from '../types/family';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardDescription removed
import { X, Edit, ExternalLink, Minimize2, Maximize2, User } from 'lucide-react'; // User icon added

interface NodeDetailPanelProps {
  member: FamilyMember | null;
  onClose: () => void;
  onEdit: (member: FamilyMember) => void;
  // onToggleExpand?: (memberId: string) => void; 
  // isNodeCollapsed?: boolean; 
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ member, onClose, onEdit }) => {
  if (!member) {
    return null; 
  }

  // Placeholder for actual expand/collapse logic
  const isCurrentlyCollapsed = false; 
  const handleToggleExpand = () => console.log("Toggle expand for:", member.id);

  return (
    <div className="fixed top-0 right-0 h-full w-80 md:w-96 bg-card border-l shadow-xl z-40 transform transition-transform duration-300 ease-in-out"
         style={{ transform: member ? 'translateX(0)' : 'translateX(100%)' }}>
      <Card className="h-full flex flex-col rounded-none border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg truncate">{member.name}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4 overflow-y-auto flex-grow">
          {/* Photo */}
          <div className="flex justify-center mb-4">
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="w-32 h-32 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h4 className="font-semibold mb-1">Details</h4>
            <p className="text-sm"><strong>DOB:</strong> {member.birthDate ? new Date(member.birthDate).toLocaleDateString() : 'N/A'}</p>
            {/* Add other relevant details like DOD, occupation etc. */}
          </div>

          {member.bio && (
            <div>
              <h4 className="font-semibold mb-1">Bio</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.bio}</p>
            </div>
          )}

        </CardContent>
        <div className="p-4 border-t flex flex-col space-y-2">
          <Button variant="outline" onClick={() => onEdit(member)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Member
          </Button>
          <Button variant="outline" onClick={() => console.log('View Full Profile for:', member.id)}>
            <ExternalLink className="mr-2 h-4 w-4" /> View Full Profile
          </Button>
          <Button variant="outline" onClick={handleToggleExpand}>
            {isCurrentlyCollapsed ? <Maximize2 className="mr-2 h-4 w-4" /> : <Minimize2 className="mr-2 h-4 w-4" />}
            {isCurrentlyCollapsed ? 'Expand Family' : 'Collapse Family'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NodeDetailPanel;
