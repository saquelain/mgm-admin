'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const LEVELS = [
  { value: 'ug', label: 'Undergraduate (UG)' },
  { value: 'pg', label: 'Postgraduate (PG)' },
];

export default function StudentsPage() {
  const [activeLevel, setActiveLevel] = useState('ug');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState('');
  const [label, setLabel] = useState('');
  const [sortYear, setSortYear] = useState('');
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchStudents = async (level) => {
    setLoading(true);
    try {
      const res = await api.get('/students/index.php', { params: { level } });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(activeLevel);
  }, [activeLevel]);

  // Auto-fill label from session, e.g. "2024-25" -> "UG Students List — Session 2024-25"
  const handleSessionChange = (value) => {
    setSession(value);
    const levelLabel = activeLevel === 'ug' ? 'UG' : 'PG';
    setLabel(value ? `${levelLabel} Students List — Session ${value}` : '');
    const yearMatch = value.match(/\d{4}/);
    if (yearMatch) setSortYear(yearMatch[0]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    const formData = new FormData();
    formData.append('session', session);
    formData.append('label', label);
    formData.append('level', activeLevel);
    formData.append('sort_year', sortYear);
    if (file) formData.append('file', file);

    try {
      await api.post('/students/index.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSession('');
      setLabel('');
      setSortYear('');
      setFile(null);
      fetchStudents(activeLevel);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create entry');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/students/delete.php?id=${id}`);
      fetchStudents(activeLevel);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Student Lists</h1>

      {/* Level tabs */}
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

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded border mb-6 space-y-3">
        <div className="flex gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Session</label>
            <input
              type="text"
              value={session}
              onChange={(e) => handleSessionChange(e.target.value)}
              placeholder="e.g. 2024-25 or 2020"
              className="border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Sort Year</label>
            <input
              type="number"
              value={sortYear}
              onChange={(e) => setSortYear(e.target.value)}
              placeholder="2024"
              className="border rounded px-3 py-2 text-sm w-24"
              required
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
            {creating ? 'Creating...' : 'Add Session'}
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-gray-500">No entries yet.</p>
      ) : (
        <div className="bg-white border rounded divide-y">
          {students.map((s) => (
            <div key={s._id} className="flex justify-between items-center p-3">
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-gray-500">Session {s.session} · sort year {s.sortYear}</p>
                {s.fileUrl && (
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View File
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(s._id)}
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