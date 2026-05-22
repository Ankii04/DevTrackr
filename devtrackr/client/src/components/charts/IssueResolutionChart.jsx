import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const IssueResolutionChart = ({ issueStats }) => {
  if (!issueStats || issueStats.total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-on-surface-variant font-outfit text-body-md bg-surface-container/30 border border-white/5 rounded-xl">
        No issue statistics available
      </div>
    );
  }

  const data = [
    { name: 'Open Issues', value: issueStats.open || 0, color: '#f59e0b' },
    { name: 'Closed Issues', value: issueStats.closed || 0, color: '#10b981' }
  ];

  return (
    <div className="h-64 w-full flex flex-col justify-between">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis 
              dataKey="name" 
              stroke="#8c909f" 
              fontSize={10} 
              fontFamily="Outfit" 
            />
            <YAxis 
              stroke="#8c909f" 
              fontSize={10} 
              fontFamily="JetBrains Mono" 
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface-container border border-white/10 p-2.5 rounded-lg shadow-xl font-mono text-[12px]">
                      <p style={{ color: payload[0].payload.color }} className="font-bold">
                        {payload[0].name}: {payload[0].value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-center font-mono text-[12px] text-on-surface-variant border-t border-white/5 pt-3 flex justify-between items-center px-4">
        <span>Resolution Rate:</span>
        <span className="text-secondary font-bold text-[14px]">{issueStats.resolutionRate}%</span>
      </div>
    </div>
  );
};

export default IssueResolutionChart;
