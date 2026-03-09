
import React, { useEffect, useState } from 'react';
import { CalendarItem } from '../types';
import { CalendarDays, Download, Trash2, CheckCircle2, FileText } from 'lucide-react';

const ContentCalendar: React.FC = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('contentCalendar');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem('contentCalendar', JSON.stringify(updated));
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;

    // CSV Header
    const headers = ['Date', 'Platform', 'Type', 'Topic', 'Content', 'Hashtags', 'Status'];
    
    // Map items to CSV rows
    const rows = items.map(item => [
        item.date,
        item.platform,
        item.contentType,
        `"${item.topic.replace(/"/g, '""')}"`, // Escape quotes
        `"${item.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`, // Escape quotes and newlines
        `"${(item.hashtags || []).join(', ')}"`,
        item.status
    ]);

    // Combine
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    // Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `content_calendar_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-green-500" />
                Content Calendar
            </h2>
            <p className="text-slate-400 mt-2">Manage your approved ideas and export to Excel.</p>
        </div>
        
        <button 
            onClick={handleExportCSV}
            disabled={items.length === 0}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
        >
            <Download className="w-5 h-5" />
            Export to Excel (.csv)
        </button>
      </header>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          {items.length > 0 ? (
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                              <th className="p-4 font-semibold text-sm">Status</th>
                              <th className="p-4 font-semibold text-sm">Date</th>
                              <th className="p-4 font-semibold text-sm">Platform</th>
                              <th className="p-4 font-semibold text-sm">Type</th>
                              <th className="p-4 font-semibold text-sm">Topic</th>
                              <th className="p-4 font-semibold text-sm text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {items.map((item) => (
                              <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors group">
                                  <td className="p-4">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50">
                                          <CheckCircle2 className="w-3 h-3" /> {item.status}
                                      </span>
                                  </td>
                                  <td className="p-4 text-slate-300 text-sm">{item.date}</td>
                                  <td className="p-4 text-white font-medium text-sm">{item.platform}</td>
                                  <td className="p-4 text-slate-400 text-sm">{item.contentType}</td>
                                  <td className="p-4 text-slate-300 text-sm max-w-xs truncate" title={item.topic}>{item.topic}</td>
                                  <td className="p-4 text-right">
                                      <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="text-slate-500 hover:text-red-400 p-2 rounded hover:bg-slate-700 transition-colors"
                                        title="Delete"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          ) : (
              <div className="p-20 text-center text-slate-500 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <FileText className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Your calendar is empty</h3>
                  <p>Go to the Copywriting Studio to generate and approve content.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default ContentCalendar;
