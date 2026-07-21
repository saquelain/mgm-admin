'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const CATEGORIES = [
  { value: 'teaching', label: 'Teaching Faculty' },
  { value: 'non-teaching', label: 'Non-Teaching Staff' },
];

export default function FacultyPage() {
  const [activeCategory, setActiveCategory] = useState('teaching');
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Department form
  const [deptName, setDeptName] = useState('');
  const [deptFile, setDeptFile] = useState(null);
  const [creatingDept, setCreatingDept] = useState(false);

  // Member form
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [creatingMember, setCreatingMember] = useState(false);

  const fetchDepartments = async (category) => {
    setLoadingDepts(true);
    try {
      const res = await api.get('/faculty-departments/index.php', { params: { category } });
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchMembers = async (departmentId) => {
    setLoadingMembers(true);
    try {
      const res = await api.get('/faculty-members/index.php', { params: { department_id: departmentId } });
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    setSelectedDeptId(null);
    setMembers([]);
    fetchDepartments(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (selectedDeptId) fetchMembers(selectedDeptId);
  }, [selectedDeptId]);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setCreatingDept(true);

    const formData = new FormData();
    formData.append('name', deptName);
    formData.append('category', activeCategory);
    if (deptFile) formData.append('file', deptFile);

    try {
      await api.post('/faculty-departments/index.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDeptName('');
      setDeptFile(null);
      fetchDepartments(activeCategory);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    } finally {
      setCreatingDept(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!confirm('Delete this entire department and ALL its members? This cannot be undone.')) return;
    try {
      await api.delete(`/faculty-departments/delete.php?id=${id}`);
      if (selectedDeptId === id) {
        setSelectedDeptId(null);
        setMembers([]);
      }
      fetchDepartments(activeCategory);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setCreatingMember(true);

    const formData = new FormData();
    formData.append('department_id', selectedDeptId);
    formData.append('name', memberName);
    formData.append('role', memberRole);

    try {
      await api.post('/faculty-members/index.php', formData);
      setMemberName('');
      setMemberRole('');
      fetchMembers(selectedDeptId);
      fetchDepartments(activeCategory); // refresh member counts
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setCreatingMember(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!confirm('Remove this person?')) return;
    try {
      await api.delete(`/faculty-members/delete.php?id=${id}`);
      fetchMembers(selectedDeptId);
      fetchDepartments(activeCategory);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete member');
    }
  };

  const selectedDept = departments.find((d) => d._id === selectedDeptId);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Faculty & Staff</h1>

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

      <div className="grid grid-cols-3 gap-4">
        {/* LEFT: Departments list + create form */}
        <div className="col-span-1">
          <form onSubmit={handleCreateDept} className="bg-white p-4 rounded border mb-4 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">New Department Name</label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            {activeCategory === 'teaching' && (
              <div>
                <label className="block text-xs font-medium mb-1">Department PDF (optional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setDeptFile(e.target.files[0] || null)}
                  className="text-xs"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={creatingDept}
              className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50 w-full"
            >
              {creatingDept ? 'Creating...' : 'Add Department'}
            </button>
          </form>

          {loadingDepts ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-gray-500">No departments yet.</p>
          ) : (
            <div className="bg-white border rounded divide-y">
              {departments.map((d) => (
                <div
                  key={d._id}
                  className={`p-3 cursor-pointer flex justify-between items-center ${
                    selectedDeptId === d._id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedDeptId(d._id)}
                >
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    {d.fileUrl && (
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View PDF
                      </a>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDept(d._id); }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Members of selected department */}
        <div className="col-span-2">
          {!selectedDeptId ? (
            <div className="bg-white border rounded p-8 text-center text-sm text-gray-500">
              Select a department on the left to manage its members.
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold mb-3">
                Members of {selectedDept?.name} ({members.length})
              </h2>

              <form onSubmit={handleCreateMember} className="bg-white p-4 rounded border mb-4 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Dr. A. B. Name"
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Role</label>
                  <input
                    type="text"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    placeholder="Professor & HOD"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingMember}
                  className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                  {creatingMember ? 'Adding...' : 'Add'}
                </button>
              </form>

              {loadingMembers ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-gray-500">No members yet.</p>
              ) : (
                <div className="bg-white border rounded divide-y max-h-[600px] overflow-y-auto">
                  {members.map((m) => (
                    <div key={m._id} className="flex justify-between items-center p-3">
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        {m.role && <p className="text-xs text-gray-500">{m.role}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteMember(m._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}