import React, { useState } from 'react';
import { familyMembers } from '../data/familyData';
import { FamilyMember } from '../types/family';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Calendar, MapPin, Briefcase, Heart, Droplets, Phone, Mail, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggleButton from '../components/ThemeToggleButton';

const Members = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const getPartnerDetails = (member: FamilyMember) => {
    const partners: FamilyMember[] = [];
    
    if (member.spouse) {
      const spouse = familyMembers.find(m => m.id === member.spouse);
      if (spouse) partners.push(spouse);
    }
    
    if (member.partners) {
      member.partners.forEach(partnerId => {
        const partner = familyMembers.find(m => m.id === partnerId);
        if (partner) partners.push(partner);
      });
    }
    
    return partners;
  };

  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    return end.getFullYear() - birth.getFullYear();
  };

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.birthPlace?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 py-8">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-slate-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">FamilyRoots</span>
            </Link>
            <div className="flex items-center"> {/* Added div for alignment */}
              <nav className="hidden md:flex space-x-8 mr-4"> {/* Added mr-4 for spacing */}
                <Link to="/" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
                <Link to="/members" className="text-emerald-600 dark:text-emerald-400 font-medium">Members</Link>
                <Link to="/magazines" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">E-Magazines</Link>
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
          
          {/* Search Bar */}
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
            
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 
                              rounded-lg shadow-lg z-10 p-2">
                <div className="text-sm text-gray-600 dark:text-slate-300">
                  Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} matching: <span className="font-semibold text-emerald-600 dark:text-emerald-400">"{searchQuery}"</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMembers.map((member) => {
            const partners = getPartnerDetails(member);
            const age = calculateAge(member.birthDate, member.deathDate);

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
                  {/* Basic Info */}
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
                  </div>

                  {/* Partners */}
                  {partners.length > 0 && (
                    <div className="border-t dark:border-slate-700 pt-4">
                      <div className="flex items-center mb-3">
                        <Heart className="w-4 h-4 mr-2 text-red-500" />
                        <span className="font-semibold text-gray-800 dark:text-slate-200">
                          {partners.length === 1 ? 'Partner' : 'Partners'}
                        </span>
                      </div>
                      {partners.map((partner) => (
                        <div key={partner.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 mb-2 last:mb-0">
                          <div className="font-medium text-gray-800 dark:text-slate-200">{partner.name}</div>
                          <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
                            {partner.occupation && (
                              <div className="flex items-center">
                                <Briefcase className="w-3 h-3 mr-1 text-gray-400 dark:text-slate-500" />
                                <span>{partner.occupation}</span>
                              </div>
                            )}
                            {partner.bloodType && (
                              <div className="flex items-center">
                                <Droplets className="w-3 h-3 mr-1 text-gray-400 dark:text-slate-500" />
                                <span>Blood Type: {partner.bloodType}</span>
                              </div>
                            )}
                            {partner.mobileNumber && (
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1 text-gray-400 dark:text-slate-500" />
                                <span>{partner.mobileNumber}</span>
                              </div>
                            )}
                            {partner.email && (
                              <div className="flex items-center">
                                <Mail className="w-3 h-3 mr-1 text-gray-400 dark:text-slate-500" />
                                <span>{partner.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bio */}
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

        {filteredMembers.length === 0 && searchQuery && (
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
