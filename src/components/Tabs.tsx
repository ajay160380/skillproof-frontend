import React from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

/**
 * Reusable animated tabs component with multiple variants.
 * Supports badge counts and icons on each tab.
 */
export function Tabs({ tabs, activeTab, onChange, variant = 'default', className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 ${variant === 'underline' ? 'border-b border-white/10' : ''} ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all rounded-lg
              ${isActive
                ? 'text-white'
                : 'text-white/50 hover:text-white/70'
              }
              ${variant === 'pills' ? 'rounded-full' : ''}
              ${variant === 'underline' ? 'rounded-none' : ''}
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <span className="text-sm">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-seal text-white rounded-full min-w-[18px] text-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </span>
            
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`
                  absolute inset-0
                  ${variant === 'underline'
                    ? 'top-auto h-0.5 bg-brand-primary rounded-full'
                    : variant === 'pills'
                      ? 'bg-white/10 rounded-full'
                      : 'bg-white/10 rounded-lg'
                  }
                `}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
