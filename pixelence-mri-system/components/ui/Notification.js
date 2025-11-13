// components/ui/Notification.js
import React from 'react';

const Notification = ({ onClose }) => {
  const notifications = [
    { id: 1, title: 'New report ready for review', time: '5 minutes ago', read: false },
    { id: 2, title: 'Job JOB-2023-005 processing completed', time: '1 hour ago', read: false },
    { id: 3, title: 'System maintenance scheduled', time: '3 hours ago', read: true },
  ];

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
      <div className="px-4 py-3 bg-purple-600 text-white">
        <h3 className="text-sm font-medium">Notifications</h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li key={notification.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className={`h-2 w-2 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-purple-600'}`}></div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No new notifications
          </div>
        )}
      </div>
      <div className="px-4 py-2 bg-gray-50 text-center">
        <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-500">
          View all notifications
        </a>
      </div>
    </div>
  );
};

export default Notification;