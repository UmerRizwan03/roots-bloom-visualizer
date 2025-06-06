import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { supabase } from '../lib/supabaseClient';
import { FamilyMember } from '../types/family';
import { toast } from 'sonner'; // Added toast import for sonner
import { useQuery } from '@tanstack/react-query';
import { calculateAge } from '../lib/utils'; // Import calculateAge
// Card components and some icons are no longer directly used here
import { Search, X } from 'lucide-react'; // Keep Search and X
import { Link } from 'react-router-dom';
import ThemeToggleButton from '../components/ThemeToggleButton';
import MemberCard from '../components/MemberCard'; // Import MemberCard

const Members = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async (): Promise<FamilyMember[]> => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*');

    if (error) {
      console.error('Error fetching members for Members page:', error);
      throw new Error(error.message);
    }
    return data as FamilyMember[];
  };

  const {
    data: members = [],
    isLoading,
    isError,
    error
  } = useQuery<FamilyMember[], Error>({
    queryKey: ['members'],
    queryFn: fetchMembers,
    // react-query default staleTime is 0, so it refetches on window focus, etc.
    // Adding a specific retry or refetch button could be done via queryClient.refetch or the refetch function from useQuery
  });

  useEffect(() => {
    if (isError && error) {
      // Ensure error is an instance of Error to access message property safely
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to load members: ${errorMessage}`, {
        duration: 5000, // Show toast for 5 seconds
        // description: "You might want to try refreshing the page.", // Optional description
      });
    }
  }, [isError, error]);

  const getPartnerDetails = useCallback((member: FamilyMember) => {
    const partners: FamilyMember[] = [];
    // members is initialized to [] by useQuery, so it should always be an array.
    // No need for !members check if using default value in useQuery's destructuring.
    if (member.spouse) {
      const spouse = members.find(m => m.id === member.spouse);
      if (spouse) partners.push(spouse);
    }
    if (member.partners) {
      member.partners.forEach(partnerId => {
        const partner = members.find(m => m.id === partnerId);
        if (partner) partners.push(partner);
      });
    }
    return partners;
  }, [members]); // Add members as a dependency for useCallback

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.birthPlace?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 text-gray-700 dark:text-slate-300">
        Loading members...
      </div>
    );
  }

  if (isError) { // Removed 'error' from condition as useEffect handles the specific error message
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 text-red-700 dark:text-red-400 p-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">Failed to Load Family Members</h2>
        <p className="mb-2">
          We encountered an issue trying to retrieve the family members list.
          Please try refreshing the page or check your internet connection.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          If the problem persists, please try again later.
        </p>
        {/* Displaying specific error details can be done here for developers if needed, or rely on toast/console */}
        {process.env.NODE_ENV === 'development' && error && (
          <p className="mt-3 bg-red-100 dark:bg-red-900/30 p-2 rounded border border-red-300 dark:border-red-700 text-xs">
            <strong>Developer Info:</strong> {error instanceof Error ? error.message : String(error)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 py-8">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-slate-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Unity Valiyangadi</span>
            </Link>
            <div className="flex items-center"> 
              <nav className="hidden md:flex space-x-8 mr-4"> 
                <Link to="/" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
                <Link to="/members" className="text-emerald-600 dark:text-emerald-400 font-medium">Members</Link>
                <Link to="/magazines" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Magazines</Link>
              </nav>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">Family Members</h1>
          <p className="text-xl text-gray-600 dark:text-slate-300 mb-6">Meet all our wonderful family members</p>
          
          <div className="max-w-md mx-auto relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search family members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                           dark:focus:ring-emerald-600 dark:focus:border-emerald-600
                           transition-colors bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-gray-400 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 
                             h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {searchQuery && members.length > 0 && ( // Only show search count if there are members to search from
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 
                              rounded-lg shadow-lg z-10 p-2">
                <div className="text-sm text-gray-600 dark:text-slate-300">
                  Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} matching: <span className="font-semibold text-emerald-600 dark:text-emerald-400">"{searchQuery}"</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conditional rendering for "No members in database" */}
        {/* members is initialized to [], so members.length can be checked directly */}
        {!searchQuery && !isLoading && members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">No members found in the database.</p>
            {/* Optionally, add a button to refresh or add first member */}
          </div>
        )}

        {/* Only render grid if there are members */}
        {/* members is initialized to [], so members.length can be checked directly */}
        {members.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMembers.map((member) => {
              const partners = getPartnerDetails(member);
              const age = calculateAge(member.birthDate, member.deathDate);

              return (
                <MemberCard
                  key={member.id}
                  member={member}
                  partners={partners}
                  age={age}
                />
              );
            })}
          </div>
        )}
        
        {/* This handles "no results for search query" when members *are* present */}
        {/* members is initialized to [], so members.length can be checked directly */}
        {members.length > 0 && filteredMembers.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">No family members found matching "{searchQuery}"</p>
            <button 
              onClick={clearSearch}
              className="mt-4 text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
