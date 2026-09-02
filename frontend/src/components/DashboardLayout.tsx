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
}

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  onCompose,
  scheduledCount = 0,
  sentCount = 0
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
            className="w-full py-2 bg-white border border-[#10A37F] text-[#10A37F] rounded-lg font-medium hover:bg-[#10A37F] hover:text-white transition-colors mb-6 text-sm"
          >
            Compose
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
