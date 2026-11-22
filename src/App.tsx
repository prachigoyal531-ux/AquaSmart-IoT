import React, { useState } from 'react';
import { AquaSmartProvider } from './context/AquaSmartContext';
import { LayoutShell } from './components/LayoutShell';
import { DashboardPage } from './components/DashboardPage';
import { TestSystemPage } from './components/TestSystemPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { NavSection } from './types/irrigation';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');

  return (
    <AquaSmartProvider>
      <LayoutShell activeSection={activeSection} onNavigate={setActiveSection}>
        {activeSection === 'dashboard' && <DashboardPage onNavigate={setActiveSection} />}
        {activeSection === 'test' && <TestSystemPage />}
        {activeSection === 'how-it-works' && <HowItWorksPage />}
      </LayoutShell>
    </AquaSmartProvider>
  );
}
