'use client';
import React, { useState } from 'react';
import { Clock, Send, ChevronDown, X, ExternalLink } from 'lucide-react';

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

  const [slackConnected, setSlackConnected] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [webhookInput, setWebhookInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [webhookError, setWebhookError] = useState('');

  const handleConnectSlack = () => {
    if (!userId) { alert('Please login first'); return; }
    setWebhookInput('');
    setWebhookError('');
    setShowSlackModal(true);
  };

  const handleSaveWebhook = async () => {
    if (!webhookInput.startsWith('https://hooks.slack.com/')) {
      setWebhookError('Invalid URL. Must start with https://hooks.slack.com/');
      return;
    }
    setIsConnecting(true);
    setWebhookError('');
    try {
      const res = await fetch('http://localhost:5000/api/slack/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, webhookUrl: webhookInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setSlackConnected(true);
        setShowSlackModal(false);
      } else {
        setWebhookError('Error: ' + data.error);
      }
    } catch {
      setWebhookError('Connection failed. Is the backend running?');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans text-gray-900">

      {/* Slack Connection Modal */}
      {showSlackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-6 relative">
            <button onClick={() => setShowSlackModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#4A154B] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Connect Slack</h2>
                <p className="text-xs text-gray-500">Get rate-limit alerts sent to your Slack channel</p>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">How to get your Webhook URL</p>
              <ol className="space-y-2">
                {[
                  <span key="1">Go to <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-[#10A37F] underline font-medium inline-flex items-center gap-0.5">api.slack.com/apps <ExternalLink size={10}/></a> and open your app</span>,
                  <span key="2">Click <strong className="text-gray-800">Incoming Webhooks</strong> in the left sidebar</span>,
                  <span key="3">Toggle <strong className="text-gray-800">Activate Incoming Webhooks</strong> to ON</span>,
                  <span key="4">Click <strong className="text-gray-800">Add New Webhook to Workspace</strong> and pick a channel</span>,
                  <span key="5">Copy the generated <strong className="text-gray-800">Webhook URL</strong> and paste it below</span>,
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#10A37F] text-white text-[10px] flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                    <span className="text-xs text-gray-600 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Webhook URL</label>
              <input
                type="url"
                autoFocus
                placeholder="https://hooks.slack.com/services/..."
                value={webhookInput}
                onChange={(e) => { setWebhookInput(e.target.value); setWebhookError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveWebhook()}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10A37F] transition-shadow font-mono ${
                  webhookError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {webhookError && <p className="text-xs text-red-500 mt-1">{webhookError}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setShowSlackModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveWebhook}
                disabled={isConnecting || !webhookInput}
                className="flex-1 py-2.5 bg-[#10A37F] text-white rounded-lg text-sm font-medium hover:bg-[#0E906F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Slack'}
              </button>
            </div>
          </div>
        </div>
      )}
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
            onClick={handleConnectSlack}
            className={`w-full py-2 border rounded-lg font-medium transition-colors mb-6 text-sm flex items-center justify-center gap-2 ${slackConnected ? 'bg-green-50 border-green-300 text-green-700' : 'bg-[#F3F4F6] border-gray-200 text-gray-700 hover:bg-gray-200'}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
            {slackConnected ? '✓ Slack Connected' : 'Connect Slack'}
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
