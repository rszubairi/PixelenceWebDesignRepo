// components/dashboard/Chart.js
import React from 'react';

const Chart = ({ title, data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
          <div className="mt-5 flex items-center justify-center h-64 text-gray-400">
            Loading chart data...
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.jobs)) || 1;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        <div className="mt-5">
          <div className="flex items-end space-x-2 h-64">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-purple-500 rounded-t"
                  style={{ height: `${(item.jobs / maxValue) * 100}%` }}
                ></div>
                <div className="mt-2 text-xs text-gray-500">{item.name}</div>
                <div className="text-xs font-medium text-gray-900">{item.jobs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chart;
