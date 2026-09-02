import React, { useState } from 'react';
import { ArrowLeft, Paperclip, Clock, Calendar } from 'lucide-react';
import Papa from 'papaparse';

interface ComposeViewProps {
  onBack: () => void;
  onSubmit: (jobs: any[]) => void;
}

export default function ComposeView({ onBack, onSubmit }: ComposeViewProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const [delay, setDelay] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState('');
  
  const [showSendLater, setShowSendLater] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<Date>(new Date());

  const handleSend = () => {
    // Basic validation
    if (!subject || !body) return;
    
    if (csvFile) {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const leads = results.data as any[];
          const jobs = leads.map(lead => ({
            toEmail: lead.email || lead.Email || lead.EMAIL,
            subject,
            body,
            scheduleTime: scheduleTime.toISOString(),
            delaySeconds: delay ? parseInt(delay) : 0,
            hourlyLimit: hourlyLimit ? parseInt(hourlyLimit) : undefined
          })).filter(j => j.toEmail);
          
          onSubmit(jobs);
        }
      });
    } else {
      if (!toEmail) return;
      
      // Split by comma to support multiple emails without a CSV
      const emails = toEmail.split(',').map(e => e.trim()).filter(e => e);
      
      const jobs = emails.map(email => ({
        toEmail: email,
        subject,
        body,
        scheduleTime: scheduleTime.toISOString(),
        delaySeconds: delay ? parseInt(delay) : 0,
        hourlyLimit: hourlyLimit ? parseInt(hourlyLimit) : undefined
      }));
      
      onSubmit(jobs);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={onBack} className="flex items-center gap-3 text-gray-800 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-xl font-medium">Compose New Email</span>
        </button>
        <div className="flex items-center gap-4 relative">
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Paperclip size={18} />
          </button>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors relative"
            onClick={() => setShowSendLater(!showSendLater)}
          >
            <Clock size={18} />
          </button>
          
          {showSendLater && (
            <div className="absolute top-12 right-12 w-64 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-10 p-4">
              <h3 className="font-semibold text-sm mb-3">Send Later</h3>
              <div className="relative mb-3">
                <input 
                  type="datetime-local" 
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:border-[#10A37F]"
                  value={scheduleTime.toISOString().slice(0, 16)}
                  onChange={(e) => setScheduleTime(new Date(e.target.value))}
                />
                <Calendar size={14} className="absolute right-3 top-2.5 text-gray-400" />
              </div>
              <div className="space-y-1 mb-4">
                <div className="text-sm py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer text-gray-700">Tomorrow</div>
                <div className="text-sm py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer text-gray-700">Tomorrow, 10:00 AM</div>
                <div className="text-sm py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer text-gray-700">Tomorrow, 11:00 AM</div>
                <div className="text-sm py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer text-gray-700">Tomorrow, 3:00 PM</div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowSendLater(false)}
                  className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowSendLater(false)}
                  className="px-4 py-1.5 text-sm font-medium text-[#10A37F] border border-[#10A37F] rounded-full hover:bg-[#EAF5F0]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleSend}
            className="px-6 py-1.5 border border-[#10A37F] text-[#10A37F] rounded-full font-medium hover:bg-[#EAF5F0] transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-12 py-6 max-w-4xl">
        <div className="flex items-center mb-4 text-sm">
          <span className="w-16 font-medium text-gray-800">From</span>
          <div className="px-3 py-1.5 bg-gray-100 rounded-md text-gray-600 flex items-center gap-2 cursor-pointer">
            oliver.brown@domain.io
            <Clock size={12} className="opacity-50" />
          </div>
        </div>
        
        <div className="flex items-center mb-4 text-sm border-b border-gray-100 pb-2">
          <span className="w-16 font-medium text-gray-800">To</span>
          <div className="flex flex-1 items-center gap-2">
            <input 
              type="text" 
              placeholder="recipient@example.com"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="flex-1 outline-none text-gray-600 placeholder:text-gray-300"
            />
            <span className="text-xs text-gray-400">or</span>
            <input 
              type="file" 
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="text-xs text-gray-500 w-48"
            />
          </div>
        </div>

        <div className="flex items-center mb-6 text-sm border-b border-gray-100 pb-2">
          <span className="w-16 font-medium text-gray-800">Subject</span>
          <input 
            type="text" 
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 outline-none text-gray-600 placeholder:text-gray-300"
          />
        </div>

        <div className="flex items-center gap-8 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-800">Delay between 2 emails</span>
            <input 
              type="number"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              placeholder="00"
              className="w-14 px-2 py-1 text-center border border-gray-200 rounded outline-none focus:border-[#10A37F] text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-800">Hourly Limit</span>
            <input 
              type="number"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              placeholder="00"
              className="w-14 px-2 py-1 text-center border border-gray-200 rounded outline-none focus:border-[#10A37F] text-sm"
            />
          </div>
        </div>

        {/* Editor Area */}
        <div className="bg-[#FAFAFA] border border-gray-100 rounded-xl min-h-[400px] flex flex-col">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 text-gray-400">
            {/* Mock Editor Toolbar Icons */}
            <div className="flex gap-2">
              <span className="font-serif italic font-bold px-1 hover:text-gray-600 cursor-pointer">B</span>
              <span className="font-serif italic px-1 hover:text-gray-600 cursor-pointer">I</span>
              <span className="underline px-1 hover:text-gray-600 cursor-pointer">U</span>
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex gap-2">
              <span className="px-1 hover:text-gray-600 cursor-pointer">≡</span>
            </div>
          </div>
          <textarea 
            className="flex-1 w-full bg-transparent p-4 outline-none resize-none text-gray-700 placeholder:text-gray-300"
            placeholder="Type Your Reply..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
