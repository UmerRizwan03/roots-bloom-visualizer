
import React from 'react';
import { X, Calendar, MapPin, Briefcase, Heart, Users, User } from 'lucide-react';
import { FamilyMember } from '../types/family';
import { familyMembers } from '../data/familyData';

interface MemberModalProps {
  member: FamilyMember;
  onClose: () => void;
}

const MemberModal: React.FC<MemberModalProps> = ({ member, onClose }) => {
  // Get related family members
  const parents = member.parents?.map(id => familyMembers.find(m => m.id === id)).filter(Boolean) || [];
  const children = member.children?.map(id => familyMembers.find(m => m.id === id)).filter(Boolean) || [];
  const spouse = member.spouse ? familyMembers.find(m => m.id === member.spouse) : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = () => {
    if (!member.birthDate) return null;
    const birth = new Date(member.birthDate);
    const end = member.deathDate ? new Date(member.deathDate) : new Date();
    return end.getFullYear() - birth.getFullYear();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`
          relative p-6 rounded-t-2xl
          ${member.gender === 'male' 
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
              {member.photo ? (
                <img 
                  src={member.photo} 
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{member.name}</h2>
              {calculateAge() && (
                <p className="text-lg opacity-90">
                  {calculateAge()} years old {member.deathDate && '(deceased)'}
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
                  <p>{formatDate(member.birthDate)}</p>
                </div>
              </div>
              
              {member.deathDate && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Died</p>
                    <p>{formatDate(member.deathDate)}</p>
                  </div>
                </div>
              )}
              
              {member.birthPlace && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Birthplace</p>
                    <p>{member.birthPlace}</p>
                  </div>
                </div>
              )}
              
              {member.occupation && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Briefcase className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Occupation</p>
                    <p>{member.occupation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Family Relationships */}
            <div className="space-y-4">
              {spouse && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Heart className="h-5 w-5" />
                    <p className="font-medium">Spouse</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium">{spouse.name}</p>
                  </div>
                </div>
              )}

              {parents.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Users className="h-5 w-5" />
                    <p className="font-medium">Parents</p>
                  </div>
                  <div className="space-y-2">
                    {parents.map((parent) => (
                      <div key={parent?.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{parent?.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {children.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Users className="h-5 w-5" />
                    <p className="font-medium">Children</p>
                  </div>
                  <div className="space-y-2">
                    {children.map((child) => (
                      <div key={child?.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{child?.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Biography */}
          {member.bio && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Biography</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{member.bio}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg 
                       hover:bg-emerald-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberModal;
