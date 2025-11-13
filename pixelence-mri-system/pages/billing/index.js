// pages/billing/index.js
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';

const Billing = () => {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('pixelence_user'));
    setUser(userData);

    // Mock invoice data
    const mockInvoices = [
      {
        id: 'INV-2023-001',
        date: '2023-11-01T00:00:00',
        dueDate: '2023-11-30T00:00:00',
        amount: 2500.00,
        status: 'Paid',
        description: 'Monthly License Fee - November 2023',
        paymentMethod: 'Credit Card ****4532',
      },
      {
        id: 'INV-2023-002',
        date: '2023-10-01T00:00:00',
        dueDate: '2023-10-31T00:00:00',
        amount: 2500.00,
        status: 'Paid',
        description: 'Monthly License Fee - October 2023',
        paymentMethod: 'Credit Card ****4532',
      },
      {
        id: 'INV-2023-003',
        date: '2023-12-01T00:00:00',
        dueDate: '2023-12-31T00:00:00',
        amount: 2500.00,
        status: 'Pending',
        description: 'Monthly License Fee - December 2023',
        paymentMethod: null,
      },
      {
        id: 'INV-2023-004',
        date: '2023-09-01T00:00:00',
        dueDate: '2023-09-30T00:00:00',
        amount: 2500.00,
        status: 'Paid',
        description: 'Monthly License Fee - September 2023',
        paymentMethod: 'Bank Transfer',
      },
      {
        id: 'INV-2023-005',
        date: '2023-08-01T00:00:00',
        dueDate: '2023-08-31T00:00:00',
        amount: 2500.00,
        status: 'Overdue',
        description: 'Monthly License Fee - August 2023',
        paymentMethod: null,
      },
    ];
    setInvoices(mockInvoices);
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesFilter = filter === 'all' || invoice.status === filter;
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTotalAmount = () => {
    return filteredInvoices.reduce((total, invoice) => total + invoice.amount, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const columns = [
    { key: 'id', label: 'Invoice ID' },
    { key: 'date', label: 'Date', format: (date) => new Date(date).toLocaleDateString() },
    { key: 'dueDate', label: 'Due Date', format: (date) => new Date(date).toLocaleDateString() },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', format: (amount) => `$${amount.toFixed(2)}` },
    { key: 'status', label: 'Status', format: (status) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
        {status}
      </span>
    )},
    { key: 'actions', label: 'Actions', format: (_, row) => (
      <div className="flex space-x-2">
        <Button size="sm" variant="secondary" onClick={() => alert(`Download invoice ${row.id}`)}>
          Download
        </Button>
        {row.status === 'Pending' && (
          <Button size="sm" onClick={() => alert(`Pay invoice ${row.id}`)}>
            Pay Now
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <Layout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Billing & Invoices</h1>
            <Button onClick={() => alert('Payment methods management would be implemented here')}>
              Manage Payment Methods
            </Button>
          </div>

          {/* Billing Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Billed</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">${getTotalAmount().toFixed(2)}</p>
              <p className="mt-1 text-sm text-gray-500">All time</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">
                ${invoices.filter(inv => inv.status === 'Pending').reduce((total, inv) => total + inv.amount, 0).toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-gray-500">Due this month</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
              <p className="mt-2 text-3xl font-semibold text-red-600">
                ${invoices.filter(inv => inv.status === 'Overdue').reduce((total, inv) => total + inv.amount, 0).toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-gray-500">Requires attention</p>
            </div>
          </div>

          {/* Invoices Table */}
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
                          placeholder="Search invoices"
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
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>
            <Table columns={columns} data={filteredInvoices} />
          </div>

          {/* Billing Information */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Current Plan</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Plan:</dt>
                    <dd className="text-sm text-gray-900">Enterprise License</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Monthly Fee:</dt>
                    <dd className="text-sm text-gray-900">$2,500.00</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Next Billing:</dt>
                    <dd className="text-sm text-gray-900">December 1, 2023</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Method</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Type:</dt>
                    <dd className="text-sm text-gray-900">Credit Card</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Last 4:</dt>
                    <dd className="text-sm text-gray-900">****4532</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Expires:</dt>
                    <dd className="text-sm text-gray-900">12/2025</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Billing;
