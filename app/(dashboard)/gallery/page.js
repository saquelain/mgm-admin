'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function GalleryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/gallery');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/gallery', { title, date });
      setTitle('');
      setDate('');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadPhotos = async (categoryId, files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('photos', file);
    }
    try {
      await api.post(`/gallery/${categoryId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload photos');
    }
  };

  const handleDeletePhoto = async (categoryId, photoId) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await api.delete(`/gallery/${categoryId}/photos/${photoId}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete photo');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Delete this entire category and all its photos?')) return;
    try {
      await api.delete(`/gallery/${categoryId}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Gallery</h1>

      {/* Create category form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded border mb-6 flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Date</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g. July 2026"
            className="border rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Category'}
        </button>
      </form>

      {/* Categories list */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet.</p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-white border rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{cat.title}</h3>
                  <p className="text-xs text-gray-500">{cat.date}</p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete Category
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {cat.photos.map((photo) => (
                  <div key={photo._id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => handleDeletePhoto(cat._id, photo._id)}
                      className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    handleUploadPhotos(cat._id, e.target.files);
                    e.target.value = '';
                  }
                }}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}