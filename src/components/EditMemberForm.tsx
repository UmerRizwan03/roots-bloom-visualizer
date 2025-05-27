
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
  const [formData, setFormData] = useState<FamilyMember>(member);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: keyof FamilyMember, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <label className="block text-sm font-medium mb-2">Birth Date</label>
              <Input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Death Date</label>
            <Input
              type="date"
              value={formData.deathDate || ''}
              onChange={(e) => handleInputChange('deathDate', e.target.value)}
            />
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
