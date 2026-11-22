import React, { useState } from 'react';
import { Droplets, Menu, X } from 'lucide-react';
import { NavSection } from '../types/irrigation';

interface LayoutShellProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'test', label: 'Test Your System' },
  { id: 'how-it-works', label: 'How It Works' },
];

export function LayoutShell({ activeSection, onNavigate, children }: LayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (id: NavSection) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F5] text-[#111814]">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#DCE3DA]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md"
          >
            <span className="w-8 h-8 rounded-lg bg-[#15803D] text-white flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-lg tracking-tight text-[#111814]">
              AquaSmart
            </span>
          </button>

          {/* Zone 2: 3 Concise Single-Line Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-7"
            aria-label="Primary Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-sm ${
                    isActive
                      ? 'border-[#15803D] text-[#15803D] font-semibold'
                      : 'border-transparent text-[#4A554D] hover:text-[#111814] hover:border-[#C5D1C3]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Button */}
          <div className="flex items-center gap-2 shrink-0">
            {activeSection === 'test' ? (
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className="px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                View Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNav('test')}
                className="px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Test System
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-[#4A554D] hover:bg-[#F1F5F0]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden border-t border-[#E8EDE7] bg-white px-4 py-3 space-y-1"
            aria-label="Mobile Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EAF3EC] text-[#14532D] font-semibold'
                      : 'text-[#4A554D] hover:bg-[#F4F7F3]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Simple Quiet Footer */}
      <footer className="border-t border-[#E4EBE2] bg-white/70">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#5B685E]">
          <span>AquaSmart — Smart Weather-Based IoT Irrigation System</span>
          <span>Simulated Demo Mode · College IoT Project Demonstration</span>
        </div>
      </footer>
    </div>
  );
}
