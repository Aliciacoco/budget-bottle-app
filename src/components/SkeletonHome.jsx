import React from 'react';

const SkeletonHome = () => (
  <div className="min-h-screen bg-white flex flex-col animate-pulse">
    <div className="px-6 pt-12 pb-4">
      <div className="h-6 bg-gray-200 rounded w-40 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-80 h-96 bg-gray-200 rounded-3xl"></div>
    </div>
    <div className="h-28 bg-gray-300"></div>
  </div>
);

export default SkeletonHome;