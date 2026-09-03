"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import EmailList from '@/components/EmailList';
import ComposeView from '@/components/ComposeView';
import axios from 'axios';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Suspense } from 'react';

const API_URL = 'http://localhost:5000/api';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposing, setIsComposing] = useState(false);
  
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [sentJobs, setSentJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Handle auth token from URL
    const urlToken = searchParams.get('token');
    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      // Clean up URL
      router.replace('/');
    }

    // Handle slack connection
    const slackConnected = searchParams.get('slack_connected');
    if (slackConnected) {
      alert('Slack successfully connected!');
      router.replace('/');
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode JWT payload (simple base64 decode for frontend)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['x-user-id'] = payload.userId; // Pass user ID explicitly for demo routes
    } catch (e) {
      console.error(e);
      router.push('/login');
    }
  }, [searchParams, router]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      if (searchQuery) {
        const res = await axios.get(`${API_URL}/search?q=${searchQuery}`);
        const results = res.data.data;
        setScheduledJobs(results.filter((j: any) => j.status === 'scheduled' || j.status === 'delayed'));
        setSentJobs(results.filter((j: any) => j.status === 'completed' || j.status === 'failed'));
      } else {
        const [schRes, sentRes] = await Promise.all([
          axios.get(`${API_URL}/scheduled`),
          axios.get(`${API_URL}/sent`)
        ]);
        setScheduledJobs(schRes.data.data);
        setSentJobs(sentRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  const handleSchedule = async (jobs: any[]) => {
    try {
      await axios.post(`${API_URL}/schedule`, { jobs });
      setIsComposing(false);
      fetchJobs();
      alert(`Scheduled ${jobs.length} emails successfully!`);
    } catch (error) {
      console.error('Failed to schedule:', error);
      alert('Failed to schedule emails. Please check console.');
    }
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onCompose={() => setIsComposing(true)}
      scheduledCount={scheduledJobs.length}
      sentCount={sentJobs.length}
      userId={userId}
    >
      {isComposing ? (
        <ComposeView 
          onBack={() => setIsComposing(false)} 
          onSubmit={handleSchedule} 
        />
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Bar */}
          <div className="px-6 py-4 flex items-center border-b border-gray-100">
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-[#FAFAFA] border border-gray-100 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#10A37F] transition-shadow placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 ml-6">
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Filter size={18} />
              </button>
              <button 
                onClick={fetchJobs} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto">
            <EmailList 
              data={activeTab === 'scheduled' ? scheduledJobs : sentJobs} 
              isLoading={isLoading} 
              type={activeTab}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
