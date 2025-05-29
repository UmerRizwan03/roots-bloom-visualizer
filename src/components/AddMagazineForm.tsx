import React, { useState } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Label } from './ui/label';

// Assuming Magazine type is defined in Magazines.tsx and imported here
// If not, define it here or import from a shared types file
interface MagazineBase {
  title: string;
  description: string;
  coverImage: string; // URL for the image
  publishDate: string;
  pages: number;
  redirectUrl: string; // For "Read" button (Flipbook)
  // pdfUrl will be handled by the parent, generated from the pdfFile
}

// The data submitted by the form
export interface NewMagazineData extends MagazineBase {
  pdfFile: File | null; // PDF file object
}

// Props for the AddMagazineForm component
interface AddMagazineFormProps {
  onSubmit: (magazineData: NewMagazineData) => void;
  onCancel: () => void;
}

const AddMagazineForm: React.FC<AddMagazineFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<MagazineBase>({
    title: '',
    description: '',
    coverImage: '',
    publishDate: '',
    pages: 0,
    redirectUrl: '',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    } else {
      setPdfFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a PDF file."); // Or use a more sophisticated notification
      return;
    }
    onSubmit({ ...formData, pdfFile });
    // Optionally reset form:
    // setFormData({ title: '', description: '', coverImage: '', publishDate: '', pages: 0, redirectUrl: '' });
    // setPdfFile(null);
    // if (e.target instanceof HTMLFormElement) e.target.reset(); // Resets file input too
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white dark:bg-slate-800 shadow-md rounded-lg">
      <div>
        <Label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Magazine Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        />
      </div>

      <div>
        <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        />
      </div>

      <div>
        <Label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Cover Image URL</Label>
        <Input
          id="coverImage"
          name="coverImage"
          type="url"
          value={formData.coverImage}
          onChange={handleChange}
          required
          placeholder="https://example.com/image.png"
          className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="publishDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Publish Date</Label>
          <Input
            id="publishDate"
            name="publishDate"
            type="date"
            value={formData.publishDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          />
        </div>
        <div>
          <Label htmlFor="pages" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Pages</Label>
          <Input
            id="pages"
            name="pages"
            type="number"
            value={formData.pages}
            onChange={handleChange}
            required
            min="1"
            className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="redirectUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Flipbook Redirect URL</Label>
        <Input
          id="redirectUrl"
          name="redirectUrl"
          type="url"
          value={formData.redirectUrl}
          onChange={handleChange}
          placeholder="https://yourflipbook.com/magazine"
          required
          className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        />
      </div>

      <div>
        <Label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Magazine PDF</Label>
        <Input
          id="pdfFile"
          name="pdfFile"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          required
          className="mt-1 block w-full text-sm text-gray-500 dark:text-slate-400
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-emerald-50 dark:file:bg-emerald-900
                     file:text-emerald-700 dark:file:text-emerald-300
                     hover:file:bg-emerald-100 dark:hover:file:bg-emerald-800"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="dark:text-slate-300 dark:border-slate-600 hover:dark:bg-slate-700">
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white">
          Add Magazine
        </Button>
      </div>
    </form>
  );
};

export default AddMagazineForm;
