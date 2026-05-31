import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function TrendChart({ history }) {
  // Filter for depression assessments and sort chronologically
  const mentalHealthData = history
    .filter(record => record.assessment_type === 'depression')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(record => ({
      date: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: record.result_data.risk_percentage
    }));

  if (mentalHealthData.length < 2) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-center h-48">
        <p className="text-slate-500 dark:text-slate-400">Take at least two Mental Health screeners to see your trend over time.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Mental Health Risk Trend</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mentalHealthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#0FFCBE', fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              name="Risk Score"
              stroke="#0FFCBE" 
              strokeWidth={3}
              dot={{ fill: '#106EBE', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#0FFCBE' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
