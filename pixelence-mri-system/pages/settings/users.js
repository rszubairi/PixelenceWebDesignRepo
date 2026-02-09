// pages/settings/users.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Form from '../../components/ui/Form';

const UserManagement = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock data for users
    const mockUsers = [
      {
        id: 'USR-001',
        name: 'John Smith',
        email: 'john.smith@hospital.com',
        role: 'IT Administrator',
        status: 'Active',
        lastLogin: '2023-11-20T09:30:00',
        createdDate: '2023-01-15T10:00:00',
      },
      {
        id: 'USR-002',
        name: 'Emily Johnson',
        email: 'emily.johnson@hospital.com',
        role: 'Radiologist',
        status: 'Active',
        lastLogin: '2023-11-19T14:20:00',
        createdDate: '2023-02-10T11:30:00',
      },
      {
        id: 'USR-003',
        name: 'Michael Brown',
        email: 'michael.brown@hospital.com',
        role: 'Finance User',
        status: 'Inactive',
        lastLogin: '2023-11-15T16:45:00',
        createdDate: '2023-03-05T09:15:00',
      },
      {
        id: 'USR-004',
        name: 'Sarah Davis',
        email: 'sarah.davis@hospital.com',
        role: 'Radiographer',
        status: 'Active',
        lastLogin: '2023-11-20T08:10:00',
        createdDate: '2023-04-20T14:00:00',
      },
      {
        id: 'USR-005',
        name: 'Robert Wilson',
        email: 'robert.wilson@hospital.com',
        role: 'Doctor',
        status: 'Active',
        lastLogin: '2023-11-18T11:25:00',
        createdDate: '2023-05-12T13:45:00',
      },
    ];
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(userItem => {
    const matchesFilter = filter === 'all' || userItem.status === filter;
    const userName = userItem.name || `${userItem.firstName || ''} ${userItem.lastName || ''}`.trim();
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateUser = (formData) => {
    // In a real app, this would make an API call
    const newUser = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      ...formData,
      status: 'Active',
      lastLogin: null,
      createdDate: new Date().toISOString(),
    };
    setUsers([...users, newUser]);
    setShowCreateModal(false);
  };

  const handleEditUser = (formData) => {
    // In a real app, this would make an API call
    const updatedUsers = users.map(user =>
      user.id === editingUser.id ? { ...user, ...formData } : user
    );
    setUsers(updatedUsers);
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    // In a real app, this would make an API call
    setUsers(users.filter(user => user.id !== userId));
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const columns = [
    { key: 'id', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status', format: (status) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {status}
      </span>
    )},
    { key: 'lastLogin', label: 'Last Login', format: (date) => date ? new Date(date).toLocaleDateString() : 'Never' },
    { key: 'actions', label: 'Actions', format: (_, row) => (
      <div className="flex space-x-2">
        <Button size="sm" variant="secondary" onClick={() => openEditModal(row)}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleDeleteUser(row.id)}>
          Delete
        </Button>
      </div>
    )},
  ];

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              Add New User
            </Button>
          </div>
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="max-w-xs w-full">
                      <label htmlFor="search" className="sr-only">Search</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          id="search"
                          name="search"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="Search users"
                          type="search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-4">
                  <label htmlFor="filter" className="sr-only">Filter</label>
                  <select
                    id="filter"
                    name="filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <Table columns={columns} data={filteredUsers} />
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal title="Create New User" onClose={() => setShowCreateModal(false)}>
          <Form
            fields={[
              { name: 'name', label: 'Full Name', type: 'text', required: true },
              { name: 'email', label: 'Email Address', type: 'email', required: true },
              { name: 'role', label: 'Role', type: 'select', options: ['IT Administrator', 'Radiologist', 'Radiographer', 'Finance User', 'Doctor'], required: true },
            ]}
            onSubmit={handleCreateUser}
            submitText="Create User"
          />
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <Modal title="Edit User" onClose={() => { setShowEditModal(false); setEditingUser(null); }}>
          <Form
            fields={[
              { name: 'name', label: 'Full Name', type: 'text', required: true },
              { name: 'email', label: 'Email Address', type: 'email', required: true },
              { name: 'role', label: 'Role', type: 'select', options: ['IT Administrator', 'Radiologist', 'Radiographer', 'Finance User', 'Doctor'], required: true },
              { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
            ]}
            onSubmit={handleEditUser}
            submitText="Update User"
            initialData={editingUser}
          />
        </Modal>
      )}
    </Layout>
  );
};

export default UserManagement;
