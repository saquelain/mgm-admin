'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const CATEGORIES = [
  { value: 'degree', label: 'Degree Courses' },
  { value: 'mbbs', label: 'MBBS' },
];

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState('degree');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('');
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchCourses = async (category) => {
    setLoading(true);
    try {
      const res = await api.get('/courses/index.php', { params: { category } });
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(activeCategory);
  }, [activeCategory]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (activeCategory === 'mbbs' && courses.length >= 1) {
      alert('MBBS already has an entry. Delete the existing one before adding a new one.');
      return;
    }

    setCreating(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('seats', seats);
    formData.append('category', activeCategory);
    if (file) formData.append('file', file);

    try {
      await api.post('/courses/index.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setName('');
      setSeats('');
      setFile(null);
      fetchCourses(activeCategory);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/courses/delete.php?id=${id}`);
      fetchCourses(activeCategory);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Courses</h1>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`px-4 py-2 rounded text-sm ${
              activeCategory === c.value
                ? 'bg-black text-white'
                : 'bg-white border text-gray-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded border mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">
              {activeCategory === 'mbbs' ? 'Name (e.g. MBBS)' : 'Course Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Seats</label>
            <input
              type="number"
              min="0"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="border rounded px-3 py-2 text-sm w-28"
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
            {creating ? 'Creating...' : `Add ${activeCategory === 'mbbs' ? 'MBBS Entry' : 'Course'}`}
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-gray-500">No entries yet.</p>
      ) : (
        <div className="bg-white border rounded divide-y">
          {courses.map((course) => (
            <div key={course._id} className="flex justify-between items-center p-3">
              <div>
                <p className="text-sm font-medium">{course.name}</p>
                <p className="text-xs text-gray-500">{course.seats} seats</p>
                {course.fileUrl && (
                  <a
                    href={course.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View File
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(course._id)}
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