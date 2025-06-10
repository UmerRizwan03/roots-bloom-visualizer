import React from 'react';
import { FamilyMember } from '../types/family';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardContent, ScrollArea
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'; // Removed UserIcon
import Breadcrumbs from './Breadcrumbs'; // Import Breadcrumbs

interface SidebarProps {
  members: FamilyMember[];
  onMemberSelect: (memberId: string) => void;
  // Removed: searchQuery, onSearchQueryChange, onHoverMember
  focusedMemberId?: string | null;
  onResetFocus: () => void;
  viewMode: 'FullTree' | 'PersonView' | 'LineageView';
  setViewMode: (mode: 'FullTree' | 'PersonView' | 'LineageView') => void;
  lineageDirection: 'Ancestors' | 'Descendants';
  setLineageDirection: (direction: 'Ancestors' | 'Descendants') => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  members,
  onMemberSelect,
  // Removed: searchQuery, onSearchQueryChange, onHoverMember
  focusedMemberId,
  onResetFocus,
  viewMode,
  setViewMode,
  lineageDirection,
  setLineageDirection,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  // Removed: showSuggestions, searchContainerRef, fuse, filteredMembers, useEffect for handleClickOutside, handleSuggestionClick

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-lg">Family Tree Controls</CardTitle>
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="ml-auto">
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
        </div>

        {focusedMemberId && (
          <Breadcrumbs
            focusedMemberId={focusedMemberId}
            members={members} // members and onMemberSelect are still passed to Breadcrumbs
            onSelectMember={onMemberSelect}
            className="mb-2 pt-1"
          />
        )}

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-muted-foreground">Focus Tools</div>
          {focusedMemberId && (
            <Button variant="outline" size="sm" onClick={onResetFocus}>
              Reset Focus
            </Button>
          )}
        </div>

        {/* Removed div that showed "Search Active" message */}

        <div className="space-y-2 pt-2">
          <div className="text-sm font-medium">View Mode</div>
          <div className="flex space-x-1">
            <Button onClick={() => setViewMode('FullTree')} variant={viewMode === 'FullTree' ? 'secondary' : 'outline'} size="sm" className="flex-1">Full Tree</Button>
            <Button onClick={() => setViewMode('PersonView')} variant={viewMode === 'PersonView' ? 'secondary' : 'outline'} disabled={!focusedMemberId} size="sm" className="flex-1">Person</Button>
            <Button onClick={() => setViewMode('LineageView')} variant={viewMode === 'LineageView' ? 'secondary' : 'outline'} disabled={!focusedMemberId} size="sm" className="flex-1">🧬 Show My Entire Lineage</Button>
          </div>
          {viewMode === 'LineageView' && focusedMemberId && (
            <div className="flex space-x-1 pt-1">
              <Button onClick={() => setLineageDirection('Ancestors')} variant={lineageDirection === 'Ancestors' ? 'secondary' : 'outline'} size="xs" className="flex-1">👴 Show Parents & Grandparents</Button>
              <Button onClick={() => setLineageDirection('Descendants')} variant={lineageDirection === 'Descendants' ? 'secondary' : 'outline'} size="xs" className="flex-1">👶 Show Children & Grandchildren</Button>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Search Input and Autocomplete Container Removed */}
      
      {/* Fallback messages removed */}

      {/* The main content area of the sidebar. If other controls are needed, they would go here. */}
      {/* For now, it might be empty or have a placeholder if no other static content is needed besides the header. */}
      <div className="flex-grow p-4 text-sm text-muted-foreground">
        {/* Placeholder for any other sidebar content if needed */}
        {/* For example, list of all members, or other tools not in header */}
        { !focusedMemberId && <p>Select a member or search to see more options.</p>}
      </div>

    </Card>
  );
};

export default Sidebar;
