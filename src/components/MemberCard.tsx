import React from 'react';
import { FamilyMember } from '../types/family';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'; // Adjusted path
import { User, Calendar, MapPin, Briefcase, Heart, Droplets, Phone, Mail } from 'lucide-react';

interface MemberCardProps {
  /** The family member object to display. */
  member: FamilyMember;
  /** An array of partner details for the member. Derived in the parent component. */
  partners: FamilyMember[];
  /** The calculated age of the member. Calculated in the parent component. */
  age: number | null;
}

/**
 * `MemberCard` is a React functional component that displays detailed information
 * about a single family member in a card format. This includes their personal details,
 * occupation, contact information, partners, and biography.
 *
 * @param {MemberCardProps} props - The props for the component.
 * @param {FamilyMember} props.member - The core data for the family member to be displayed.
 * @param {FamilyMember[]} props.partners - An array of family member objects representing the partners of this member.
 * @param {number | null} props.age - The calculated age of the member.
 * @returns {JSX.Element} A card element displaying the family member's information.
 */
const MemberCard: React.FC<MemberCardProps> = ({ member, partners, age }) => {
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
                {age !== null && ` (${age} years old)`}
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

        {member.bio && (
          <div className="border-t dark:border-slate-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{member.bio}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCard;
