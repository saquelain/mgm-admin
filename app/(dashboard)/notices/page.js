'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const TYPES = [
  { value: 'notice', label: 'Notices' },
  { value: 'result', label: 'Results' },
  { value: 'class-notice', label: 'Class Notices' },
];

export default function NoticesPage() {
  const [activeType, setActiveType] = useState('notice');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [tag, setTag] = useState('');
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchNotices = async (type) => {
    setLoading(true);
    try {
      const res = await api.get('/notices/index.php', { params: { type } });
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(activeType);
  }, [activeType]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', date);
    formData.append('tag', tag);
    formData.append('type', activeType);
    if (file) formData.append('file', file);

    try {
      await api.post('/notices/index.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTitle('');
      setDate('');
      setTag('');
      setFile(null);
      fetchNotices(activeType);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create notice');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/notices/delete.php?id=${id}`);
      fetchNotices(activeType);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Notices</h1>

      {/* Type tabs */}
      <div className="flex gap-2 mb-6">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-4 py-2 rounded text-sm ${
              activeType === t.value
                ? 'bg-black text-white'
                : 'bg-white border text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded border mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
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
            <label className="block text-xs font-medium mb-1">Date</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="2026-07-15"
              className="border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tag (optional)</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Important"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">File (optional PDF)</label>
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
            {creating ? 'Creating...' : `Add ${TYPES.find((t) => t.value === activeType)?.label.slice(0, -1)}`}
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : notices.length === 0 ? (
        <p className="text-sm text-gray-500">No entries yet.</p>
      ) : (
        <div className="bg-white border rounded divide-y">
          {notices.map((notice) => (
            <div key={notice._id} className="flex justify-between items-center p-3">
              <div>
                <p className="text-sm font-medium">{notice.title}</p>
                <p className="text-xs text-gray-500">
                  {notice.date}
                  {notice.tag && ` · ${notice.tag}`}
                </p>
                {notice.fileUrl && (
                  <a
                    href={notice.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View File
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(notice._id)}
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