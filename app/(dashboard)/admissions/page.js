'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const LEVELS = [
  { value: 'ug', label: 'Undergraduate' },
  { value: 'pg', label: 'Postgraduate' },
];

const TAG_COLORS = [
  { value: 'blue', label: 'Blue (e.g. Fee Structure)' },
  { value: 'green', label: 'Green (e.g. Brochure)' },
  { value: 'red', label: 'Red (e.g. Important Notice)' },
];

export default function AdmissionsPage() {
  const [activeLevel, setActiveLevel] = useState('ug');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [tagColor, setTagColor] = useState('blue');
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchDocs = async (level) => {
    setLoading(true);
    try {
      const res = await api.get('/admission-documents/index.php', { params: { level } });
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs(activeLevel);
  }, [activeLevel]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tag', tag);
    formData.append('tag_color', tagColor);
    formData.append('level', activeLevel);
    if (file) formData.append('file', file);

    try {
      await api.post('/admission-documents/index.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTitle('');
      setDescription('');
      setTag('');
      setTagColor('blue');
      setFile(null);
      fetchDocs(activeLevel);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/admission-documents/delete.php?id=${id}`);
      fetchDocs(activeLevel);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Admissions Documents</h1>

      <div className="flex gap-2 mb-6">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => setActiveLevel(l.value)}
            className={`px-4 py-2 rounded text-sm ${
              activeLevel === l.value
                ? 'bg-black text-white'
                : 'bg-white border text-gray-700'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreate} className="bg-white p-4 rounded border mb-6 space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Tag (optional)</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Fee Structure"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tag Color</label>
            <select
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              {TAG_COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">File (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Add Document'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-gray-500">No documents yet.</p>
      ) : (
        <div className="bg-white border rounded divide-y">
          {docs.map((d) => (
            <div key={d._id} className="flex justify-between items-center p-3">
              <div>
                <p className="text-sm font-medium">{d.title}</p>
                <p className="text-xs text-gray-500">
                  {d.tag && `${d.tag} · `}{d.tagColor}
                </p>
                {d.fileUrl && (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View File
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(d._id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}