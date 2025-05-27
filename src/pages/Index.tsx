
import React, { useState } from 'react';
import { Search, Users, TreePine, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import FamilyTree from '../components/FamilyTree';
import SearchBar from '../components/SearchBar';
import MemberModal from '../components/MemberModal';
import { FamilyMember } from '../types/family';

const Index = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMemberSelect = (member: FamilyMember) => {
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <TreePine className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-emerald-800">FamilyRoots</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">Home</Link>
              <Link to="/members" className="text-gray-600 hover:text-emerald-600 transition-colors">Members</Link>
              <a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Features</a>
              <a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">About</a>
              <a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="text-emerald-600 hover:text-emerald-700 transition-colors">Sign In</button>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Discover Your
              <span className="text-emerald-600 block">Family Legacy</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Build, explore, and share your family tree with our interactive visualization platform. 
              Connect generations and preserve your family's story for future generations.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <SearchBar onSearch={setSearchQuery} />
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">10M+</div>
                <div className="text-gray-600">Family Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">500K+</div>
                <div className="text-gray-600">Family Trees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">150+</div>
                <div className="text-gray-600">Countries</div>
              </div>
            </div>
          </div>

          {/* Interactive Family Tree */}
          <div className="relative">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <Users className="mr-3 h-6 w-6" />
                  Interactive Family Tree
                </h3>
                <p className="text-slate-300 mt-2 text-sm">
                  Explore family connections with our modern, interactive visualization
                </p>
              </div>
              <div className="h-[650px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
                <FamilyTree 
                  onMemberSelect={handleMemberSelect}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h3>
            <p className="text-xl text-gray-600">Everything you need to build and explore your family tree</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Smart Search</h4>
              <p className="text-gray-600">Find any family member instantly with our intelligent search system</p>
            </div>
            
            <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Unlimited Members</h4>
              <p className="text-gray-600">Add as many family members as you want with detailed profiles</p>
            </div>
            
            <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Beautiful Visualization</h4>
              <p className="text-gray-600">Stunning interactive tree layouts that grow with your family</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <TreePine className="h-8 w-8 text-emerald-400" />
            <span className="text-2xl font-bold">FamilyRoots</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 FamilyRoots. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Member Modal */}
      {selectedMember && (
        <MemberModal member={selectedMember} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Index;
