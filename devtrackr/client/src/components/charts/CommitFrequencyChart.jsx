import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '../../utils/dateHelpers';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container border border-white/10 p-3 rounded-lg shadow-xl font-mono text-[12px]">
        <p className="text-on-surface-variant mb-1 font-outfit">{formatDate(payload[0].payload.date)}</p>
        <p className="text-primary font-bold">{payload[0].value} Commits</p>
      </div>
    );
  }
  return null;
};

const CommitFrequencyChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-on-surface-variant font-outfit text-body-md bg-surface-container/30 border border-white/5 rounded-xl">
        No commit data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4d8eff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4d8eff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2e3541" strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#8c909f" 
            fontSize={10} 
            fontFamily="JetBrains Mono" 
            tickFormatter={(date) => {
              const parts = date.split('-');
              return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : date;
            }}
          />
          <YAxis 
            stroke="#8c909f" 
            fontSize={10} 
            fontFamily="JetBrains Mono" 
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="commits" 
            stroke="#4d8eff" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#commitGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CommitFrequencyChart;
