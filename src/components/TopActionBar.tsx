// src/components/TopActionBar.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { FamilyMember } from '../types/family';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User as UserIcon, Eye, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TopActionBarProps {
  members: FamilyMember[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onMemberSelect: (memberId: string) => void;
  onHoverMember: (memberId: string | null) => void;
  onResetFocus: () => void;
  onSetViewMode: (mode: 'FullTree' | 'PersonView' | 'LineageView') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  viewMode: 'FullTree' | 'PersonView' | 'LineageView';
}

const TopActionBar: React.FC<TopActionBarProps> = (props) => {
  const {
    members,
    searchQuery,
    onSearchQueryChange,
    onMemberSelect,
    onHoverMember,
    onResetFocus,
    onSetViewMode,
    onZoomIn,
    onZoomOut,
    viewMode,
  } = props;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(() => {
    if (!members) return null;
    return new Fuse(members, {
      keys: ['name', 'birthDate', 'occupation'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery || !fuse) return [];
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (member: FamilyMember) => {
    onMemberSelect(member.id);
    onSearchQueryChange(''); // Clear search query
    setShowSuggestions(false); 
  };

  return (
    <div className="bg-background border-b shadow-sm p-2 flex items-center justify-between sticky top-0 z-50 h-16">
      <div className="flex items-center">
        <p className="text-lg font-semibold ml-2 mr-4">Family Tree</p>
      </div>

      <div ref={searchContainerRef} className="relative flex-grow max-w-md mx-auto">
        <Input
          type="text"
          placeholder="Search members..."
          aria-label="Search family members by name, birth date, or occupation"
          value={searchQuery}
          onChange={(e) => {
            onSearchQueryChange(e.target.value);
            if (e.target.value) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => {
            if (searchQuery && filteredMembers.length > 0) {
               setShowSuggestions(true);
            }
          }}
          className="w-full"
        />
        {showSuggestions && searchQuery && filteredMembers.length > 0 && (
          <Card className="absolute z-50 w-full top-full mt-1 max-h-80 overflow-y-auto shadow-lg border bg-card">
            <CardContent className="p-0">
              {filteredMembers.map((member) => {
                const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : 'N/A';
                return (
                  <div
                    key={member.id}
                    onClick={() => handleSuggestionClick(member)}
                    onMouseEnter={() => onHoverMember(member.id)}
                    onMouseLeave={() => onHoverMember(null)}
                    className="flex items-center p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0"
                  >
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0">
                        <UserIcon className={`w-5 h-5 ${member.gender === 'male' ? 'text-blue-600' : 'text-rose-600'}`} />
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-medium text-sm truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">Born: {birthYear}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
        {!showSuggestions && searchQuery && !filteredMembers.length && (
          <div className="absolute z-40 w-full top-full mt-1 p-4 text-sm text-muted-foreground text-center bg-card border shadow-lg rounded-md">
             No members found. Try a different search.
          </div>
        )}
        {!showSuggestions && !searchQuery && (
           <div className="absolute z-40 w-full top-full mt-1 p-4 text-sm text-muted-foreground text-center bg-card border shadow-lg rounded-md">
             Start typing to search members...
           </div>
        )}
      </div>

      <div className="flex items-center space-x-2 mr-2"> {/* Container for action buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onResetFocus}>
              <RefreshCw className="h-5 w-5" />
              <span className="sr-only">Reset Focus/View</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset Focus/View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            {/* Disable button if already in FullTree viewMode */}
            <Button variant="ghost" size="icon" onClick={() => onSetViewMode('FullTree')} disabled={viewMode === 'FullTree'}>
              <Eye className="h-5 w-5" />
              <span className="sr-only">Show All (Full Tree)</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Show All (Full Tree)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomIn}>
              <ZoomIn className="h-5 w-5" />
              <span className="sr-only">Zoom In</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomOut}>
              <ZoomOut className="h-5 w-5" />
              <span className="sr-only">Zoom Out</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default TopActionBar;
