import React, { useMemo } from 'react';
import Fuse from 'fuse.js';
import { FamilyMember } from '../types/family';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User as UserIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react'; // Added PanelLeft icons

interface SidebarProps {
  members: FamilyMember[];
  onMemberSelect: (memberId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  focusedMemberId?: string | null;
  onResetFocus: () => void;
  onHoverMember: (memberId: string | null) => void;
  viewMode: 'FullTree' | 'PersonView' | 'LineageView';
  setViewMode: (mode: 'FullTree' | 'PersonView' | 'LineageView') => void;
  lineageDirection: 'Ancestors' | 'Descendants';
  setLineageDirection: (direction: 'Ancestors' | 'Descendants') => void;
  isSidebarOpen: boolean; // Added isSidebarOpen
  onToggleSidebar: () => void; // Added onToggleSidebar
}

const Sidebar: React.FC<SidebarProps> = ({
  members,
  onMemberSelect,
  searchQuery,
  onSearchQueryChange,
  focusedMemberId,
  onResetFocus,
  onHoverMember,
  viewMode,
  setViewMode,
  lineageDirection,
  setLineageDirection,
  isSidebarOpen, // Added isSidebarOpen
  onToggleSidebar, // Added onToggleSidebar
}) => {
  const fuse = useMemo(() => new Fuse(members, {
    keys: ['name', 'birthDate'],
    includeScore: true,
    threshold: 0.4, // Adjust as needed
  }), [members]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) {
      return [];
    }
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-lg">Family Tree Controls</CardTitle> {/* Changed Title */}
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="ml-auto"> {/* Sidebar Toggle Button */}
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
        </div>
         <div className="flex justify-between items-center mb-2"> {/* Added for Reset Focus */}
          <div className="text-sm font-medium text-muted-foreground">Focus Tools</div>
          {focusedMemberId && (
            <Button variant="outline" size="sm" onClick={onResetFocus}>
              Reset Focus
            </Button>
          )}
        </div>
        {/* Focus and Search Indicators */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {focusedMemberId && (
            <p className="text-blue-600 dark:text-blue-400">Focus Mode Active</p>
          )}
          {searchQuery && (
            <p className="text-amber-600 dark:text-amber-400">Search Active: "{searchQuery}"</p>
          )}
        </div>
        {/* View Mode Controls */}
        <div className="space-y-2 pt-2"> {/* Added pt-2 */}
          <div className="text-sm font-medium">View Mode</div>
          <div className="flex space-x-1">
            <Button onClick={() => setViewMode('FullTree')} variant={viewMode === 'FullTree' ? 'secondary' : 'outline'} size="sm" className="flex-1">Full Tree</Button>
            <Button onClick={() => setViewMode('PersonView')} variant={viewMode === 'PersonView' ? 'secondary' : 'outline'} disabled={!focusedMemberId} size="sm" className="flex-1">Person</Button>
            <Button onClick={() => setViewMode('LineageView')} variant={viewMode === 'LineageView' ? 'secondary' : 'outline'} disabled={!focusedMemberId} size="sm" className="flex-1">Lineage</Button>
          </div>
          {viewMode === 'LineageView' && focusedMemberId && (
            <div className="flex space-x-1 pt-1">
              <Button onClick={() => setLineageDirection('Ancestors')} variant={lineageDirection === 'Ancestors' ? 'secondary' : 'outline'} size="xs" className="flex-1">Ancestors</Button>
              <Button onClick={() => setLineageDirection('Descendants')} variant={lineageDirection === 'Descendants' ? 'secondary' : 'outline'} size="xs" className="flex-1">Descendants</Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden p-4 pt-2"> {/* Adjusted pt-2 */}
        <Input
          type="text"
          placeholder="Type name to search..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="mb-4" // Add some margin below the input
        />

        {/* Conditional rendering based on searchQuery */}
        {!searchQuery && (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Start typing to search members...
            </p>
          </div>
        )}

        {searchQuery && (
          <ScrollArea className="flex-grow h-0"> {/* ScrollArea takes remaining space */}
            {filteredMembers.length > 0 ? (
              <div className="space-y-2 pr-1"> {/* Increased space, adjusted padding */}
                {filteredMembers.map((member) => {
                  const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : 'N/A';
                  return (
                    <div
                      key={member.id}
                      onClick={() => onMemberSelect(member.id)}
                      onMouseEnter={() => onHoverMember(member.id)}
                      onMouseLeave={() => onHoverMember(null)}
                      className="flex items-center p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md transition-colors"
                    >
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-3">
                          <UserIcon className={`w-5 h-5 ${member.gender === 'male' ? 'text-blue-600' : 'text-rose-600'}`} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">Born: {birthYear}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No members found. Try a different search.
                  No members found. Try a different search.
                </p>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default Sidebar;
