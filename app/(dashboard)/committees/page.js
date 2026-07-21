'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CommitteesPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [committees, setCommittees] = useState([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingCommittees, setLoadingCommittees] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Group form
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Committee form
  const [committeeName, setCommitteeName] = useState('');
  const [committeeShortName, setCommitteeShortName] = useState('');
  const [committeeDesc, setCommitteeDesc] = useState('');
  const [creatingCommittee, setCreatingCommittee] = useState(false);

  // Document form
  const [docLabel, setDocLabel] = useState('');
  const [docDate, setDocDate] = useState('');
  const [docTag, setDocTag] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [creatingDoc, setCreatingDoc] = useState(false);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await api.get('/committee-groups/index.php');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchCommittees = async (groupId) => {
    setLoadingCommittees(true);
    try {
      const res = await api.get('/committees/index.php', { params: { group_id: groupId } });
      setCommittees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommittees(false);
    }
  };

  const fetchDocuments = async (committeeId) => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/committee-documents/index.php', { params: { committee_id: committeeId } });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    setSelectedCommitteeId(null);
    setDocuments([]);
    if (selectedGroupId) fetchCommittees(selectedGroupId);
    else setCommittees([]);
  }, [selectedGroupId]);

  useEffect(() => {
    if (selectedCommitteeId) fetchDocuments(selectedCommitteeId);
  }, [selectedCommitteeId]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreatingGroup(true);
    try {
      await api.post('/committee-groups/index.php', new URLSearchParams({
        slug: slugify(groupTitle),
        title: groupTitle,
        description: groupDesc,
      }));
      setGroupTitle('');
      setGroupDesc('');
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Delete this entire category, including ALL committees and documents inside it? This cannot be undone.')) return;
    try {
      await api.delete(`/committee-groups/delete.php?id=${id}`);
      if (selectedGroupId === id) setSelectedGroupId(null);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleCreateCommittee = async (e) => {
    e.preventDefault();
    setCreatingCommittee(true);
    try {
      await api.post('/committees/index.php', new URLSearchParams({
        group_id: selectedGroupId,
        slug: slugify(committeeName),
        name: committeeName,
        short_name: committeeShortName,
        description: committeeDesc,
      }));
      setCommitteeName('');
      setCommitteeShortName('');
      setCommitteeDesc('');
      fetchCommittees(selectedGroupId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create committee');
    } finally {
      setCreatingCommittee(false);
    }
  };

  const handleDeleteCommittee = async (id) => {
    if (!confirm('Delete this committee and all its documents?')) return;
    try {
      await api.delete(`/committees/delete.php?id=${id}`);
      if (selectedCommitteeId === id) setSelectedCommitteeId(null);
      fetchCommittees(selectedGroupId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete committee');
    }
  };

  const handleCreateDoc = async (e) => {
    e.preventDefault();
    setCreatingDoc(true);

    const formData = new FormData();
    formData.append('committee_id', selectedCommitteeId);
    formData.append('label', docLabel);
    formData.append('date', docDate);
    formData.append('tag', docTag);
    if (docFile) formData.append('file', docFile);

    try {
      await api.post('/committee-documents/index.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocLabel('');
      setDocDate('');
      setDocTag('');
      setDocFile(null);
      fetchDocuments(selectedCommitteeId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add document');
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/committee-documents/delete.php?id=${id}`);
      fetchDocuments(selectedCommitteeId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const selectedGroup = groups.find((g) => g._id === selectedGroupId);
  const selectedCommittee = committees.find((c) => c._id === selectedCommitteeId);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Committees</h1>

      <div className="grid grid-cols-3 gap-4">
        {/* COLUMN 1: Groups */}
        <div>
          <h2 className="text-sm font-semibold mb-2">Categories</h2>
          <form onSubmit={handleCreateGroup} className="bg-white p-3 rounded border mb-3 space-y-2">
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Category title"
              className="w-full border rounded px-2 py-1.5 text-sm"
              required
            />
            <textarea
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="Description"
              className="w-full border rounded px-2 py-1.5 text-sm"
              rows={2}
            />
            <button
              type="submit"
              disabled={creatingGroup}
              className="bg-black text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 w-full"
            >
              {creatingGroup ? 'Creating...' : 'Add Category'}
            </button>
          </form>

          {loadingGroups ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : (
            <div className="bg-white border rounded divide-y">
              {groups.map((g) => (
                <div
                  key={g._id}
                  className={`p-2.5 cursor-pointer flex justify-between items-center ${
                    selectedGroupId === g._id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedGroupId(g._id)}
                >
                  <p className="text-sm">{g.title}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g._id); }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMN 2: Committees */}
        <div>
          <h2 className="text-sm font-semibold mb-2">
            Committees {selectedGroup && `— ${selectedGroup.title}`}
          </h2>
          {!selectedGroupId ? (
            <p className="text-xs text-gray-500">Select a category first.</p>
          ) : (
            <>
              <form onSubmit={handleCreateCommittee} className="bg-white p-3 rounded border mb-3 space-y-2">
                <input
                  type="text"
                  value={committeeName}
                  onChange={(e) => setCommitteeName(e.target.value)}
                  placeholder="Committee name"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                  required
                />
                <input
                  type="text"
                  value={committeeShortName}
                  onChange={(e) => setCommitteeShortName(e.target.value)}
                  placeholder="Short name (e.g. ARC)"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
                <textarea
                  value={committeeDesc}
                  onChange={(e) => setCommitteeDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={creatingCommittee}
                  className="bg-black text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 w-full"
                >
                  {creatingCommittee ? 'Creating...' : 'Add Committee'}
                </button>
              </form>

              {loadingCommittees ? (
                <p className="text-xs text-gray-500">Loading...</p>
              ) : (
                <div className="bg-white border rounded divide-y">
                  {committees.map((c) => (
                    <div
                      key={c._id}
                      className={`p-2.5 cursor-pointer flex justify-between items-center ${
                        selectedCommitteeId === c._id ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => setSelectedCommitteeId(c._id)}
                    >
                      <p className="text-sm">{c.name}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCommittee(c._id); }}
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

        {/* COLUMN 3: Documents */}
        <div>
          <h2 className="text-sm font-semibold mb-2">
            Documents {selectedCommittee && `— ${selectedCommittee.name}`}
          </h2>
          {!selectedCommitteeId ? (
            <p className="text-xs text-gray-500">Select a committee first.</p>
          ) : (
            <>
              <form onSubmit={handleCreateDoc} className="bg-white p-3 rounded border mb-3 space-y-2">
              <input
                type="text"
                value={docLabel}
                onChange={(e) => setDocLabel(e.target.value)}
                placeholder="Document label"
                className="w-full border rounded px-2 py-1.5 text-sm"
                required
                />
                <div className="flex gap-2">
                <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    placeholder="Date (optional)"
                    className="flex-1 border rounded px-2 py-1.5 text-sm"
                />
                <input
                    type="text"
                    value={docTag}
                    onChange={(e) => setDocTag(e.target.value)}
                    placeholder="Tag (optional)"
                    className="flex-1 border rounded px-2 py-1.5 text-sm"
                />
                </div>
                <div>
                <label className="block text-xs font-medium mb-1">PDF File (optional)</label>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setDocFile(e.target.files[0] || null)}
                    className="text-xs"
                />
                </div>
                <button
                type="submit"
                disabled={creatingDoc}
                className="bg-black text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 w-full"
                >
                {creatingDoc ? 'Adding...' : 'Add Document'}
                </button>
              </form>

              {loadingDocs ? (
                <p className="text-xs text-gray-500">Loading...</p>
              ) : (
                <div className="bg-white border rounded divide-y">
                  {documents.map((d) => (
                    <div key={d._id} className="p-2.5">
                      <div className="flex justify-between items-start">
                        <p className="text-sm">{d.label}</p>
                        <button
                          onClick={() => handleDeleteDoc(d._id)}
                          className="text-xs text-red-600 hover:underline shrink-0 ml-2"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {d.date && `${d.date} · `}{d.tag}
                      </p>
                      {d.fileUrl && (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View PDF
                        </a>
                      )}
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