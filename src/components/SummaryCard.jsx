import React from 'react';

export default function SummaryCard({ title, value, color, icon }) {
  return (
    <div className={`${color} rounded-2xl p-6 text-white shadow-lg shadow-gray-200 transform hover:-translate-y-1 transition duration-300`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold">R$ {value.toFixed(2)}</h3>
        </div>
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}