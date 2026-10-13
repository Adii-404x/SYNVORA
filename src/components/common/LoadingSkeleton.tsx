import React from 'react';

interface LoadingSkeletonProps {
  type?: 'cards' | 'list' | 'detail' | 'hub';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'cards', count = 3 }) => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Reassurance header skeleton */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-xs space-y-2">
        <div className="h-5 bg-teal-100/70 rounded-md w-1/3"></div>
        <div className="h-3.5 bg-slate-100 rounded-md w-3/4"></div>
      </div>

      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 shrink-0"></div>
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-40"></div>
                <div className="h-3 bg-slate-100 rounded w-24"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="h-3 bg-slate-100 rounded w-full"></div>
            <div className="h-3 bg-slate-100 rounded w-4/5"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
