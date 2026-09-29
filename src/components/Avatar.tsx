import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const GRADIENT_COLORS = [
  'from-blue-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
  'from-cyan-500 to-sky-600',
];

function getGradient(name: string): string {
  const charCode = name.charCodeAt(0) || 0;
  return GRADIENT_COLORS[charCode % GRADIENT_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Consistent avatar component with image support and fallback initials.
 * Generates a deterministic gradient based on the user's name.
 */
export function Avatar({ src, name = '?', size = 'md', className = '' }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const initials = getInitials(name);
  const gradient = getGradient(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-mono font-bold text-white ring-2 ring-white/10 ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}
