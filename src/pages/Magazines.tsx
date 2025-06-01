
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from "sonner"; // Import toast for notifications
import { Calendar, Download, Eye, BookOpen, Users, PlusCircle } from 'lucide-react';
import ThemeToggleButton from '../components/ThemeToggleButton';
import AddMagazineForm, { NewMagazineData } from '../components/AddMagazineForm';
import { supabase } from '../lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

export interface Magazine {
  id: number | string;
  title: string;
  description: string;
  coverImage: string;
  publishDate: string;
  pages: number;
  redirectUrl: string;
  pdfUrl: string;
  pdf_storage_path: string; // Added for delete functionality
}

const Magazines = () => {
  const [uploadedMagazines, setUploadedMagazines] = useState<Magazine[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingMagazines, setIsLoadingMagazines] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // For submission loading state
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to fetch magazines from Supabase
  async function fetchMagazines() {
    // Note: setIsLoadingMagazines(true) will be called by the useEffect hook
    setFetchError(null);

    const { data: magazineRecords, error } = await supabase
      .from('magazines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching magazines:', error);
      setFetchError('Could not fetch magazines. Please try again later.');
      setUploadedMagazines([]);
    } else if (magazineRecords) {
      const processedMagazines = await Promise.all(magazineRecords.map(async (record) => {
        let pdfPublicUrl = '';
        if (record.pdf_storage_path) {
          const { data: publicUrlData } = supabase
            .storage
            .from('emagazines')
            .getPublicUrl(record.pdf_storage_path);
          pdfPublicUrl = publicUrlData?.publicUrl || '';
        }
        return {
          id: record.id,
          title: record.title,
          description: record.description,
          coverImage: record.cover_image_url || '', // from DB: cover_image_url
          publishDate: record.publish_date || '',   // from DB: publish_date
          pages: record.pages,
          redirectUrl: record.redirect_url || '', // from DB: redirect_url
          pdfUrl: pdfPublicUrl,
          pdf_storage_path: record.pdf_storage_path || '', // Added for delete functionality
        };
      }));
      setUploadedMagazines(processedMagazines);
    }
    setIsLoadingMagazines(false);
  }

  useEffect(() => {
    const checkUserAndFetchMagazines = async () => {
      setIsLoadingMagazines(true); // Set loading true at the beginning

      // Fetch user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        if (userError.message === "Auth session missing!") {
          // This specific error means the user is not logged in, don't show a user-facing error toast.
          // console.log("User session not found (logged out):", userError.message); // Optional: for debugging if needed
          setIsAdmin(false);
        } else {
          // For any other actual error, log it and show a toast.
          console.error('Error fetching user session:', userError);
          toast.error(`Error fetching user session: ${userError.message}`);
          setIsAdmin(false);
        }
      } else if (user) {
        // User is logged in
        const userIsAdmin = user.app_metadata?.app_role === 'admin' || false;
        setIsAdmin(userIsAdmin);
      } else {
        // User is not logged in (user is null, userError is null - this case might be less likely if "Auth session missing!" error is always thrown for logged out)
        // console.log("User is null and no error (logged out)."); // Optional: for debugging
        setIsAdmin(false);
      }

      // Fetch magazines (existing logic)
      // fetchMagazines itself will set isLoadingMagazines to false and handle its own errors.
      await fetchMagazines(); 
    };

    checkUserAndFetchMagazines();
  }, []); // Empty dependency array, runs once on mount

  const handleAddMagazine = async (data: NewMagazineData) => {
    if (!isAdmin) {
      toast.error("Unauthorized: Only admins can add magazines.");
      // setIsSubmitting(false); // No need to set isSubmitting here as it's set true on the next line
      return;
    }
    setIsSubmitting(true);
    toast.info("Uploading PDF...", { id: "upload-toast" });

    if (!data.pdfFile) {
      toast.error("No PDF file selected. Please select a PDF to upload.");
      setIsSubmitting(false);
      return;
    }

    const fileName = `${Date.now()}_${data.pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const filePath = `public/magazine-pdfs/${fileName}`;

    // Upload PDF to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('emagazines')
      .upload(filePath, data.pdfFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error('Error uploading PDF:', uploadError);
      toast.error(`PDF Upload Failed: ${uploadError?.message || "Unknown error"}`);
      setIsSubmitting(false);
      return;
    }
    
    toast.success("PDF uploaded successfully!", { id: "upload-toast" });
    toast.info("Saving magazine details...", { id: "save-toast" });

    // Prepare data for Supabase table
    const newMagazineRecord = {
      title: data.title,
      description: data.description,
      cover_image_url: data.coverImage, // Ensure form field 'coverImage' provides a URL
      publish_date: data.publishDate,
      pages: data.pages,
      redirect_url: data.redirectUrl,
      pdf_storage_path: uploadData.path, // Path from Supabase storage
      // user_id: (await supabase.auth.getUser()).data.user?.id // Optional: if you have user auth
    };

    // Insert magazine data into Supabase table
    const { error: insertError } = await supabase
      .from('magazines')
      .insert([newMagazineRecord]);

    if (insertError) {
      console.error('Error inserting magazine data:', insertError);
      toast.error(`Failed to save magazine: ${insertError.message}`);
      // Optionally, try to delete the uploaded file if DB insert fails
      // await supabase.storage.from('emagazines').remove([uploadData.path]);
      setIsSubmitting(false);
      return;
    }

    toast.success("Magazine saved successfully!", { id: "save-toast" });
    await fetchMagazines(); // Re-fetch magazines to update the list
    setIsAddModalOpen(false);
    setIsSubmitting(false);
  }; // End of handleAddMagazine

  const handleDeleteMagazine = async (magazineId: string | number, pdfStoragePath: string) => {
    if (!isAdmin) {
      toast.error("Unauthorized: Only admins can delete magazines.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this magazine? This action cannot be undone.")) {
      return;
    }

    const deleteToastId = `delete-${magazineId}`;
    toast.loading("Deleting magazine...", { id: deleteToastId });

    // Delete from Supabase Storage
    if (pdfStoragePath && pdfStoragePath.trim() !== '') {
      const { error: storageError } = await supabase.storage
        .from('emagazines') // Ensure this is your correct bucket name
        .remove([pdfStoragePath]);

      if (storageError) {
        console.error('Error deleting PDF from storage:', storageError);
        toast.error(`Failed to delete magazine PDF: ${storageError.message}. DB record may still exist.`, { id: deleteToastId });
        // Continue to attempt DB deletion despite storage error, but the admin is notified.
      } else {
        toast.success("Magazine PDF deleted from storage.", { id: deleteToastId });
      }
    } else {
      toast.info("No PDF storage path found, skipping storage deletion.", { id: deleteToastId });
    }

    // Delete from Supabase Database
    const { error: dbError } = await supabase
      .from('magazines')
      .delete()
      .match({ id: magazineId });

    if (dbError) {
      console.error('Error deleting magazine from database:', dbError);
      toast.error(`Failed to delete magazine from database: ${dbError.message}`, { id: deleteToastId });
      return;
    }

    toast.success("Magazine deleted successfully!", { id: deleteToastId, duration: 4000 });
    await fetchMagazines(); // Re-fetch to update the UI
  };


  // Start of the return statement for the component
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 py-8">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-emerald-100 dark:border-slate-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Unity Valiyangadi</span>
            </Link>
            <div className="flex items-center">
              <nav className="hidden md:flex space-x-8 mr-4">
                <Link to="/" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
                <Link to="/members" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Members</Link>
                <Link to="/magazines" className="text-emerald-600 dark:text-emerald-400 font-medium">Magazines</Link>
              </nav>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">Family Magazines</h1>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
            Discover our collection of digital family magazines, featuring stories, photos, and memories 
            that celebrate our family heritage and milestones.
          </p>
        </div>

        {/* Loading and Error States Display */}
        {isLoadingMagazines && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 animate-pulse" />
            <p className="mt-2 text-lg font-medium text-gray-700 dark:text-slate-300">Loading magazines...</p>
          </div>
        )}
        {fetchError && !isLoadingMagazines && (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
            <Users className="mx-auto h-12 w-12 text-red-500 dark:text-red-400" /> {/* Using Users icon as a placeholder for error icon */}
            <p className="mt-2 text-lg font-medium text-red-700 dark:text-red-300">Error: {fetchError}</p>
          </div>
        )}

        {!isLoadingMagazines && !fetchError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dialog for Adding Magazine */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              {isAdmin && ( // Conditionally render based on isAdmin
                <Card className="flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group min-h-[480px] dark:bg-slate-800 hover:dark:bg-slate-700"> {/* Adjusted min-height */}
                  <PlusCircle className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200">Add New Magazine</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Click to upload a new issue.</p>
                </Card>
              )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] dark:bg-slate-800">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-slate-100">Upload New Magazine</DialogTitle>
              </DialogHeader>
              <AddMagazineForm
                onSubmit={handleAddMagazine}
                onCancel={() => {
                  if (!isSubmitting) setIsAddModalOpen(false);
                }}
                // Optionally pass isSubmitting to disable form fields/button
              />
            </DialogContent>
          </Dialog>
          
            {/* Display magazines if no error and not loading */}
            {uploadedMagazines.map((magazine) => (
              <Card key={magazine.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group min-h-[480px] dark:bg-slate-800"> {/* Adjusted min-height */}
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

                <CardContent className="pt-0 flex flex-col flex-grow"> {/* Ensure CardContent can grow */}
                  <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-6 flex-grow h-20 overflow-hidden"> {/* Added flex-grow to description */}
                    {magazine.description}
                  </p>

                  <div className="flex space-x-3">
                    <a
                      href={magazine.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Read</span>
                    </a>
                    <a
                      href={magazine.pdfUrl}
                      download={`${magazine.title}.pdf`}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  </div>
                  {isAdmin && (
                    <div className="mt-4 px-6 pb-4">
                      <button
                        onClick={() => handleDeleteMagazine(magazine.id, magazine.pdf_storage_path)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      >
                        {/* Using a simple button, can be replaced with <Button variant="destructive"> if available and preferred */}
                        <span>Delete Magazine</span>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        
            {/* Message for no magazines if not loading, no error, and array is empty */}
            {!isLoadingMagazines && !fetchError && uploadedMagazines.length === 0 && (
               <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
                 <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                 <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-slate-100">No magazines found.</h3>
                 <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Why not add the first one?</p>
               </div>
            )}
          </div>
        )}
        {/* Stats Section */}
        <div className="mt-16 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-8">
          {/* Update stats section based on fetched data if needed, or keep as is if it only depends on length */}
          {uploadedMagazines.length === 0 && !isLoadingMagazines && !fetchError && (
            <div className="text-center pb-8">
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-slate-100">No magazines available to show stats.</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Add a magazine to see statistics here.</p>
            </div>
          )}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Magazine Statistics</h3>
            <p className="text-gray-600 dark:text-slate-300">Our family publication journey</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{uploadedMagazines.length}</div>
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
