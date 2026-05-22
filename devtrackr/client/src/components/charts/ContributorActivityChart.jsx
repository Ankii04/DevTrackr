import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container border border-white/10 p-3 rounded-lg shadow-xl font-mono text-[12px] space-y-1">
        <p className="text-on-surface font-bold">@{payload[0].payload.login}</p>
        <p className="text-secondary">Additions: +{payload[0].value}</p>
        <p className="text-error">Deletions: -{payload[1].value}</p>
      </div>
    );
  }
  return null;
};

const ContributorActivityChart = ({ contributors = [] }) => {
  if (!contributors || contributors.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-on-surface-variant font-outfit text-body-md bg-surface-container/30 border border-white/5 rounded-xl">
        No contributor details available
      </div>
    );
  }

  // Take top 5 contributors by commits
  const data = contributors.slice(0, 5).map(c => ({
    login: c._id || 'unknown',
    additions: c.additions || 0,
    deletions: Math.abs(c.deletions || 0) // Make deletions absolute for simple stacking visualization
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid stroke="#2e3541" strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="login" 
            stroke="#8c909f" 
            fontSize={10} 
            fontFamily="JetBrains Mono" 
          />
          <YAxis 
            stroke="#8c909f" 
            fontSize={10} 
            fontFamily="JetBrains Mono" 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-[12px] font-outfit text-on-surface-variant capitalize">{value}</span>}
          />
          <Bar dataKey="additions" stackId="a" fill="#10b981" maxBarSize={30} />
          <Bar dataKey="deletions" stackId="a" fill="#ef4444" maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ContributorActivityChart;
