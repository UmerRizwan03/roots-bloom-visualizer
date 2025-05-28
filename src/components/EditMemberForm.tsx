
import React, { useState } from 'react';
import { FamilyMember } from '../types/family';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface EditMemberFormProps {
  member: FamilyMember;
  onSave: (member: FamilyMember) => void;
  onCancel: () => void;
  existingMembers: FamilyMember[]; // Added existingMembers prop
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({ member, onSave, onCancel, existingMembers }) => {
  const [formData, setFormData] = useState<FamilyMember & { parentId?: string; spouseName?: string; otherPartnerNames?: string; coParentName?: string }>({
    ...member,
    // partners: member.partners || [], // Old: Initialize with existing partner IDs
    children: member.children || [], // Ensure children is always an array
    parentId: member.parents && member.parents.length > 0 ? member.parents[0] : '', // Initialize parentId
    spouseName: '', // New: Starts blank for editing session
    otherPartnerNames: '', // New: Starts blank for editing session
    coParentName: member.coParentName || '', // Pre-fill from member.coParentName
  });

  // Filter existingMembers to exclude the current member being edited
  const selectableParents = Array.isArray(existingMembers)
    ? existingMembers.filter(m => m.id !== member.id)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    const { 
      parentId, 
      spouseName, 
      otherPartnerNames,
      coParentName, // Destructure coParentName
      // partners, // Exclude old partners from direct spread if it exists in formData type
      ...memberSpecificFormData 
    } = formData;

    const calculatedPartners = [
      spouseName?.trim(),
      ...(otherPartnerNames?.split(',').map(name => name.trim()) || [])
    ].filter(name => name && name.trim().length > 0);

    const memberToSave: FamilyMember = {
      ...memberSpecificFormData,
      id: member.id, // Ensure original ID is preserved
      parents: parentId ? [parentId] : [],
      partners: calculatedPartners,
      spouse: undefined, // Ensure spouse ID field is cleared/undefined
      coParentName: coParentName?.trim() || undefined, // Add coParentName, trimmed or undefined
      // children are already part of memberSpecificFormData if handled correctly by initial spread
    };

    onSave(memberToSave);
  };

  const handleInputChange = (field: keyof FamilyMember | 'parentId' | 'spouseName' | 'otherPartnerNames' | 'coParentName', value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-emerald-300">Edit Family Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          
          {/* Spouse's Name Input */}
          <div>
            <label htmlFor="spouseName" className="block text-sm font-medium mb-2 dark:text-gray-300">
              Spouse's Name
            </label>
            <Input
              type="text"
              id="spouseName"
              name="spouseName"
              value={formData.spouseName || ''}
              onChange={(e) => handleInputChange('spouseName', e.target.value)}
              placeholder="Spouse's full name"
            />
          </div>

          {/* Other Partner Names Textarea */}
          <div>
            <label htmlFor="otherPartnerNames" className="block text-sm font-medium mb-2 dark:text-gray-300">
              Other Partner Names (comma-separated)
            </label>
            <textarea
              id="otherPartnerNames"
              name="otherPartnerNames"
              rows={3}
              value={formData.otherPartnerNames || ''}
              onChange={(e) => handleInputChange('otherPartnerNames', e.target.value)}
              placeholder="e.g., Partner A, Partner B"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
            />
          </div>

          {/* Single Parent Dropdown */}
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium mb-2 dark:text-gray-300">
              Parent
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId || ''}
              onChange={(e) => handleInputChange('parentId', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
            >
              <option value="">Select a parent (optional)</option>
              {selectableParents.map((potentialParent) => (
                <option key={potentialParent.id} value={potentialParent.id}>
                  {potentialParent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Co-parent's Name Input */}
          <div>
            <label htmlFor="coParentName" className="block text-sm font-medium mb-2 dark:text-gray-300">
              Co-parent's name (if different from spouse/partner)
            </label>
            <Input
              type="text"
              id="coParentName"
              name="coParentName"
              value={formData.coParentName || ''}
              onChange={(e) => handleInputChange('coParentName', e.target.value)}
              placeholder="Enter co-parent's name"
            />
          </div>

          {/* Children (comma-separated IDs) input field removed */}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Generation</label>
              <Input
                type="number"
                value={formData.generation}
                onChange={(e) => handleInputChange('generation', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Blood Type</label>
              <select
                value={formData.bloodType || ''}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
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
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Birth Date</label>
              <Input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Death Date</label>
              <Input
                type="date"
                value={formData.deathDate || ''}
                onChange={(e) => handleInputChange('deathDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Mobile Number</label>
              <Input
                value={formData.mobileNumber || ''}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                placeholder="+1-555-0123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Email Address</label>
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
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Birth Place</label>
              <Input
                value={formData.birthPlace || ''}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                placeholder="City, State/Country"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Occupation</label>
              <Input
                value={formData.occupation || ''}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Job title"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Biography</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Brief biography..."
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Photo URL</label>
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
