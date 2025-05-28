
import React, { useState } from 'react';
import { FamilyMember } from '../types/family';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface EditMemberFormProps {
  member: FamilyMember;
  onSave: (member: FamilyMember) => void;
  onCancel: () => void;
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({ member, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FamilyMember>({
    ...member,
    partners: member.partners || [], // Ensure partners is always an array
    parents: member.parents || [], // Ensure parents is always an array
    children: member.children || [], // Ensure children is always an array
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    // Ensure partners is an array of strings, splitting by comma if it's a string
    const updatedFormData = {
      ...formData,
      partners: Array.isArray(formData.partners)
        ? formData.partners
        : (typeof formData.partners === 'string'
          ? String(formData.partners).split(',').map(p => p.trim()).filter(p => p)
          : []), // Fallback to empty array if not string or array
      parents: Array.isArray(formData.parents)
        ? formData.parents
        : (typeof formData.parents === 'string'
          ? String(formData.parents).split(',').map(p => p.trim()).filter(p => p)
          : []), // Fallback to empty array if not string or array
      children: Array.isArray(formData.children)
        ? formData.children
        : (typeof formData.children === 'string'
          ? String(formData.children).split(',').map(p => p.trim()).filter(p => p)
          : []), // Fallback to empty array if not string or array
    };

    onSave(updatedFormData);
  };

  const handleInputChange = (field: keyof FamilyMember, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Family Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                value={formData.name}
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

          {/* New input field for Partners */}
          <div>
            <label className="block text-sm font-medium mb-2">Partners (comma-separated IDs)</label>
            <textarea
              value={Array.isArray(formData.partners) ? formData.partners.join(', ') : ''}
              onChange={(e) => handleInputChange('partners', e.target.value)}
              placeholder="e.g., partner1_id, partner2_id"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          {/* New input field for Parents */}
          <div>
            <label className="block text-sm font-medium mb-2">Parents (comma-separated IDs)</label>
            <textarea
              value={Array.isArray(formData.parents) ? formData.parents.join(', ') : ''}
              onChange={(e) => handleInputChange('parents', e.target.value)}
              placeholder="e.g., parent1_id, parent2_id"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          {/* New input field for Children */}
          <div>
            <label className="block text-sm font-medium mb-2">Children (comma-separated IDs)</label>
            <textarea
              value={Array.isArray(formData.children) ? formData.children.join(', ') : ''}
              onChange={(e) => handleInputChange('children', e.target.value)}
              placeholder="e.g., child1_id, child2_id"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Generation</label>
              <Input
                type="number"
                value={formData.generation}
                onChange={(e) => handleInputChange('generation', parseInt(e.target.value))}
                min="1"
                max="10"
              />
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberForm;
