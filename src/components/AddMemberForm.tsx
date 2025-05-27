import React, { useState } from 'react';
import { FamilyMember } from '../types/family';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface AddMemberFormProps {
  onAdd: (member: FamilyMember) => void;
  onCancel: () => void;
  existingMembers: FamilyMember[];
  defaultGeneration?: number | null;
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onAdd, onCancel, existingMembers, defaultGeneration }) => {
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    name: '',
    gender: 'male',
    generation: defaultGeneration || 1,
    birthPlace: '',
    occupation: '',
    bio: '',
    bloodType: '',
    mobileNumber: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    const newMember: FamilyMember = {
      id: `member-${Date.now()}`,
      name: formData.name,
      gender: formData.gender as 'male' | 'female',
      generation: formData.generation || 1,
      birthDate: formData.birthDate,
      deathDate: formData.deathDate,
      birthPlace: formData.birthPlace,
      occupation: formData.occupation,
      bio: formData.bio,
      photo: formData.photo,
      parents: formData.parents,
      children: formData.children,
      spouse: formData.spouse,
      partners: formData.partners,
      bloodType: formData.bloodType,
      mobileNumber: formData.mobileNumber,
      email: formData.email,
    };

    onAdd(newMember);
  };

  const handleInputChange = (field: keyof FamilyMember, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-800">
            Add New Family Member
            {defaultGeneration && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                to Generation {defaultGeneration}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Generation</label>
              <Input
                type="number"
                value={formData.generation || 1}
                onChange={(e) => handleInputChange('generation', parseInt(e.target.value))}
                min="1"
                max="10"
                disabled={!!defaultGeneration}
                className={defaultGeneration ? "bg-gray-50" : ""}
              />
              {defaultGeneration && (
                <p className="text-xs text-gray-500 mt-1">
                  Generation is set based on your selection
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Blood Type</label>
              <select
                value={formData.bloodType || ''}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select blood type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Birth Date</label>
              <Input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Death Date</label>
              <Input
                type="date"
                value={formData.deathDate || ''}
                onChange={(e) => handleInputChange('deathDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mobile Number</label>
              <Input
                value={formData.mobileNumber || ''}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                placeholder="+1-555-0123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Birth Place</label>
              <Input
                value={formData.birthPlace || ''}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                placeholder="City, State/Country"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Occupation</label>
              <Input
                value={formData.occupation || ''}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Job title"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Biography</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Brief biography..."
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Photo URL</label>
            <Input
              value={formData.photo || ''}
              onChange={(e) => handleInputChange('photo', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberForm;
