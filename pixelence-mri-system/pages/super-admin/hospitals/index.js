// pages/super-admin/hospitals/index.js
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { anyApi } from 'convex/server';
import Layout from '../../../components/layout/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

export default function HospitalsList() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const hospitals = useQuery(anyApi.hospitals.list, {}) || [];
  const suspendMutation = useMutation(anyApi.hospitals.suspend);
  const activateMutation = useMutation(anyApi.hospitals.activate);

  const filtered = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.contactEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (hospital) => {
    if (hospital.status === 'active') {
      if (confirm(`Suspend ${hospital.name}? Their staff will be unable to log in.`)) {
        await suspendMutation({ hospitalId: hospital._id });
      }
    } else {
      await activateMutation({ hospitalId: hospital._id });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super-admin']}>
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Hospitals</h1>
                <p className="mt-1 text-sm text-gray-600">{hospitals.length} registered hospital{hospitals.length !== 1 ? 's' : ''}</p>
              </div>
              <Link href="/super-admin/hospitals/new" legacyBehavior>
                <a className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                  + Add Hospital
                </a>
              </Link>
            </div>

            {/* Filters */}
            <div className="mb-4 flex space-x-3">
              <input
                type="text"
                placeholder="Search hospitals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-xs rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 border"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 border"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((hospital) => (
                    <tr key={hospital._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                        <div className="text-xs text-gray-400">{hospital.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{hospital.contactEmail}</div>
                        <div className="text-xs text-gray-400">{hospital.contactPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          hospital.status === 'active' ? 'bg-green-100 text-green-800' :
                          hospital.status === 'suspended' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {hospital.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <Link href={`/super-admin/hospitals/${hospital._id}`} legacyBehavior>
                          <a className="text-purple-600 hover:text-purple-900">Manage</a>
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(hospital)}
                          className={`${
                            hospital.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {hospital.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No hospitals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
