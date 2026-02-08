import { useAppStore } from '@/stores/appStore';
import { GlowCard } from '@/components/features/GlowCard';
import { formatNumber, formatCurrency, formatTokens, formatDate } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Zap,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { 
  Area, 
  AreaChart, 
  Bar,
  BarChart,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function UsagePage() {
  const { dailyUsage, usageRecords, apiKeys } = useAppStore();
  const [timeRange, setTimeRange] = useState('30d');

  const rangeMap: Record<string, number> = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
  };

  const filteredUsage = dailyUsage.slice(-rangeMap[timeRange]);
  
  const totalRequests = filteredUsage.reduce((acc, d) => acc + d.requests, 0);
  const totalTokens = filteredUsage.reduce((acc, d) => acc + d.tokens, 0);
  const totalCost = filteredUsage.reduce((acc, d) => acc + d.cost, 0);
  const avgRequestsPerDay = Math.round(totalRequests / filteredUsage.length);

  // Model distribution
  const modelCounts = usageRecords.reduce((acc, record) => {
    acc[record.model] = (acc[record.model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modelData = Object.entries(modelCounts).map(([model, count]) => ({
    model: model.split('-').pop(),
    count,
  }));

  // Key usage
  const keyUsage = apiKeys
    .filter((k) => k.status === 'active')
    .map((key) => ({
      name: key.name,
      requests: key.usageCount,
    }));

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-radial min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your API usage and costs over time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="size-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="size-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: formatNumber(totalRequests), icon: BarChart3, color: 'text-cyan-500' },
          { label: 'Total Tokens', value: formatTokens(totalTokens), icon: Zap, color: 'text-purple-500' },
          { label: 'Total Cost', value: formatCurrency(totalCost), icon: DollarSign, color: 'text-amber-500' },
          { label: 'Avg Requests/Day', value: formatNumber(avgRequestsPerDay), icon: TrendingUp, color: 'text-green-500' },
        ].map((stat) => (
          <GlowCard key={stat.label} hover={false}>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-muted/50 ${stat.color}`}>
                  <stat.icon className="size-5" />
                </div>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests over time */}
        <GlowCard>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Requests Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredUsage}>
                  <defs>
                    <linearGradient id="colorRequests2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 10%)',
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                    labelFormatter={(value) => formatDate(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#00d4ff"
                    strokeWidth={2}
                    fill="url(#colorRequests2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Cost over time */}
        <GlowCard glowColor="amber">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Cost Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredUsage}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 10%)',
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#colorCost)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Model distribution */}
        <GlowCard glowColor="purple">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Model Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="model" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 10%)',
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => [formatNumber(value), 'Requests']}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Key usage */}
        <GlowCard glowColor="green">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Usage by API Key</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keyUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 10%)',
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => [formatNumber(value), 'Requests']}
                  />
                  <Bar dataKey="requests" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Recent activity table */}
      <GlowCard>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">Recent Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Model</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Endpoint</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Tokens</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {usageRecords.slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono text-xs">{formatDate(record.timestamp)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                        {record.model.split('-').pop()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{record.endpoint}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatNumber(record.tokens)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-amber-500">{formatCurrency(record.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}
