// pages/super-admin/hospitals/[id].js
import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { anyApi } from 'convex/server';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

export default function HospitalDetail() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const hospital = useQuery(anyApi.hospitals.getById, id ? { hospitalId: id } : 'skip');
  const license = useQuery(anyApi.licenses.getByHospital, id ? { hospitalId: id } : 'skip');
  const licenseHistory = useQuery(anyApi.licenses.getAllByHospital, id ? { hospitalId: id } : 'skip') || [];
  const hospitalUsers = useQuery(anyApi.users.listByHospital, id ? { hospitalId: id } : 'skip') || [];

  const suspendMutation = useMutation(anyApi.hospitals.suspend);
  const activateMutation = useMutation(anyApi.hospitals.activate);
  const updateMutation = useMutation(anyApi.hospitals.update);
  const revokeLicense = useMutation(anyApi.licenses.revoke);
  const deactivateUser = useMutation(anyApi.users.deactivate);
  const createUser = useAction(anyApi.users.create);

  const [showAddUser, setShowAddUser] = useState(false);
  const [showRenewLicense, setShowRenewLicense] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'hospital-admin',
    phone: '',
    department: '',
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserLoading(true);
    try {
      await createUser({ ...newUser, hospitalId: id });

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
          hospitalName: hospital?.name,
        }),
      }).catch((err) => console.warn('Welcome email failed:', err));

      setShowAddUser(false);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'hospital-admin', phone: '', department: '' });
    } catch (err) {
      setUserError(err.message || 'Failed to create user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleToggleHospitalStatus = async () => {
    if (!hospital) return;
    if (hospital.status === 'active') {
      if (confirm(`Suspend ${hospital.name}? Staff will be unable to log in.`)) {
        await suspendMutation({ hospitalId: id });
      }
    } else {
      await activateMutation({ hospitalId: id });
    }
  };

  if (!hospital && id) {
    return (
      <ProtectedRoute allowedRoles={['super-admin']}>
        <Layout user={user}>
          <div className="py-6 text-center text-gray-500">Loading hospital details...</div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const daysUntilExpiry = license
    ? Math.ceil((new Date(license.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <ProtectedRoute allowedRoles={['super-admin']}>
      <Layout user={user}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <button
                  onClick={() => router.push('/super-admin/hospitals')}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center"
                >
                  ← Back to Hospitals
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">{hospital?.name}</h1>
                <p className="mt-1 text-sm text-gray-600">{hospital?.address}</p>
              </div>
              <div className="flex space-x-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  hospital?.status === 'active' ? 'bg-green-100 text-green-800' :
                  hospital?.status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {hospital?.status}
                </span>
                <button
                  onClick={handleToggleHospitalStatus}
                  className={`px-3 py-1 text-sm font-medium rounded-md border ${
                    hospital?.status === 'active'
                      ? 'border-red-300 text-red-700 hover:bg-red-50'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {hospital?.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: hospital info + users */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hospital Info */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Hospital Details</h2>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                      <dd className="text-sm text-gray-900">{hospital?.contactEmail}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
                      <dd className="text-sm text-gray-900">{hospital?.contactPhone}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">
                        {hospital?.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Staff Users */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Staff Users ({hospitalUsers.length})</h2>
                    <button
                      onClick={() => setShowAddUser(true)}
                      className="text-sm text-purple-600 hover:text-purple-500 font-medium"
                    >
                      + Add User
                    </button>
                  </div>

                  {showAddUser && (
                    <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Add New User</h3>
                      {userError && <p className="text-xs text-red-600 mb-2">{userError}</p>}
                      <form onSubmit={handleAddUser} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text" placeholder="First Name" required
                            value={newUser.firstName}
                            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                          />
                          <input
                            type="text" placeholder="Last Name" required
                            value={newUser.lastName}
                            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <input
                          type="email" placeholder="Email" required
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                        />
                        <input
                          type="password" placeholder="Password" required minLength={8}
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                        />
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                        >
                          <option value="hospital-admin">Hospital Admin</option>
                          <option value="it-admin">IT Admin</option>
                          <option value="doctor">Doctor</option>
                          <option value="radiologist">Radiologist</option>
                          <option value="radiographer">Radiographer</option>
                          <option value="finance-user">Finance User</option>
                        </select>
                        <div className="flex space-x-2">
                          <button
                            type="submit" disabled={userLoading}
                            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-purple-300"
                          >
                            {userLoading ? 'Creating...' : 'Create User'}
                          </button>
                          <button
                            type="button" onClick={() => setShowAddUser(false)}
                            className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-2">
                    {hospitalUsers.map((u) => (
                      <div key={u._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-500">{u.email} · <span className="capitalize">{u.role}</span></p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {u.isActive && (
                            <button
                              onClick={() => deactivateUser({ userId: u._id })}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {hospitalUsers.length === 0 && (
                      <p className="text-sm text-gray-500">No users yet. Add the hospital admin first.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: license */}
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Active License</h2>
                  {license && license.status === 'active' ? (
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">License Key</p>
                        <p className="text-sm font-mono font-medium text-gray-900 break-all">{license.licenseKey}</p>
                      </div>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Billing</dt>
                          <dd className="text-sm text-gray-900 capitalize">{license.billingType.replace('-', ' ')}</dd>
                        </div>
                        {license.billingType === 'per-scan' ? (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Rate / scan</dt>
                            <dd className="text-sm text-gray-900">${license.perScanRate}</dd>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Monthly rate</dt>
                              <dd className="text-sm text-gray-900">${license.monthlyRate}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Min. scans/mo</dt>
                              <dd className="text-sm text-gray-900">{license.minimumScans}</dd>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Start</dt>
                          <dd className="text-sm text-gray-900">{new Date(license.startDate).toLocaleDateString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Expiry</dt>
                          <dd className={`text-sm font-medium ${daysUntilExpiry <= 30 ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(license.expiryDate).toLocaleDateString()}
                            {daysUntilExpiry !== null && ` (${daysUntilExpiry}d)`}
                          </dd>
                        </div>
                      </dl>
                      <div className="pt-2 flex space-x-2">
                        <button
                          onClick={() => revokeLicense({ licenseId: license._id })}
                          className="flex-1 text-xs border border-red-300 text-red-700 px-3 py-1.5 rounded hover:bg-red-50"
                        >
                          Revoke
                        </button>
                        <button
                          onClick={() => router.push(`/super-admin/hospitals/new?renew=${id}`)}
                          className="flex-1 text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700"
                        >
                          Renew / Reissue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-600 font-medium">No active license</p>
                      <p className="text-xs text-gray-500 mt-1 mb-3">Hospital staff cannot log in without an active license.</p>
                      <button
                        onClick={() => router.push(`/super-admin/hospitals/new`)}
                        className="text-sm text-purple-600 hover:text-purple-500"
                      >
                        Issue License
                      </button>
                    </div>
                  )}
                </div>

                {/* License History */}
                {licenseHistory.length > 1 && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">License History</h3>
                    <div className="space-y-2">
                      {licenseHistory.map((lic) => (
                        <div key={lic._id} className="flex justify-between text-xs">
                          <span className="text-gray-500">{new Date(lic.createdAt).toLocaleDateString()}</span>
                          <span className={`font-medium ${
                            lic.status === 'active' ? 'text-green-600' :
                            lic.status === 'expired' ? 'text-gray-400' : 'text-red-600'
                          }`}>{lic.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
