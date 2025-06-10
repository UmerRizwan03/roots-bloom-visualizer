import React, { useMemo, useState, useEffect, useRef } from 'react'; // Added useState, useEffect, useRef
import Fuse from 'fuse.js';
import { FamilyMember } from '../types/family';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User as UserIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react'; // Added PanelLeft icons
import Breadcrumbs from './Breadcrumbs'; // Import Breadcrumbs

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(() => new Fuse(members, {
    keys: ['name', 'birthDate', 'occupation', 'mobileNumber'],
    includeScore: true,
    threshold: 0.4, // Adjust as needed
  }), [members]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) {
      return [];
    }
    const results = fuse.search(searchQuery).map(result => result.item);
    // Limit to, for example, 5-7 suggestions for a cleaner UI
    return results.slice(0, 7);
  }, [searchQuery, fuse]);

  // Effect to handle clicks outside the search container to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);


  const handleSuggestionClick = (member: FamilyMember) => {
    onMemberSelect(member.id);
    onSearchQueryChange(member.name); // Update search query to selected member's name
    setShowSuggestions(false); // Hide suggestions
    onHoverMember(null); // Clear hover highlight
  };

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
            members={members}
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

        <div className="mt-1 space-y-1 text-xs text-muted-foreground">
          {searchQuery && !showSuggestions && ( // Only show "Search Active" if suggestions are not shown
            <p className="text-amber-600 dark:text-amber-400">Search Active: "{searchQuery}"</p>
          )}
        </div>

        <div className="space-y-2 pt-2">
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

      {/* Search Input and Autocomplete Container */}
      <div ref={searchContainerRef} className="relative p-4 pt-2">
        <Input
          type="text"
          placeholder="Type name to search..."
          aria-label="Search family members by name, birth date, or occupation" // Added aria-label
          value={searchQuery}
          onChange={(e) => {
            onSearchQueryChange(e.target.value);
            if (e.target.value) {
              setShowSuggestions(true); // Show suggestions when typing
            } else {
              setShowSuggestions(false); // Hide if input is cleared
            }
          }}
          onFocus={() => {
            if (searchQuery && filteredMembers.length > 0) {
               setShowSuggestions(true); // Show suggestions on focus if there's already a query and results
            }
          }}
          className="mb-1" // Reduced margin as suggestions will be directly below
        />
        {showSuggestions && searchQuery && filteredMembers.length > 0 && (
          <Card className="absolute z-10 w-[calc(100%-2rem)] top-full mt-1 max-h-80 overflow-y-auto shadow-lg border"> {/* Adjust width to match input area, max height for scroll */}
            <CardContent className="p-0"> {/* Remove CardContent padding */}
              {filteredMembers.map((member) => {
                const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : 'N/A';
                return (
                  <div
                    key={member.id}
                    onClick={() => handleSuggestionClick(member)}
                    onMouseEnter={() => onHoverMember(member.id)}
                    onMouseLeave={() => onHoverMember(null)}
                    className="flex items-center p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0" // Added border-b
                  >
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0">
                        <UserIcon className={`w-5 h-5 ${member.gender === 'male' ? 'text-blue-600' : 'text-rose-600'}`} />
                      </div>
                    )}
                    <div className="truncate"> {/* Added truncate for long names */}
                      <div className="font-medium text-sm truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">Born: {birthYear}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fallback message if no search query or if suggestions are hidden */}
      {!searchQuery && !showSuggestions && (
         <div className="flex-grow flex items-center justify-center p-4 text-sm text-muted-foreground">
           Start typing to search members...
         </div>
      )}
      {searchQuery && !filteredMembers.length && !showSuggestions && ( // Show "No members found" only if not showing suggestions
        <div className="flex-grow flex items-center justify-center p-4 text-sm text-muted-foreground">
           No members found. Try a different search.
        </div>
      )}

      {/* This ScrollArea and its content for displaying results *after* search is now replaced by the autocomplete */}
      {/* So, it should be removed or conditionally rendered if we want a separate results list (not typical for autocomplete) */}
      {/* For this task, we'll assume the autocomplete is the primary way to show search results. */}
      {/* The CardContent below the search input container is removed to simplify */}

    </Card>
  );
};

export default Sidebar;
