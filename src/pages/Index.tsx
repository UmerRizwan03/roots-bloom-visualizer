
import React, { useState } from 'react';
import { TreePine } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggleButton from '../components/ThemeToggleButton';
import FamilyTree from '../components/FamilyTree';
import MemberModal from '../components/MemberModal';
import { FamilyMember } from '../types/family';

const Index = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const handleMemberSelect = (member: FamilyMember) => {
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
  };

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
                  onMemberSelect={handleMemberSelect}
                  searchQuery=""
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
    </div>
  );
};

export default Index;
