import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../styles/admin.css';

// A simple form used for create/edit inline
function UserForm({ initial = { name: '', email: '', role: 'user', password: '', passwordConfirm: '' }, onCancel, onSave }) {
  const [form, setForm] = useState(initial);

  useEffect(() => setForm(initial), [initial]);

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="user-form">
      <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Name" required />
      <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email" type="email" required />
      <select value={form.role} onChange={e=>setForm({...form, role: e.target.value})}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      {/* For create: password fields. For edit: backend may ignore empty password */}
      <input value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Password (optional on edit)" type="password" />
      <input value={form.passwordConfirm} onChange={e=>setForm({...form, passwordConfirm: e.target.value})} placeholder="Confirm password" type="password" />
      <div className="form-actions">
        <button type="submit" className="btn">Save</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users'); // GET /api/v1/users
      setUsers(res.data.data.users || res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (data) => {
    try {
      // require password and confirm for create
      if (!data.password || data.password !== data.passwordConfirm) {
        toast.error('Password required and must match confirm');
        return;
      }
      const payload = { name: data.name, email: data.email, password: data.password, passwordConfirm: data.passwordConfirm, role: data.role };
      const res = await api.post('/users', payload); // POST /api/v1/users
      toast.success('User created');
      setCreating(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Create failed');
    }
  };

  const handleUpdate = async (data) => {
    try {
      const id = editingUser._id || editingUser.id;
      // if password present, ensure confirm matches
      if (data.password && data.password !== data.passwordConfirm) {
        toast.error('Password and confirm do not match');
        return;
      }
      const payload = { name: data.name, email: data.email, role: data.role };
      // include password only if provided
      if (data.password) {
        payload.password = data.password;
        payload.passwordConfirm = data.passwordConfirm;
      }
      await api.put(`/users/${id}`, payload); // PUT /api/v1/users/:id
      toast.success('User updated');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    try {
      const id = user._id || user.id;
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Manage Users</h1>
        <div>
          <button className="btn" onClick={() => setCreating(true)}>Create User</button>
          <button className="btn btn-ghost" onClick={fetchUsers}>Refresh</button>
        </div>
      </header>

      <main className="admin-main">
        {creating && (
          <div className="panel">
            <h3>Create User</h3>
            <UserForm
              onCancel={() => setCreating(false)}
              onSave={handleCreate}
            />
          </div>
        )}

        {editingUser && (
          <div className="panel">
            <h3>Edit User</h3>
            <UserForm
              initial={{ name: editingUser.name, email: editingUser.email, role: editingUser.role, password: '', passwordConfirm: '' }}
              onCancel={() => setEditingUser(null)}
              onSave={handleUpdate}
            />
          </div>
        )}

        <section className="panel">
          <h3>User List</h3>

          {loading ? <p>Loading users...</p> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan="5">No users found</td></tr>
                )}
                {users.map(u => (
                  <tr key={u._id || u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{new Date(u.createdAt || u.created_at || u.created).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => setEditingUser(u)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
