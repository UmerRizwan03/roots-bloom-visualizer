import React, { useState, useEffect, useMemo } from 'react'; // Ensure useState is imported
import { FamilyMember } from '../types/family';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AddMemberFormProps {
  onAdd: (memberData: Partial<FamilyMember>) => Promise<void>; // Changed to reflect async nature
  onCancel: () => void;
  existingMembers: FamilyMember[];
  defaultGeneration?: number | null;
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onAdd, onCancel, existingMembers, defaultGeneration }) => {
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    id: '',
    name: '',
    gender: 'male',
    generation: defaultGeneration || undefined, // Initialize as undefined to be set by useEffect
    birthPlace: '',
    occupation: '',
    bio: '',
    bloodType: '',
    mobileNumber: '',
    email: '',
    partners: [], // Initialize partners as an empty array
  });
  const [generationHintMembers, setGenerationHintMembers] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const availableGenerations = useMemo(() => {
    const existingGens = new Set(existingMembers.map(m => m.generation));
    let maxGen = 1;
    if (existingMembers.length > 0) {
      maxGen = Math.max(...Array.from(existingGens));
    }
    // Generate generations from 1 up to maxGen + 2 (to allow adding to next few generations)
    const allGens = Array.from({ length: maxGen + 2 }, (_, i) => i + 1);
    return allGens.sort((a, b) => a - b);
  }, [existingMembers]);

  useEffect(() => {
    // If defaultGeneration is provided, use it. Otherwise, default to the first available generation (which will be 1).
    if (defaultGeneration !== undefined && defaultGeneration !== null) {
      handleInputChange('generation', defaultGeneration);
    } else if (formData.generation === undefined) {
      handleInputChange('generation', availableGenerations[0] || 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableGenerations, defaultGeneration]); // Dependencies are correct, want to run when these change

  const handleGenerationChange = (value: string) => {
      const genNumber = parseInt(value, 10);
      handleInputChange('generation', genNumber);

      const membersInGeneration = existingMembers
          .filter(m => m.generation === genNumber)
          .slice(0, 5) // Get first 5 members for the hint
          .map(m => m.name);
      setGenerationHintMembers(membersInGeneration);
  };

  useEffect(() => {
      if (formData.generation) {
          const membersInGeneration = existingMembers
              .filter(m => m.generation === formData.generation)
              .slice(0, 5)
              .map(m => m.name);
          setGenerationHintMembers(membersInGeneration);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.generation, existingMembers]); // Re-run if generation or existingMembers change

  const handleSubmit = async (e: React.FormEvent) => { // Make handleSubmit async
    e.preventDefault();
    setFormError(null); // Clear previous errors at the start

    if (!formData.name?.trim()) {
      setFormError("Name is required.");
      return;
    }

    // Ensure generation is set, default to 1 if not provided or invalid.
    // The problem description mentions defaultGeneration from props, let's use that.
    // If defaultGeneration is null/undefined, or formData.generation is not a positive number,
    // we might need a more robust fallback, but the original code used availableGenerations[0] or 1.
    // For now, sticking to the logic provided in the task for generation.
    const generation = formData.generation && formData.generation > 0 
      ? formData.generation 
      : (defaultGeneration || 1); // Use defaultGeneration from props or fallback to 1

    const memberData: Partial<FamilyMember> = {
      ...formData,
      id: new Date().getTime().toString(), // Or use uuid if available and preferred
      generation: generation,
      // Ensure relational fields are arrays of strings, even if empty
      // The original code had a more complex way to handle string to array conversion
      // We'll keep that logic as it was more robust for user input.
      partners: typeof formData.partners === 'string'
        ? (formData.partners as string).split(',').map(p => p.trim()).filter(p => p)
        : formData.partners || [],
      parents: typeof formData.parents === 'string'
        ? (formData.parents as string).split(',').map(p => p.trim()).filter(p => p)
        : formData.parents || [],
      children: typeof formData.children === 'string'
        ? (formData.children as string).split(',').map(p => p.trim()).filter(p => p)
        : formData.children || [],
    };

    try {
      await onAdd(memberData); // onAdd prop will now be an async function that can throw
      // Parent (Index.tsx) is responsible for closing the modal on success.
    } catch (err: any) {
      // Display the error message from the parent or a generic one
      setFormError(err.message || "Failed to add member. Please try again.");
    }
  };

  const handleInputChange = (field: keyof FamilyMember, value: any) => {
    setFormError(null); // Clear error when user starts typing
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Removed generateId as id is now new Date().getTime().toString() or handled by parent
  // const generateId = (name: string) => {
  // return `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  // };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onCancel();
        setFormError(null); // Clear error when dialog is closed
      }
    }}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-800">
            Add New Family Member
          </DialogTitle>
          <p id="dialog-description" className="sr-only">
            Form to add a new family member to the family tree
          </p>
        </DialogHeader>

        {formError && (
          <div className="my-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
  };

              <Input
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Full name"
                // Removed 'required' here as we handle it in handleSubmit for better error message control
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
              value={Array.isArray(formData.partners) ? formData.partners.join(', ') : typeof formData.partners === 'string' ? formData.partners : ''}
              onChange={(e) => handleInputChange('partners', e.target.value)}
              placeholder="e.g., partner1_id, partner2_id"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          {/* New input field for Parents */}
          <div>
            <label className="block text-sm font-medium mb-2">Parents (comma-separated IDs)</label>
            <textarea
              value={Array.isArray(formData.parents) ? formData.parents.join(', ') : typeof formData.parents === 'string' ? formData.parents : ''}
              onChange={(e) => handleInputChange('parents', e.target.value)}
              placeholder="e.g., parent1_id, parent2_id"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          {/* New input field for Children */}
          <div>
            <label className="block text-sm font-medium mb-2">Children (comma-separated IDs)</label>
            <textarea
              value={Array.isArray(formData.children) ? formData.children.join(', ') : typeof formData.children === 'string' ? formData.children : ''}
              onChange={(e) => handleInputChange('children', e.target.value)}
              placeholder="e.g., child1_id, child2_id"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="generation-select" className="block text-sm font-medium mb-2">Generation</label>
              <Select
                value={String(formData.generation || '')}
                onValueChange={handleGenerationChange}
              >
                <SelectTrigger id="generation-select" className="w-full">
                  <SelectValue placeholder="Select generation" />
                </SelectTrigger>
                <SelectContent>
                  {availableGenerations.map(gen => (
                    <SelectItem key={gen} value={String(gen)}>
                      Generation {gen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {generationHintMembers.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Includes: {generationHintMembers.join(', ')}
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
                placeholder="e.g., +1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="e.g., example@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Birth Place</label>
            <Input
              value={formData.birthPlace || ''}
              onChange={(e) => handleInputChange('birthPlace', e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Occupation</label>
            <Input
              value={formData.occupation || ''}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              placeholder="e.g., Engineer, Artist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="A short biography..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => {
              onCancel();
              setFormError(null); // Clear error when cancelling
            }}>
              Cancel
            </Button>
            <Button type="submit">
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberForm;
              <Input
