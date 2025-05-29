import React from 'react';
import { FamilyMember } from '../types/family';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area'; // For scrollable list

interface SidebarProps {
  members: FamilyMember[];
  onMemberSelect: (memberId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  members,
  onMemberSelect,
  searchQuery,
  onSearchQueryChange,
}) => {
  const filteredMembers = searchQuery
    ? members.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <Card className="w-full h-full flex flex-col"> {/* Ensure Card takes full height and is flex column */}
      <CardHeader className="pb-2 pt-4"> {/* Adjusted padding */}
        <CardTitle className="text-lg">Search Members</CardTitle> {/* Slightly smaller title */}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden p-4"> {/* Allow content to grow and manage overflow */}
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
              <div className="space-y-1 pr-2"> {/* Add a little padding for scrollbar */}
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => onMemberSelect(member.id)}
                    className="p-2.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md transition-colors"
                  >
                    {member.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No members found matching your search.
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
