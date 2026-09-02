import React from 'react';
import { Clock, Send, Search, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: 'scheduled' | 'sent';
  setActiveTab: (tab: 'scheduled' | 'sent') => void;
  onCompose: () => void;
  scheduledCount?: number;
  sentCount?: number;
  userId?: string | null;
}

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  onCompose,
  scheduledCount = 0,
  sentCount = 0,
  userId
}: DashboardLayoutProps) {
  const user = {
    name: 'Oliver Brown',
    email: 'oliver.brown@domain.io',
    avatar: 'https://i.pravatar.cc/150?u=oliver',
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
        <div className="p-5">
          <div className="text-3xl font-bold tracking-tighter mb-6" style={{ fontFamily: 'monospace' }}>ONB</div>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 mb-4 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">{user.name}</span>
                <span className="text-[11px] text-gray-500">{user.email}</span>
              </div>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </div>

          <button 
            onClick={onCompose}
            className="w-full py-2 bg-white border border-[#10A37F] text-[#10A37F] rounded-lg font-medium hover:bg-[#10A37F] hover:text-white transition-colors mb-2 text-sm"
          >
            Compose
          </button>

          <button 
            onClick={() => {
              if (userId) {
                window.location.href = `http://localhost:5000/auth/slack?userId=${userId}`;
              } else {
                alert('Please login first');
              }
            }}
            className="w-full py-2 bg-[#F3F4F6] border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors mb-6 text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
            Connect Slack
          </button>

          <div className="text-xs text-gray-400 font-medium mb-3 px-2 tracking-wider">CORE</div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('scheduled')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'scheduled' 
                  ? 'bg-[#EAF5F0] text-[#10A37F]' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock size={16} />
                <span>Scheduled</span>
              </div>
              <span className="text-xs text-gray-500">{scheduledCount}</span>
            </button>

            <button 
              onClick={() => setActiveTab('sent')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'sent' 
                  ? 'bg-[#EAF5F0] text-[#10A37F]' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send size={16} />
                <span>Sent</span>
              </div>
              <span className="text-xs text-gray-500">{sentCount}</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {children}
      </main>
    </div>
  );
}
