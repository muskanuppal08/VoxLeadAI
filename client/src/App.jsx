import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VoiceConsole from './pages/VoiceConsole';
import Leads from './pages/Leads';
import Appointments from './pages/Appointments';
import Knowledge from './pages/Knowledge';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'voice' && <VoiceConsole />}
        {activeTab === 'leads' && <Leads />}
        {activeTab === 'appointments' && <Appointments />}
        {activeTab === 'knowledge' && <Knowledge />}
      </main>
    </div>
  );
}
