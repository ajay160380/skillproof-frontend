import React from 'react';

export const SkeletonLoader = ({ type = 'card' }: { type?: 'card' | 'text' | 'profile' }) => {
  if (type === 'card') {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 h-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-white/10 rounded-lg w-1/3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
            </div>
            <div className="h-6 w-6 bg-white/10 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-white/8 rounded-lg w-full relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
            </div>
            <div className="h-3 bg-white/8 rounded-lg w-5/6 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
            </div>
          </div>
        </div>
        <div className="h-10 bg-white/5 rounded-xl w-full mt-6 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-full relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-white/10 rounded-lg w-1/3 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
          </div>
          <div className="h-3 bg-white/8 rounded-lg w-1/4 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
          </div>
        </div>
      </div>
    );
  }

  // text
  return (
    <div className="h-4 bg-white/10 rounded-lg w-full relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
    </div>
  );
};
