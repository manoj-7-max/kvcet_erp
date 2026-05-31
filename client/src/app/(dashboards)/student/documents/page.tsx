'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { File, Upload, Trash2, ExternalLink } from 'lucide-react';

export default function StudentDocumentsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      setFile(null);
      setTitle('');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => toast.error('Error uploading document')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return toast.error('Please provide a file and title');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">My Documents</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Form */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-fit">
          <h2 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            Upload Document
          </h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Document Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 10th Marksheet"
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Academic">Academic</option>
                <option value="Certificate">Certificate</option>
                <option value="ID Proof">ID Proof</option>
                <option value="Medical">Medical</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Select File (Max 5MB)</label>
              <input 
                type="file" 
                required
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
              />
            </div>
            <button 
              type="submit"
              disabled={uploadMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-xl mt-2 transition-colors font-medium flex justify-center items-center gap-2"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>

        {/* Document Grid */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-neutral-500">Loading documents...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc: any) => (
                <div key={doc._id} className="bg-neutral-900/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3 group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <File className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium truncate w-40" title={doc.title}>{doc.title}</h3>
                        <p className="text-xs text-neutral-500 uppercase">{doc.category}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteMutation.mutate(doc._id)}
                      className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
                    <span className="text-xs text-neutral-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <a 
                      href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}${doc.fileUrl}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs flex items-center text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> View
                    </a>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/5 text-neutral-400">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
