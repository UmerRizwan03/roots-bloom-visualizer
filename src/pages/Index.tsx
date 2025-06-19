import React, { useState, useEffect, useCallback } from 'react';
import { TreePine, UserPlus, PanelRightOpen, PanelRightClose, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TopActionBar from '@/components/TopActionBar'; // Added
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggleButton from '../components/ThemeToggleButton';
import Sidebar from '../components/Sidebar';
import FamilyTree from '../components/FamilyTree';
import MemberModal from '../components/MemberModal';
import { FamilyMember } from '../types/family';
import { supabase } from '../lib/supabaseClient';
import AddMemberForm from '../components/AddMemberForm';
import EditMemberForm from '../components/EditMemberForm';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm'; // Import LoginForm
import SignUpForm from '../components/auth/SignUpForm'; // Import SignUpForm
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Import Dialog components
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import Breadcrumbs from '../components/Breadcrumbs'; // Import Breadcrumbs

// Data for navigation links that will be used in mobile sidebar
const mobileNavLinks = [
  { to: "/", label: "Home" },
  { to: "/members", label: "Members" },
  { to: "/magazines", label: "Magazines" },
];

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  // const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null); // Replaced by detailedMember
  const [detailedMember, setDetailedMember] = useState<FamilyMember | null>(null); // State for detail modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]); 
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null); 
  const [searchQuery, setSearchQuery] = useState<string>(""); 
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false); 
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null); // Added hoveredMemberId state

  // State for View Modes
  type ViewMode = 'FullTree' | 'PersonView' | 'LineageView';
  type LineageDirection = 'Ancestors' | 'Descendants';
  const [viewMode, setViewMode] = useState<ViewMode>('FullTree');
  const [lineageDirection, setLineageDirection] = useState<LineageDirection>('Descendants');

  // State variables for zoom functions
  const [reactFlowZoomIn, setReactFlowZoomIn] = useState<(() => void) | null>(null);
  const [reactFlowZoomOut, setReactFlowZoomOut] = useState<(() => void) | null>(null);

  const handleAddChild = useCallback((parentMember: FamilyMember) => {
    console.log('Add Child requested for parent:', parentMember.name);
    setEditingMember(null);
    setIsAddMemberModalOpen(true);
  }, [setIsAddMemberModalOpen]);

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
    if (!user) { // Add this check
      console.error("User not authenticated. Cannot add member.");
      setFetchError("You must be logged in to add a member."); // Optionally set user-facing error
      return;
    }

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
  }, [fetchMembers, user]); // Add user to dependency array

  const handleSetEditingMember = useCallback((memberToEdit: FamilyMember | null) => {
    if (memberToEdit) {
      const originalMember = members.find(m => m.id === memberToEdit.id);
      setEditingMember(originalMember || null); 
    } else {
      setEditingMember(null);
    }
  }, [members]); 

  const handleSaveEditedMember = useCallback(async (updatedMember: FamilyMember) => {
    if (!user) { // Add this check
      console.error("User not authenticated. Cannot save member.");
      setFetchError("You must be logged in to save changes."); // Optionally set user-facing error
      return;
    }

  // Destructure to get all properties, including photo
  const { id, ...memberProperties } = updatedMember;

  // Prepare the data payload for Supabase
  const dataToUpdate: Partial<FamilyMember> = { ...memberProperties };

  // If updatedMember.photo is undefined or an empty string,
  // explicitly set photo to null to clear it in the database.
  // Otherwise, use the value from updatedMember.photo.
  if (updatedMember.photo === undefined || updatedMember.photo === '') {
    dataToUpdate.photo = null;
  } else {
    dataToUpdate.photo = updatedMember.photo;
  }

  // Ensure 'id' is not in dataToUpdate if your table policy or RLS handles it
  // or if the 'id' field itself is not updatable.
  // In this case, 'id' is used in .eq() and not in the update payload, which is correct.

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
  }, [fetchMembers, user]); // Add user

  const handleDeleteMember = useCallback(async (memberId: string) => {
    if (!user) { // Add this check
      console.error("User not authenticated. Cannot delete member.");
      setFetchError("You must be logged in to delete a member."); // Optionally set user-facing error
      return;
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);
    if (error) {
      console.error('Error deleting member:', error);
      setFetchError(`Failed to delete member: ${error.message}`); 
    } else {
      await fetchMembers(); 
      // if (selectedMember?.id === memberId) { // Check detailedMember instead
      //   setSelectedMember(null);
      // }
      if (detailedMember?.id === memberId) {
        setDetailedMember(null);
      }
      if (editingMember?.id === memberId) {
        setEditingMember(null);
      }
    }
  }, [fetchMembers, detailedMember, editingMember, user]); // Updated dependency

  // New combined handler for focusing and showing details
  const handleFocusAndShowDetails = useCallback((memberId: string | null) => {
    if (memberId) {
      setFocusedMemberId(memberId);
      const memberObj = members.find(m => m.id === memberId);
      setDetailedMember(memberObj || null);
    } else {
      setFocusedMemberId(null);
      setDetailedMember(null);
    }
  }, [members]);

  const handleMemberSelectFromSheet = useCallback((memberId: string) => {
    handleFocusAndShowDetails(memberId);
    setIsDrawerOpen(false); // Close drawer after selection
  }, [handleFocusAndShowDetails]);

  const handleResetFocus = useCallback(() => {
    handleFocusAndShowDetails(null); // This already sets detailedMember to null, closing MemberModal
    setViewMode('FullTree'); 
    setSearchQuery(""); 
  }, [handleFocusAndShowDetails, setViewMode, setSearchQuery]);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFocusedMemberId(null);
      // Optionally close the panel if search is cleared and no member is focused
      // setIsNodeDetailPanelOpen(false); 
      // setSelectedMemberForPanel(null);
    }
  }, []);

  // New version to open MemberModal (via detailedMember state):
  const handleNodeClick = useCallback((member: FamilyMember) => {
    setDetailedMember(member); // This will trigger the MemberModal
    // Ensure other modals/panels are not triggered by this specific action
    // setIsNodeDetailPanelOpen(false); // State will be removed
    // setSelectedMemberForPanel(null); // State will be removed
    // setIsNodeModalOpen(false); // State will be removed
    // setSelectedMemberForNodeModal(null); // State will be removed
  }, [setDetailedMember]);

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
            <div className="flex items-center space-x-3 flex-shrink-0">
              <img
                src="/unityLogo.png"
                alt="Custom Icon"
                className="h-8 w-8"
              />
              <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Unity Valiyangadi</h1>
            </div>
            <div className="flex items-center min-w-0">
              {/* FloatingPageNav is positioned fixed, so it doesn't need to be in this flex flow for layout */}
              <FloatingPageNav />

              {/* Auth Buttons Block - Desktop Only */}
              <div className="hidden md:flex items-center">
                {!authLoading && user && (
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => setIsAddMemberModalOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Add Member
                  </Button>
                )}
                {authLoading ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Loading...</span>
                ) : user ? (
                  <>
                    <span className="text-sm text-gray-700 dark:text-gray-300 mr-3 hidden sm:inline">
                      Hi, {user.email?.split('@')[0]}
                    </span>
                    <Button variant="outline" onClick={signOut} className="mr-2">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsLoginModalOpen(true)} className="mr-2">
                      Login
                    </Button>
                    <Button variant="default" onClick={() => setIsSignUpModalOpen(true)} className="mr-2">
                      Sign Up
                    </Button>
                  </>
                )}
              </div>

              {/* Theme Toggle Button - Desktop Only */}
              <div className="hidden md:block ml-2">
                <ThemeToggleButton />
              </div>

              {/* Sidebar Toggle Button - Always Visible (becomes primary on mobile) */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDrawer}
                aria-label={isDrawerOpen ? "Close sidebar" : "Open sidebar"}
                className="ml-2" // This ml-2 will apply, ensuring space from logo on mobile if it's the only button
              >
                {isDrawerOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </Button>

              {/* The Mobile Dropdown Menu for Home/Members/Magazines has been REMOVED from here */}
            </div>
          </div>
        </div>
      </header>
      <TopActionBar
        members={members}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        onMemberSelect={(memberId) => handleFocusAndShowDetails(memberId)}
        onHoverMember={setHoveredMemberId}
        onResetFocus={handleResetFocus}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onZoomIn={() => reactFlowZoomIn && reactFlowZoomIn()}
        onZoomOut={() => reactFlowZoomOut && reactFlowZoomOut()}
      />
      {/* Section for Title/Description - Remains constrained */}
      <section className="pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            focusedMemberId={focusedMemberId}
            members={members}
            onSelectMember={setFocusedMemberId} // Pass setFocusedMemberId directly
            className="mb-4 ml-1" // Add some margin
          />
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
      <div className="flex-1 w-full pb-8 flex flex-col"> {/* Added flex flex-col */}
        
        {/* Family Tree Area - Main element with re-applied horizontal padding */}
        <main className="flex-grow px-4 sm:px-6 lg:px-8 flex flex-col"> {/* Added flex flex-col */}
          <section className="relative min-h-[400px] flex-1">  {/* Changed h-[650px] to min-h-[400px] flex-1 */}
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="h-full w-full relative"> 
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-black" />
                <FamilyTree 
                  members={members}
                  onMemberSelect={(member) => handleFocusAndShowDetails(member.id)} // Updated
                  searchQuery={searchQuery}
                  onSetEditingMember={handleSetEditingMember}
                  onDeleteMember={handleDeleteMember}
                  focusedMemberId={focusedMemberId}
                  hoveredMemberId={hoveredMemberId}
                  viewMode={viewMode}
                  lineageDirection={lineageDirection}
                  onNodeClick={handleNodeClick}
                  canEdit={!authLoading && !!user && user.role === 'admin'}
                  setZoomInFunc={(func) => setReactFlowZoomIn(() => func)}
                  setZoomOutFunc={(func) => setReactFlowZoomOut(() => func)}
                  onAddChild={handleAddChild}
                />
              </div>
            </div>
          </section>
        </main>

        {/* Sheet for Sidebar content (renders as a portal, not directly in this flex layout) */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0 overflow-y-auto">
            {/* New layout for all sidebar content */}
            <div className="flex flex-col h-full p-4 space-y-4"> {/* md:hidden as safeguard */}
              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-1">
                {mobileNavLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-lg py-2 px-3 hover:bg-accent rounded-md text-foreground font-medium"
                    onClick={() => setIsDrawerOpen(false)} // Close drawer on link click
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <hr />

              {/* Existing Member Search Sidebar functionality */}
              <Sidebar
                members={members}
                searchQuery={searchQuery}
                onSearchQueryChange={handleSearchQueryChange}
                onMemberSelect={(memberId) => {
                  handleMemberSelectFromSheet(memberId); // This already closes drawer
                }}
                focusedMemberId={focusedMemberId} // Pass focusedMemberId
                onResetFocus={handleResetFocus} // Pass handleResetFocus
                onHoverMember={setHoveredMemberId} // Pass setHoveredMemberId
                viewMode={viewMode} // Pass viewMode
                setViewMode={setViewMode} // Pass setViewMode
                lineageDirection={lineageDirection} // Pass lineageDirection
                setLineageDirection={setLineageDirection} // Pass setLineageDirection
                isSidebarOpen={isDrawerOpen} // Pass isDrawerOpen as isSidebarOpen
                onToggleSidebar={toggleDrawer} // Pass toggleDrawer as onToggleSidebar
              />

              {/* Spacer to push theme/auth to bottom */}
              <div className="flex-grow" />

              <hr />

              {/* Theme Toggle and Auth Buttons Group */}
              <div className="space-y-4">
                <ThemeToggleButton />

                {/* Auth Controls */}
                <div className="flex flex-col space-y-2">
                  {!authLoading && user && (
                    <Button variant="outline" onClick={() => { setIsAddMemberModalOpen(true); setIsDrawerOpen(false); }}>
                      <UserPlus className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                  )}
                  {authLoading ? (
                    <span className="text-sm text-center text-muted-foreground py-2">Loading user...</span>
                  ) : user ? (
                    <>
                      <div className="text-sm text-center text-muted-foreground py-1">
                        Hi, {user.email?.split('@')[0]}
                      </div>
                      <Button variant="outline" onClick={() => { signOut(); setIsDrawerOpen(false); }}>Logout</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => { setIsLoginModalOpen(true); setIsDrawerOpen(false); }}>Login</Button>
                      <Button variant="default" onClick={() => { setIsSignUpModalOpen(true); setIsDrawerOpen(false); }}>Sign Up</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Modals */}
      {detailedMember && (
        <MemberModal
          member={detailedMember}
          onClose={() => setDetailedMember(null)}
          onEditRequest={handleSetEditingMember} // Pass edit handler
          canEdit={!authLoading && !!user && user.role === 'admin'} // Pass canEdit status (example logic)
        />
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

      {isLoginModalOpen && (
        <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
          <DialogContent className="sm:max-w-md">
            <LoginForm onLoginSuccess={() => setIsLoginModalOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {isSignUpModalOpen && (
        <Dialog open={isSignUpModalOpen} onOpenChange={setIsSignUpModalOpen}>
          <DialogContent className="sm:max-w-md">
            <SignUpForm onSignUpSuccess={() => setIsSignUpModalOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default Index;
