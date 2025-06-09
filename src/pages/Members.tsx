import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { FamilyMember } from '../types/family';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Users, Calendar, MapPin, Briefcase, Heart, Droplets, Phone, Mail, Search, X } from 'lucide-react'; // Added Users
import { Link } from 'react-router-dom';
import ThemeToggleButton from '../components/ThemeToggleButton';
import { parsePartnerString } from '../lib/stringUtils'; // Import shared function

const Members = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<FamilyMember[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [fetchError, setFetchError] = useState<string | null>(null); 

  const fetchPageMembers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('family_members')
      .select('*'); 

    if (error) {
      console.error('Error fetching members for Members page:', error);
      setFetchError(error.message);
      setMembers([]);
    } else {
      setMembers(data as FamilyMember[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPageMembers();
  }, [fetchPageMembers]);

  // Updated getPartnerDetails to use the robust parser
  const getPartnerDetails = (member: FamilyMember): string[] => {
    return parsePartnerString(member.partners);
  };

  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    return end.getFullYear() - birth.getFullYear();
  };

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

  if (fetchError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 text-red-700 dark:text-red-400 p-4">
        <h2 className="text-2xl font-semibold mb-4">Error Fetching Data</h2>
        <p className="mb-2">There was an issue retrieving the family members list:</p>
        <p className="bg-red-100 dark:bg-red-900/30 p-2 rounded border border-red-300 dark:border-red-700">{fetchError}</p>
        <Button onClick={fetchPageMembers} className="mt-6">Try Again</Button>
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
        {!searchQuery && !isLoading && members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">No members found in the database.</p>
            {/* Optionally, add a button to refresh or add first member */}
          </div>
        )}

        {/* Only render grid if there are members */}
        {members.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMembers.map((member) => {
              const partners = getPartnerDetails(member);
              const age = calculateAge(member.birthDate, member.deathDate);

              const parentDetails = member.parents && member.parents.length > 0
                ? member.parents.map(parentId => {
                    const parent = members.find(m => m.id === parentId);
                    return parent ? parent.name : null;
                  }).filter(name => name !== null) as string[]
                : [];

              return (
                <Card key={member.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-slate-800">
                  <CardHeader className={`pb-4 ${member.gender === 'male' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-rose-500 to-pink-600'} text-white`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 dark:bg-slate-700/30 rounded-full flex items-center justify-center">
                        {member.photo ? (
                          <img 
                            src={member.photo} 
                            alt={member.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <User className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">{member.name}</CardTitle>
                        <p className="text-white/80 text-sm">Generation {member.generation}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4 dark:text-slate-300">
                    <div className="space-y-3">
                      {member.birthDate && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>
                            Born: {new Date(member.birthDate).toLocaleDateString()}
                            {age && ` (${age} years old)`}
                          </span>
                        </div>
                      )}

                      {member.deathDate && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>Died: {new Date(member.deathDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {member.birthPlace && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>{member.birthPlace}</span>
                        </div>
                      )}

                      {member.occupation && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>{member.occupation}</span>
                        </div>
                      )}

                      {member.bloodType && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Droplets className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>Blood Type: {member.bloodType}</span>
                        </div>
                      )}

                      {member.mobileNumber && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>{member.mobileNumber}</span>
                        </div>
                      )}

                      {member.email && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>{member.email}</span>
                        </div>
                      )}

                      {/* Display Parent Names */}
                      {parentDetails.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Users className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>Parents: {parentDetails.join(' & ')}</span>
                        </div>
                      )}

                      {/* Display Co-parent Name */}
                      {member.coParentName && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                          <Users className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
                          <span>Co-parent: {member.coParentName}</span>
                        </div>
                      )}
                    </div>

                    {/* Updated Partner Display */}
                    {partners.length > 0 && ( // partners is now an array of strings (names)
                      <div className="border-t dark:border-slate-700 pt-4">
                        <div className="flex items-center mb-3">
                          <Heart className="w-4 h-4 mr-2 text-red-500" />
                          <span className="font-semibold text-gray-800 dark:text-slate-200">
                            Partner(s)
                          </span>
                        </div>
                        {partners.map((name, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 mb-2 last:mb-0">
                            <div className="font-medium text-gray-800 dark:text-slate-200">{name}</div>
                            {/* Other partner details like occupation, blood type, etc., are removed as they are not available from the string */}
                          </div>
                        ))}
                      </div>
                    )}

                    {member.bio && (
                      <div className="border-t dark:border-slate-700 pt-4">
                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{member.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* This handles "no results for search query" when members *are* present */}
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
