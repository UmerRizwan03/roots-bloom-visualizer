
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Download, Eye, BookOpen, Users } from 'lucide-react';
import ThemeToggleButton from '../components/ThemeToggleButton';

const Magazines = () => {
  // Sample magazine data - this would come from your data source
  const magazines = [
    {
      id: 1,
      title: "Family Reunion 2024",
      description: "Highlights from our annual family gathering, featuring stories, photos, and memories from all generations.",
      coverImage: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=500&fit=crop",
      publishDate: "2024-03-15",
      pages: 24,
      downloadUrl: "#"
    },
    {
      id: 2,
      title: "Heritage Stories",
      description: "A collection of stories from our ancestors, preserving their wisdom and experiences for future generations.",
      coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=500&fit=crop",
      publishDate: "2023-12-10",
      pages: 32,
      downloadUrl: "#"
    },
    {
      id: 3,
      title: "New Arrivals & Celebrations",
      description: "Celebrating new family members, graduations, achievements, and special milestones from the past year.",
      coverImage: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=500&fit=crop",
      publishDate: "2023-09-22",
      pages: 18,
      downloadUrl: "#"
    },
    {
      id: 4,
      title: "Family Recipes & Traditions",
      description: "Traditional family recipes passed down through generations, along with the stories behind them.",
      coverImage: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&h=500&fit=crop",
      publishDate: "2023-06-08",
      pages: 28,
      downloadUrl: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 py-8">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-slate-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">FamilyRoots</span>
            </Link>
            <div className="flex items-center">
              <nav className="hidden md:flex space-x-8 mr-4">
                <Link to="/" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
                <Link to="/members" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Members</Link>
                <Link to="/magazines" className="text-emerald-600 dark:text-emerald-400 font-medium">E-Magazines</Link>
              </nav>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">Family E-Magazines</h1>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
            Discover our collection of digital family magazines, featuring stories, photos, and memories 
            that celebrate our family heritage and milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {magazines.map((magazine) => (
            <Card key={magazine.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="relative overflow-hidden">
                <img 
                  src={magazine.coverImage} 
                  alt={magazine.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm px-2 py-1 rounded-md">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{magazine.pages} pages</span>
                </div>
              </div>

              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {magazine.title}
                </CardTitle>
                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mt-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(magazine.publishDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                  {magazine.description}
                </p>

                <div className="flex space-x-3">
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                    <Eye className="w-4 h-4" />
                    <span>Read</span>
                  </button>
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Magazine Statistics</h3>
            <p className="text-gray-600 dark:text-slate-300">Our family publication journey</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{magazines.length}</div>
              <div className="text-gray-600 dark:text-slate-300">Total Issues</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">150+</div>
              <div className="text-gray-600 dark:text-slate-300">Stories Featured</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">2</div>
              <div className="text-gray-600 dark:text-slate-300">Years Publishing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Magazines;
