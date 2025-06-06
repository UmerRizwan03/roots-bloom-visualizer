
import React, { useState, useEffect } from 'react';
import { FamilyMember } from '../types/family';
import { supabase } from '../lib/supabaseClient'; // Import Supabase
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from "@/lib/utils"; // Import cn

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
  const [newProfilePictureFile, setNewProfilePictureFile] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState<boolean>(false);

  // Filter existingMembers to exclude the current member being edited
  const selectableParents = Array.isArray(existingMembers)
    ? existingMembers.filter(m => m.id !== member.id)
    : [];

  const handleSubmit = async (e: React.FormEvent) => { // Make async
    e.preventDefault();
    
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    let finalPhotoUrl: string | undefined = formData.photo; // Start with the current photo

    // Helper to delete from storage - ensure this matches your actual storage structure
    const deletePhotoFromStorage = async (photoUrlToDelete: string) => {
      if (!photoUrlToDelete) {
        // console.log("deletePhotoFromStorage: No photo URL provided, skipping deletion from storage."); // Debug log, commented out
        return;
      }
      try {
        // Example URL: https://<project-ref>.supabase.co/storage/v1/object/public/family-member-images/public/some-image.jpg
        // We need to extract the path starting after the bucket name, e.g., "public/some-image.jpg"
        
        const storageBucketName = 'family-member-images'; // Make sure this matches your bucket name
        const urlSegments = photoUrlToDelete.split('/');
        const bucketNameIndex = urlSegments.indexOf(storageBucketName);

        if (bucketNameIndex === -1) {
          console.warn(`deletePhotoFromStorage: Could not find bucket name '${storageBucketName}' in URL: ${photoUrlToDelete}`);
          return;
        }

        // The path in the bucket is everything after the bucket name segment
        const filePathInBucket = urlSegments.slice(bucketNameIndex + 1).join('/');
        
        if (filePathInBucket) {
          // console.log(`deletePhotoFromStorage: Attempting to delete '${filePathInBucket}' from bucket '${storageBucketName}'.`); // Debug log, commented out
          const { error: deleteError } = await supabase.storage
            .from(storageBucketName)
            .remove([filePathInBucket]);

          if (deleteError) {
            console.warn(`deletePhotoFromStorage: Error deleting photo '${filePathInBucket}' from storage: ${deleteError.message}`, deleteError);
          } else {
            // console.log(`deletePhotoFromStorage: Successfully deleted photo '${filePathInBucket}' from storage.`); // Success Debug log, commented out
          }
        } else {
          console.warn(`deletePhotoFromStorage: Extracted empty file path from URL '${photoUrlToDelete}'. Cannot delete.`);
        }
      } catch (e) {
        // Type assertion for error object
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.warn(`deletePhotoFromStorage: Exception during photo deletion from storage for URL '${photoUrlToDelete}': ${errorMessage}`, e);
      }
    };
    
    if (removeCurrentImage) {
      if (formData.photo) {
        await deletePhotoFromStorage(formData.photo);
      }
      finalPhotoUrl = undefined;
    }

    if (newProfilePictureFile) {
      // If there was an existing photo AND it's not the one just removed by removeCurrentImage, delete it.
      if (formData.photo && formData.photo !== finalPhotoUrl) { 
        await deletePhotoFromStorage(formData.photo);
      }

      const fileName = `${Date.now()}-${newProfilePictureFile.name}`;
      const filePath = `public/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('family-member-images')
        .upload(filePath, newProfilePictureFile, {
          cacheControl: '3600',
          upsert: false, // Consider true if replacing the exact same file name is desired, though unlikely with timestamp
        });

      if (uploadError) {
        console.error('Error uploading new profile picture:', uploadError);
        alert(`Failed to upload new profile picture: ${uploadError.message}.`);
        // If upload fails, current finalPhotoUrl (either old photo or undefined) will be used.
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('family-member-images')
          .getPublicUrl(filePath);
        finalPhotoUrl = publicUrlData?.publicUrl;
      }
    }

    const { 
      parentId, 
      spouseName, 
      otherPartnerNames,
      coParentName,
      photo, // Exclude original photo from formData spread if it's handled by finalPhotoUrl
      ...memberSpecificFormData 
    } = formData;

    const calculatedPartners = [
      spouseName?.trim(),
      ...(otherPartnerNames?.split(',').map(name => name.trim()) || [])
    ].filter(name => name && name.trim().length > 0);

    const memberToSave: FamilyMember = {
      ...memberSpecificFormData,
      id: member.id,
      parents: parentId ? [parentId] : [],
      partners: calculatedPartners,
      spouse: undefined, 
      coParentName: coParentName?.trim() || undefined,
      photo: finalPhotoUrl, // Use the determined photo URL
    };

    onSave(memberToSave);
  };

  const handleInputChange = (field: keyof Omit<FamilyMember, 'photo'> | 'parentId' | 'spouseName' | 'otherPartnerNames' | 'coParentName', value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", "z-[55]")}> {/* Added z-[55] */}
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

          {/* New Profile Picture Management Section */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Profile Picture</label>
            {formData.photo && !removeCurrentImage && (
              <div className="mb-2">
                <img src={formData.photo} alt="Current profile" className="w-24 h-24 object-cover rounded-md border border-gray-300" />
                <Button variant="link" size="sm" onClick={() => {
                  setRemoveCurrentImage(true);
                  setNewProfilePictureFile(null); // Clear any newly selected file if removing
                }} className="text-red-500 hover:text-red-700 mt-1">
                  Remove current picture
                </Button>
              </div>
            )}
            {(removeCurrentImage || !formData.photo) && (
               <p className="text-sm text-gray-500 mb-2">
                 {removeCurrentImage ? "Current picture will be removed." : "No current picture."}
               </p>
            )}
            <Input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                setNewProfilePictureFile(file);
                if (file) { // If a new file is selected
                  setRemoveCurrentImage(false); // Unset removal intention
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500"
            />
            {newProfilePictureFile && (
              <p className="text-xs text-green-600 mt-1">New picture selected: {newProfilePictureFile.name}. This will replace the current picture upon saving.</p>
            )}
          </div>
          {/* End of New Profile Picture Management Section */}

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
