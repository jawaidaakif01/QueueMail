import React from 'react';
import { format } from 'date-fns';
import { Clock, Star } from 'lucide-react';

interface EmailJob {
  id: string;
  subject: string;
  toEmail: string;
  scheduledTime: string;
  sentTime?: string;
  status: string;
  body: string;
}

interface EmailListProps {
  data: EmailJob[];
  isLoading: boolean;
  type: 'scheduled' | 'sent';
}

export default function EmailList({ data, isLoading, type }: EmailListProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-50 border-b border-gray-100"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No {type} emails found.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {data.map((job) => (
        <div key={job.id} className="flex items-center py-4 px-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors group cursor-pointer">
          <div className="w-[180px] shrink-0 font-medium text-sm text-gray-800 truncate pr-4">
            To: {job.toEmail}
          </div>
          
          <div className="shrink-0 mr-4">
            {type === 'scheduled' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#E57A2A] bg-[#FEF4EC] border border-[#FAD9C3]">
                <Clock size={12} />
                {format(new Date(job.scheduledTime), 'EEE h:mm:ss a')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200">
                Sent
              </span>
            )}
          </div>
          
          <div className="flex-1 truncate text-sm text-gray-500 pr-4">
            <span className="font-semibold text-gray-800 mr-2">{job.subject}</span>
            - <span className="opacity-80">{job.body.substring(0, 80)}...</span>
          </div>

          <div className="shrink-0 text-gray-300 hover:text-gray-400">
            <Star size={18} />
          </div>
        </div>
      ))}
    </div>
  );
}
