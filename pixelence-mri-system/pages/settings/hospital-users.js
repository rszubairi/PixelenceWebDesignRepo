// pages/settings/hospital-users.js
import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { anyApi } from 'convex/server';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_LABELS = {
  'hospital-admin': 'Hospital Admin',
  'it-admin': 'IT Admin',
  'doctor': 'Doctor',
  'radiologist': 'Radiologist',
  'radiographer': 'Radiographer',
  'finance-user': 'Finance User',
};

export default function HospitalUsers() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hospitalUsers = useQuery(
    anyApi.users.listByHospital,
    user?.hospitalId ? { hospitalId: user.hospitalId } : 'skip'
  ) || [];

  const createUser = useAction(anyApi.users.create);
  const deactivateUser = useMutation(anyApi.users.deactivate);
  const updateUser = useMutation(anyApi.users.update);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'doctor',
    phone: '',
    department: '',
  });

  const filtered = hospitalUsers.filter((u) => {
    const matchesSearch =
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createUser({ ...newUser, hospitalId: user.hospitalId });

      // Send welcome email with credentials (fire-and-forget — don't block on failure)
      fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001'}/api/notifications/user-created`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          password: newUser.password,
        }),
      }).catch((err) => console.warn('Welcome email failed:', err));

      setSuccess(`User ${newUser.firstName} ${newUser.lastName} created. A welcome email has been sent.`);
      setShowAddModal(false);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'doctor', phone: '', department: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId, name) => {
    if (confirm(`Deactivate ${name}? They will no longer be able to log in.`)) {
      await deactivateUser({ userId });
    }
  };

  const handleReactivate = async (userId) => {
    await updateUser({ userId, isActive: true });
  };

  return (
    <ProtectedRoute allowedRoles={['hospital-admin', 'it-admin', 'super-admin']}>
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Staff Users</h1>
                <p className="mt-1 text-sm text-gray-600">{hospitalUsers.filter(u => u.isActive).length} active · {hospitalUsers.length} total</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                + Add Staff User
              </button>
            </div>

            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex space-x-3">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-xs rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 border"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm text-sm px-3 py-2 border"
              >
                <option value="all">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((u) => (
                    <tr key={u._id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-purple-700">
                              {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{ROLE_LABELS[u.role] || u.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.department || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        {u.isActive ? (
                          <button
                            onClick={() => handleDeactivate(u._id, `${u.firstName} ${u.lastName}`)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(u._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Add Staff User</h2>
                  {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">First Name *</label>
                        <input
                          type="text" required
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Last Name *</label>
                        <input
                          type="text" required
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Email *</label>
                      <input
                        type="email" required
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Password *</label>
                      <input
                        type="password" required minLength={8}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Min 8 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Role *</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      >
                        {Object.entries(ROLE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Department</label>
                        <input
                          type="text"
                          value={newUser.department}
                          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddModal(false); setError(''); }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit" disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                      >
                        {loading ? 'Creating...' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
