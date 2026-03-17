// components/ui/Notification.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { anyApi } from 'convex/server';

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const Notification = ({ onClose, userId }) => {
  const router = useRouter();

  // Use anyApi for flexibility since Convex types are not fully generated yet
  const notifications = useQuery(anyApi.notifications.getForUser, userId ? { userId, limit: 10 } : 'skip') || [];
  const markReadMutation = useMutation(anyApi.notifications.markRead);
  const markAllReadMutation = useMutation(anyApi.notifications.markAllRead);

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markReadMutation({ notificationId: notification._id });
    }
    onClose();
    if (notification.referenceType === 'report' && notification.referenceId) {
      router.push(`/reports/${notification.referenceId}`);
    } else if (notification.referenceType === 'job' && notification.referenceId) {
      router.push(`/reports?jobId=${notification.referenceId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (userId) {
      await markAllReadMutation({ userId });
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
      <div className="px-4 py-3 bg-purple-600 text-white flex justify-between items-center">
        <h3 className="text-sm font-medium">Notifications</h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-purple-200 hover:text-white underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li
                key={notification._id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-purple-50' : ''}`}
                onClick={() => handleClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-1">
                    <div className={`h-2 w-2 rounded-full ${notification.isRead ? 'bg-gray-300' : 'bg-purple-600'}`}></div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            No notifications
          </div>
        )}
      </div>
      <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-200">
        <button
          onClick={onClose}
          className="text-sm font-medium text-purple-600 hover:text-purple-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Notification;
