
import React, { useState, useEffect } from 'react';
import { TreePine, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeToggleButton from '../components/ThemeToggleButton';
import FamilyTree from '../components/FamilyTree';
import MemberModal from '../components/MemberModal';
import { FamilyMember } from '../types/family';
// Removed: import { familyMembers as initialFamilyMembers } from '../data/familyData';
import { supabase } from '../lib/supabaseClient'; // Added supabase client import
import AddMemberForm from '../components/AddMemberForm';
import EditMemberForm from '../components/EditMemberForm';
import { v4 as uuidv4 } from 'uuid';

const Index = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]); // Initialize as empty array
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Extracted fetchMembers function
  const fetchMembers = async () => {
    setIsLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('family_members')
      .select('*');
    if (error) {
      console.error('Error fetching members:', error);
      setFetchError(error.message);
      setMembers([]);
    } else {
      setMembers(data as FamilyMember[]); 
    }   setIsLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []); // Empty dependency array to run once on mount

  const handleAddMember = async (memberData: Partial<FamilyMember>) => {
    // Generate a unique ID
    const id = uuidv4(); // Using uuidv4 for unique ID generation
    
    const payload = {
      ...memberData,
      id,
      generation: memberData.generation || 1
    };

    // Ensure generation is a number; fallback to 1 if not provided or invalid
    const finalPayload = {
      ...payload,
      generation: typeof memberData.generation === 'number' && memberData.generation > 0 
                    ? memberData.generation 
                    : 1,
    };

    const { error } = await supabase
      .from('family_members')
      .insert([finalPayload]); // Use finalPayload here

    if (error) {
      console.error('Error adding member:', error);
      setFetchError(`Failed to add member: ${error.message}`); // You might also use a toast here
      throw error; // IMPORTANT: Re-throw the error to be caught by AddMemberForm
    } else {
      await fetchMembers(); // Re-fetch members on success
      setIsAddMemberModalOpen(false); // Close modal on success
      // Optionally, show a success toast here
    }
  };

  const handleSetEditingMember = (member: FamilyMember | null) => {
    setEditingMember(member);
  };

  const handleSaveEditedMember = async (updatedMember: FamilyMember) => {
    // Optional: Add a new loading state like setIsEditing(true);
    const { id, ...dataToUpdate } = updatedMember;

    const { error } = await supabase
      .from('family_members')
      .update(dataToUpdate)
      .eq('id', id);

    if (error) {
      console.error('Error updating member:', error);
      setFetchError(`Failed to update member: ${error.message}`); // Or a new error state
    } else {
      await fetchMembers(); // Re-fetch all members to reflect the update
      setEditingMember(null); // Close the modal on success
    }
    // Optional: setIsEditing(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    // Optional: Add a new loading state like setIsDeleting(true);

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error deleting member:', error);
      setFetchError(`Failed to delete member: ${error.message}`); // Or a new error state
    } else {
      await fetchMembers(); // Re-fetch all members to reflect the deletion

      // Clear selection if the deleted member was selected/editing
      // This should ideally happen *after* re-fetch confirms deletion from local state perspective,
      // or be based on the new 'members' list post-fetch.
      // For simplicity, we'll keep it here. If fetchMembers updates 'members'
      // before these checks, selectedMember/editingMember might be stale.
      // A more robust way would be to ensure these are cleared if their IDs
      // are no longer in the 'members' list after fetchMembers.
      // However, the current placement is acceptable for now.
      if (selectedMember?.id === memberId) {
        setSelectedMember(null);
      }
      if (editingMember?.id === memberId) {
        setEditingMember(null);
      }
    }
    // Optional: setIsDeleting(false);
  };

  const handleMemberSelect = (member: FamilyMember) => {
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading family data...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center items-center min-h-screen">Error loading data: {fetchError}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <TreePine className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">FamilyRoots</h1>
            </div>
            <div className="flex items-center">
              <nav className="hidden md:flex space-x-8 mr-4">
                <Link to="/" className="text-emerald-600 dark:text-emerald-400 font-medium">Home</Link>
                <Link to="/members" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Members</Link>
                <Link to="/magazines" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">E-Magazines</Link>
              </nav>
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => setIsAddMemberModalOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Add Member
              </Button>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      {/* Family Tree Section */}
      <section className="relative overflow-hidden py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Our Family
              <span className="text-emerald-600 dark:text-emerald-400 block">Legacy Tree</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              Explore our family connections and discover the stories that connect us across generations.
            </p>
          </div>

          {/* Interactive Family Tree */}
          <div className="relative">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="h-[650px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-black" />
                <FamilyTree 
                  members={members}
                  onMemberSelect={handleMemberSelect}
                  searchQuery=""
                  onSetEditingMember={handleSetEditingMember} // Add this
                  onDeleteMember={handleDeleteMember}     // Add this
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Member Modal */}
      {selectedMember && (
        <MemberModal member={selectedMember} onClose={handleCloseModal} />
      )}

      {/* Add Member Form */}
      {isAddMemberModalOpen && (
        <AddMemberForm
          onAdd={handleAddMember}
          onCancel={() => setIsAddMemberModalOpen(false)}
          existingMembers={members}
        />
      )}

      {/* Edit Member Form */}
      {editingMember && (
        <EditMemberForm
          member={editingMember}
          onSave={handleSaveEditedMember} // Use the new handler
          onCancel={() => setEditingMember(null)}
        />
      )}
    </div>
  );
};

export default Index;