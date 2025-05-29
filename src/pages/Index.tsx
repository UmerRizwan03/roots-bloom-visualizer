import React, { useState, useEffect, useCallback } from 'react';
import { TreePine, UserPlus, PanelRightOpen, PanelRightClose } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeToggleButton from '../components/ThemeToggleButton';
import Sidebar from '../components/Sidebar'; 
import FamilyTree from '../components/FamilyTree';
import MemberModal from '../components/MemberModal';
import { FamilyMember } from '../types/family';
import { supabase } from '../lib/supabaseClient'; 
import AddMemberForm from '../components/AddMemberForm';
import EditMemberForm from '../components/EditMemberForm';
import { v4 as uuidv4 } from 'uuid';
import {
  Sheet,
  SheetContent,
  // SheetHeader, // Not used for now, Sidebar has its own header
  // SheetTitle,  // Not used for now
} from "@/components/ui/sheet";

const Index = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]); 
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null); 
  const [searchQuery, setSearchQuery] = useState<string>(""); 
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false); 


  const fetchMembers = useCallback(async () => {
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
      setMembers([...data] as FamilyMember[]);
    }
    setIsLoading(false);
  }, []); 

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]); 

  const handleAddMember = useCallback(async (memberData: Partial<FamilyMember>) => {
    const id = uuidv4(); 
    const payload = {
      ...memberData,
      id,
      generation: memberData.generation || 1
    };
    const finalPayload = {
      ...payload,
      generation: typeof memberData.generation === 'number' && memberData.generation > 0 
                    ? memberData.generation 
                    : 1,
    };
    const { error } = await supabase
      .from('family_members')
      .insert([finalPayload]); 
    if (error) {
      console.error('Error adding member:', error);
      setFetchError(`Failed to add member: ${error.message}`); 
      throw error; 
    } else {
      await fetchMembers(); 
      setIsAddMemberModalOpen(false); 
    }
  }, [fetchMembers]); 

  const handleSetEditingMember = useCallback((memberToEdit: FamilyMember | null) => {
    if (memberToEdit) {
      const originalMember = members.find(m => m.id === memberToEdit.id);
      setEditingMember(originalMember || null); 
    } else {
      setEditingMember(null);
    }
  }, [members]); 

  const handleSaveEditedMember = useCallback(async (updatedMember: FamilyMember) => {
    const { id, ...dataToUpdate } = updatedMember;
    const { error } = await supabase
      .from('family_members')
      .update(dataToUpdate)
      .eq('id', id);
    if (error) {
      console.error('Error updating member:', error);
      setFetchError(`Failed to update member: ${error.message}`); 
    } else {
      await fetchMembers(); 
      setEditingMember(null); 
    }
  }, [fetchMembers]); 

  const handleDeleteMember = useCallback(async (memberId: string) => {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);
    if (error) {
      console.error('Error deleting member:', error);
      setFetchError(`Failed to delete member: ${error.message}`); 
    } else {
      await fetchMembers(); 
      if (selectedMember?.id === memberId) {
        setSelectedMember(null);
      }
      if (editingMember?.id === memberId) {
        setEditingMember(null);
      }
    }
  }, [fetchMembers, selectedMember, editingMember]); 

  const handleMemberSelect = useCallback((member: FamilyMember) => {
    setSelectedMember(member);
  }, []); 

  const handleCloseModal = useCallback(() => {
    setSelectedMember(null);
  }, []); 

  const handleMemberSelectFromSheet = useCallback((memberId: string) => {
    setFocusedMemberId(memberId);
    setIsDrawerOpen(false); // Close drawer after selection
  }, []); 

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFocusedMemberId(null);
    }
  }, []); 

  const toggleDrawer = useCallback(() => { 
    setIsDrawerOpen(prev => !prev); 
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading family data...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center items-center min-h-screen">Error loading data: {fetchError}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 flex flex-col">
      {/* Header - Remains constrained */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <TreePine className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Unity Valiyangadi</h1>
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
              <Button
                variant="outline"
                size="icon" 
                onClick={toggleDrawer} 
                aria-label={isDrawerOpen ? "Close search and filter panel" : "Open search and filter panel"}
                className="ml-2" 
              >
                {isDrawerOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />} 
              </Button>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      {/* Section for Title/Description - Remains constrained */}
      <section className="pt-8"> 
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
        </div>
      </section>
      
      {/* Main Content Wrapper - Remains full width */}
      <div className="flex-1 w-full pb-8">
        
        {/* Family Tree Area - Main element with re-applied horizontal padding */}
        <main className="flex-grow px-4 sm:px-6 lg:px-8"> {/* MODIFIED: Re-added px-4 sm:px-6 lg:px-8 */}
          <section className="relative h-[650px]"> 
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="h-full w-full relative"> 
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-black" />
                <FamilyTree 
                  members={members}
                  onMemberSelect={handleMemberSelect} 
                  searchQuery={searchQuery} 
                  onSetEditingMember={handleSetEditingMember} 
                  onDeleteMember={handleDeleteMember}     
                  focusedMemberId={focusedMemberId}
                />
              </div>
            </div>
          </section>
        </main>

        {/* Sheet for Sidebar content (renders as a portal, not directly in this flex layout) */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0 overflow-y-auto">
            <Sidebar 
              members={members}
              searchQuery={searchQuery}
              onSearchQueryChange={handleSearchQueryChange}
              onMemberSelect={(memberId) => { 
                handleMemberSelectFromSheet(memberId); 
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Modals */}
      {selectedMember && (
        <MemberModal member={selectedMember} onClose={handleCloseModal} />
      )}
      {isAddMemberModalOpen && (
        <AddMemberForm
          onAdd={handleAddMember}
          onCancel={() => setIsAddMemberModalOpen(false)}
          existingMembers={members}
        />
      )}
      {editingMember && (
        <EditMemberForm
          member={editingMember}
          onSave={handleSaveEditedMember} 
          onCancel={() => setEditingMember(null)}
          existingMembers={members} 
        />
      )}
    </div>
  );
};

export default Index;