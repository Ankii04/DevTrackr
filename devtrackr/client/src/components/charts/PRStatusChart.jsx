import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PRStatusChart = ({ prStats }) => {
  if (!prStats || prStats.total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-on-surface-variant font-outfit text-body-md bg-surface-container/30 border border-white/5 rounded-xl">
        No PR metrics available
      </div>
    );
  }

  const data = [
    { name: 'Open', value: prStats.open || 0, color: '#4d8eff' },
    { name: 'Merged', value: prStats.merged || 0, color: '#4edea3' },
    { name: 'Closed', value: prStats.closed || 0, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container border border-white/10 p-2.5 rounded-lg shadow-xl font-mono text-[12px]">
          <p style={{ color: payload[0].payload.color }} className="font-bold">
            {payload[0].name}: {payload[0].value} ({((payload[0].value / prStats.total) * 100).toFixed(0)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="80%"
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle" 
            formatter={(value) => <span className="text-[12px] font-outfit text-on-surface-variant">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Central Total Label */}
      <div className="absolute top-[41%] left-[50%] -translate-x-[50%] -translate-y-[50%] text-center">
        <p className="font-mono text-headline-sm font-bold text-on-surface leading-none">{prStats.total}</p>
        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider mt-1">Total PRs</p>
      </div>
    </div>
  );
};

export default PRStatusChart;
