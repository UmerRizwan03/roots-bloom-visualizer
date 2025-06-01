import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Ensure useCallback is imported
import { FamilyMember } from '../types/family';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogTrigger 
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { cn } from "@/lib/utils"; // Import cn

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
    // partners: [], // Removed, will be constructed from spouseName and otherPartnerNames
    parentId: '', // New state for single Parent dropdown
    spouseName: '', // New state for Spouse's Name
    otherPartnerNames: '', // New state for Other Partner Names
    coParentName: '', // New state for Co-parent's Name
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null); // State for profile picture
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
    let initialGenerationToSet: number | undefined = undefined;

    if (defaultGeneration !== undefined && defaultGeneration !== null) {
      if (availableGenerations.includes(defaultGeneration)) {
        initialGenerationToSet = defaultGeneration;
      } else {
        console.warn(`Provided defaultGeneration (${defaultGeneration}) is not valid or available. Defaulting to first available generation.`);
        if (availableGenerations.length > 0) {
          initialGenerationToSet = availableGenerations[0];
        } else {
          initialGenerationToSet = 1; // Absolute fallback
        }
      }
    } else if (formData.generation === undefined) {
      if (availableGenerations.length > 0) {
        initialGenerationToSet = availableGenerations[0];
      } else {
        initialGenerationToSet = 1; // Absolute fallback
      }
    }

    if (initialGenerationToSet !== undefined) {
      if (formData.generation !== initialGenerationToSet) {
         handleInputChange('generation', initialGenerationToSet);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableGenerations, defaultGeneration, formData.generation]); // Updated dependencies

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

  const handleInputChange = (field: keyof FamilyMember | 'parentId' | 'spouseName' | 'otherPartnerNames' | 'coParentName', value: any) => {
    setFormError(null); // Clear error when user starts typing
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Memoized event handlers
  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('name', event.target.value);
  }, []);

  const handleGenderChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange('gender', event.target.value);
  }, []);

  const handleSpouseNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('spouseName' as any, event.target.value);
  }, []);

  const handleOtherPartnerNamesChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange('otherPartnerNames' as any, event.target.value);
  }, []);

  const handleParentChange = useCallback((newParentId: string) => {
    setFormError(null); // Clear errors on interaction

    if (newParentId) {
      const selectedParent = existingMembers.find(member => member.id === newParentId);
      if (selectedParent && typeof selectedParent.generation === 'number') {
        const childGeneration = selectedParent.generation + 1;
        // Update both parentId and generation
        setFormData(prev => ({
          ...prev,
          parentId: newParentId,
          generation: childGeneration
        }));
      } else {
        // Parent not found, or parent has no generation number.
        // Only update parentId. User will need to set generation manually.
        setFormData(prev => ({ ...prev, parentId: newParentId }));
      }
    } else {
      // No parent selected (newParentId is an empty string, e.g. placeholder selected)
      // Only update parentId. User will manually set generation or it defaults.
      setFormData(prev => ({ ...prev, parentId: newParentId }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMembers]); // existingMembers is a dependency. 
                         // setFormError and setFormData are stable.

  const handleCoParentNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('coParentName', event.target.value);
  }, []);
  
  const handleBloodTypeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange('bloodType', event.target.value);
  }, []);

  const handleBirthDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('birthDate', event.target.value);
  }, []);
  
  const handleDeathDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('deathDate', event.target.value);
  }, []);

  const handleMobileNumberChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('mobileNumber', event.target.value);
  }, []);

  const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('email', event.target.value);
  }, []);
  
  const handleBirthPlaceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('birthPlace', event.target.value);
  }, []);

  const handleOccupationChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('occupation', event.target.value);
  }, []);

  const handleBioChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange('bio', event.target.value);
  }, []);

  // Memoize parent options
  const parentOptions = useMemo(() => {
    if (!Array.isArray(existingMembers)) {
      console.warn("existingMembers is not an array in AddMemberForm. Skipping parent options generation.");
      return [];
    }
    return existingMembers.map((member) => (
      <SelectItem key={member.id} value={member.id}>
        {member.name}
      </SelectItem>
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMembers]);

  const handleSubmit = async (e: React.FormEvent) => { // Make handleSubmit async
    e.preventDefault();
    setFormError(null); // Clear previous errors at the start

    if (!formData.name?.trim()) {
      setFormError("Name is required.");
      return;
    }

    let photoUrl: string | undefined = undefined; // Initialize photoUrl

    if (profilePictureFile) {
      const fileName = `${Date.now()}-${profilePictureFile.name}`;
      const filePath = `public/${fileName}`; // Path within the bucket

      try {
        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('family-member-images') // Your specified bucket name
          .upload(filePath, profilePictureFile, {
            cacheControl: '3600', // Optional: Cache control settings
            upsert: false, // Optional: Set to true to overwrite if file exists, false to error
          });

        if (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          setFormError(`Failed to upload profile picture: ${uploadError.message}. Please try again or skip.`);
          // Optionally, decide if you want to stop the form submission here or proceed without a photo
          // For now, we'll let it proceed and the error will be shown.
        } else {
          // Get the public URL of the uploaded file
          const { data: publicUrlData } = supabase.storage
            .from('family-member-images')
            .getPublicUrl(filePath);
          
          if (publicUrlData) {
            photoUrl = publicUrlData.publicUrl;
          } else {
            console.error('Could not get public URL for the uploaded image.');
            // setFormError('Uploaded image but could not get its URL. Please try again.'); // Optional: more specific error
          }
        }
      } catch (uploadCatchError: any) {
        console.error('Catch Error during profile picture upload:', uploadCatchError);
        setFormError(`An unexpected error occurred during picture upload: ${uploadCatchError.message}.`);
      }
    }

    // Ensure generation is set, default to 1 if not provided or invalid.
    // The problem description mentions defaultGeneration from props, let's use that.
    // If defaultGeneration is null/undefined, or formData.generation is not a positive number,
    // we might need a more robust fallback, but the original code used availableGenerations[0] or 1.
    // For now, sticking to the logic provided in the task for generation.
    const generation = formData.generation && formData.generation > 0 
      ? formData.generation 
      : (defaultGeneration || 1); // Use defaultGeneration from props or fallback to 1

    const { 
      // Destructure specific form fields that are not direct FamilyMember properties or need transformation
      spouseName, 
      otherPartnerNames, 
      parentId,
      coParentName, // Destructure coParentName
      // Capture the rest of the formData that might align with FamilyMember properties
      ...familyMemberSpecificFormData 
    } = formData;

    // Construct partners array from spouseName and otherPartnerNames
    const calculatedPartners = [
      spouseName?.trim(),
      ...(otherPartnerNames?.split(',').map(name => name.trim()) || [])
    ].filter(name => name && name.trim().length > 0); // Ensure names are non-empty and not just whitespace

    const memberData: Partial<FamilyMember> = {
      ...familyMemberSpecificFormData, // Spread fields like name, gender, bio, etc.
      id: new Date().getTime().toString(), // Or use uuid if available and preferred
      photo: photoUrl, // Add the photoUrl here
      generation: generation,
      partners: calculatedPartners, // Assign the processed array of names
      parents: parentId ? [parentId] : [], // Parents array based on single parentId
      children: [], // Children will always be empty for a new member through this form
      spouse: undefined, // Explicitly set spouse (ID field) to undefined
      coParentName: coParentName?.trim() || undefined, // Add coParentName, trimmed or undefined
    };
    
    try {
      await onAdd(memberData); // onAdd prop will now be an async function that can throw
      // Parent (Index.tsx) is responsible for closing the modal on success.
    } catch (err: any) {
      // Display the error message from the parent or a generic one
      setFormError(err.message || "Failed to add member. Please try again.");
    }
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
        className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", "z-[55]")} // Added z-[55]
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

              <Input
                value={formData.name || ''}
                onChange={handleNameChange}
                placeholder="Full name"
                // Removed 'required' here as we handle it in handleSubmit for better error message control
              />
            </div>
            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium mb-2 dark:text-gray-300">
                Profile Picture
              </label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*" // Accept only image files
                onChange={(e) => setProfilePictureFile(e.target.files ? e.target.files[0] : null)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4"> {/* This div is added to maintain the 2-column layout for Gender and subsequent fields if Name and Profile Pic take full width or are arranged differently*/}
            {/* Profile Picture Input was added above Name, this section for Gender needs to be adjusted if layout changed */}
            {/* Assuming Name and Profile Picture are in their own rows or adjusted in the first grid div */}
            {/* If Profile Picture is next to Name, then Gender might be the first item in a new grid row or remain as is if the grid structure is maintained.*/}
            {/* The previous diff added profile picture in a new div, then started a new grid. This should be fine. */}
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={handleGenderChange}
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
              onChange={handleSpouseNameChange}
              placeholder="Spouse's full name"
              // Assuming Input component already has appropriate dark theme styling from ui/input
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
              onChange={handleOtherPartnerNamesChange}
              placeholder="e.g., Partner A, Partner B"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
            />
          </div>

          {/* Single Parent Dropdown with Shadcn Select */}
          <div>
            <label htmlFor="parentId-select" className="block text-sm font-medium mb-2 dark:text-gray-300">
              Parent
            </label>
            <Select
              value={formData.parentId || ''}
              onValueChange={handleParentChange}
            >
              <SelectTrigger id="parentId-select" className="w-full">
                <SelectValue placeholder="Select a parent (optional)" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                {/* The <SelectItem value=""> line has been removed from here */}
                {parentOptions}
              </SelectContent>
            </Select>
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
              onChange={handleCoParentNameChange}
              placeholder="Enter co-parent's name"
              // Assuming Input component already has appropriate dark theme styling from ui/input
            />
          </div>
          
          {/* Children input field removed */}

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
                <SelectContent className="z-[60]">
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
                onChange={handleBloodTypeChange}
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
              <label className="block text-sm font-medium mb-2">Birth Date</label>
              <Input
                type="date"
                value={formData.birthDate || ''}
                onChange={handleBirthDateChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Death Date</label>
              <Input
                type="date"
                value={formData.deathDate || ''}
                onChange={handleDeathDateChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mobile Number</label>
              <Input
                value={formData.mobileNumber || ''}
                onChange={handleMobileNumberChange}
                placeholder="e.g., +1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={handleEmailChange}
                placeholder="e.g., example@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Birth Place</label>
            <Input
              value={formData.birthPlace || ''}
              onChange={handleBirthPlaceChange}
              placeholder="City, Country"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Occupation</label>
            <Input
              value={formData.occupation || ''}
              onChange={handleOccupationChange}
              placeholder="e.g., Engineer, Artist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={handleBioChange}
              placeholder="A short biography..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:placeholder-slate-500 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
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
