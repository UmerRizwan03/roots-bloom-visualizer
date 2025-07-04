
import React, { useEffect, useState, useMemo } from 'react';
import { X, Calendar, MapPin, Briefcase, Heart, Users, User, Mail, Phone, Droplets, BarChart3, PersonStanding } from 'lucide-react';
import { FamilyMember } from '../types/family';
import { supabase } from '../lib/supabaseClient';
import { parsePartnerString } from '../lib/stringUtils';

import { useAuth } from '../contexts/AuthContext'; // Import useAuth

interface MemberModalProps {
  member: FamilyMember;
  onClose: () => void;
  onEditRequest: (member: FamilyMember) => void; // Added onEditRequest
  // canEdit: boolean; // Removed canEdit prop, will use useAuth directly
}

const MemberModal: React.FC<MemberModalProps> = ({
  member: initialMember,
  onClose,
  onEditRequest // Added onEditRequest
  // canEdit // Removed canEdit prop
}) => {
  const { user, loading: authLoading } = useAuth(); // Use AuthContext
  // For actual role-based admin check, you might inspect user.app_metadata.roles or similar
  // For this example, we'll consider any logged-in user as having edit rights for simplicity.
  // Ensure authLoading is false before relying on user state for initial render decisions.
  const isAdmin = !authLoading && !!user;


  const [detailedMember, setDetailedMember] = useState<FamilyMember | null>(null);
  const [parentNames, setParentNames] = useState<string[]>([]);
  const [childrenNames, setChildrenNames] = useState<string[]>([]);
  // Removed spouseName and partnerNames state variables
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Process detailedMember.partners string using the helper and useMemo - MOVED HERE
  const currentPartnerNames = useMemo(() => parsePartnerString(detailedMember?.partners), [detailedMember?.partners]);

  // Removed fetchNameById as it was only for spouse

  const fetchNamesByIds = async (ids: string[]): Promise<string[]> => {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('family_members')
      .select('id, name')
      .in('id', ids);
    if (error) {
      console.error(`Error fetching names for IDs ${ids.join(',')}:`, error);
      return [];
    }
    // Preserve order of IDs if necessary, though for display, order might not be critical
    // For now, just return the names found.
    return data?.map(m => m.name).filter(Boolean) as string[] || [];
  };

  useEffect(() => {
    const fetchModalData = async () => {
      if (!initialMember?.id) {
        setIsLoading(false);
        setDetailedMember(null);
        return;
      }

      setIsLoading(true);
      setDetailedMember(null); // Clear previous member details
      setParentNames([]);
      setChildrenNames([]);
      // Removed setSpouseName(null) and setPartnerNames([])

      try {
        // Fetch main member details
        const { data: memberData, error: memberError } = await supabase
          .from('family_members')
          .select('*')
          .eq('id', initialMember.id)
          .single();

        if (memberError) {
          console.error('Error fetching detailed member data:', memberError);
          setDetailedMember(null);
          setIsLoading(false);
          return;
        }

        setDetailedMember(memberData);

        if (memberData) {
          // Fetch parents
          if (memberData.parents && memberData.parents.length > 0) {
            const fetchedParentNames = await fetchNamesByIds(memberData.parents);
            setParentNames(fetchedParentNames);
          }

          // Fetch children
          if (memberData.children && memberData.children.length > 0) {
            const fetchedChildrenNames = await fetchNamesByIds(memberData.children);
            setChildrenNames(fetchedChildrenNames);
          }

          // Spouse and old partners array fetching removed
          // The new memberData.partners is a string and needs no special fetching here
        }
      } catch (error) {
        console.error('Error in fetchModalData:', error);
        setDetailedMember(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModalData();
  }, [initialMember?.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = () => {
    if (!detailedMember?.birthDate) return null;
    const birth = new Date(detailedMember.birthDate);
    const end = detailedMember.deathDate ? new Date(detailedMember.deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    // Adjust age if birthday hasn't occurred yet this year
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
        return age -1;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
          <p className="text-center text-xl">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!detailedMember) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-center">
          <p className="text-xl mb-4">Member details not available.</p>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55] p-4"> {/* Changed z-50 to z-[55] */}
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`
          relative p-6 rounded-t-2xl
          ${detailedMember.gender === 'male'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
            : 'bg-gradient-to-r from-pink-500 to-pink-600'
          }
        `}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-4 text-white">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {detailedMember.photo ? (
                <img 
                  src={detailedMember.photo}
                  alt={detailedMember.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{detailedMember.name}</h2>
              {calculateAge() !== null && (
                <p className="text-lg opacity-90">
                  {calculateAge()} years old {detailedMember.deathDate && '(deceased)'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <div>
                  <p className="font-medium">Born</p>
                  <p>{formatDate(detailedMember.birthDate)}</p>
                </div>
              </div>
              
              {detailedMember.deathDate && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Died</p>
                    <p>{formatDate(detailedMember.deathDate)}</p>
                  </div>
                </div>
              )}
              
              {detailedMember.birthPlace && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Birthplace</p>
                    <p>{detailedMember.birthPlace}</p>
                  </div>
                </div>
              )}
              
              {detailedMember.occupation && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Briefcase className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Occupation</p>
                    <p>{detailedMember.occupation}</p>
                  </div>
                </div>
              )}
              {detailedMember.gender && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <PersonStanding className={`h-5 w-5 ${detailedMember.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`} />
                  <div>
                    <p className="font-medium">Gender</p>
                    <p className="capitalize">{detailedMember.gender}</p>
                  </div>
                </div>
              )}
              {detailedMember.generation && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <BarChart3 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Generation</p>
                    <p>{detailedMember.generation}</p>
                  </div>
                </div>
              )}
              {detailedMember.mobileNumber && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Mobile</p>
                    <p>{detailedMember.mobileNumber}</p>
                  </div>
                </div>
              )}
              {detailedMember.email && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p><a href={`mailto:${detailedMember.email}`} className="text-blue-600 hover:underline">{detailedMember.email}</a></p>
                  </div>
                </div>
              )}
              {detailedMember.bloodType && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Droplets className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Blood Type</p>
                    <p>{detailedMember.bloodType}</p>
                  </div>
                </div>
              )}
              {detailedMember.coParentName && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-5 w-5" /> 
                  <div>
                    <p className="font-medium">Co-parent Name</p>
                    <p>{detailedMember.coParentName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Family Relationships */}
            <div className="space-y-4">
              {/* New Partner(s) Display */}
              {currentPartnerNames.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Heart className="h-5 w-5" />
                    <p className="font-medium">Partner(s)</p>
                  </div>
                  <div className="space-y-2">
                    {currentPartnerNames.map((name, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parentNames.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Users className="h-5 w-5" />
                    <p className="font-medium">Parents</p>
                  </div>
                  <div className="space-y-2">
                    {parentNames.map((name, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {childrenNames.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Users className="h-5 w-5" /> {/* Consider a different icon for children if desired, e.g. UserPlus */}
                    <p className="font-medium">Children</p>
                  </div>
                  <div className="space-y-2">
                    {childrenNames.map((name, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Biography */}
          {detailedMember.bio && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Biography</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{detailedMember.bio}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 rounded-b-2xl flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-500 text-white py-2.5 px-4 rounded-lg
                       hover:bg-slate-600 transition-colors font-medium text-sm"
          >
            Close
          </button>
          {isAdmin && detailedMember && (
            <button
              onClick={() => {
                onEditRequest(detailedMember);
                onClose(); // Close detail modal to open edit modal
              }}
              className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-lg
                         hover:bg-blue-600 transition-colors font-medium text-sm"
            >
              Edit Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberModal;
