import { useAppStore } from '@/stores/appStore';
import { GlowCard } from '@/components/features/GlowCard';
import { StatCard } from '@/components/features/StatCard';
import { formatNumber, formatCurrency, formatTokens } from '@/lib/utils';
import { 
  Key, 
  Zap, 
  DollarSign, 
  TrendingUp,
  Activity,
  Boxes,
  Code2,
  Shield,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export default function DashboardPage() {
  const { apiKeys, dailyUsage, usageRecords, user } = useAppStore();
  
  const activeKeys = apiKeys.filter((k) => k.status === 'active').length;
  const totalRequests = usageRecords.length;
  const totalTokens = usageRecords.reduce((acc, r) => acc + r.tokens, 0);
  const totalCost = usageRecords.reduce((acc, r) => acc + r.cost, 0);

  const recentUsage = dailyUsage.slice(-7);

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-radial min-h-full">
      {/* Welcome header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your API usage and manage your agentic workflows
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/docs">
              View Docs
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 glow-cyan">
            <Link to="/vibecoder">
              <Sparkles className="size-4 mr-2" />
              Open VibeCoder
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active API Keys"
          value={activeKeys}
          change={`${apiKeys.length} total`}
          icon={Key}
          iconColor="text-cyan-500"
        />
        <StatCard
          label="Total Requests"
          value={formatNumber(totalRequests)}
          change="+12% from last week"
          changeType="positive"
          icon={Zap}
          iconColor="text-purple-500"
        />
        <StatCard
          label="Tokens Used"
          value={formatTokens(totalTokens)}
          change={`${formatNumber(totalTokens)} total`}
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard
          label="Total Cost"
          value={formatCurrency(totalCost)}
          change="This billing period"
          icon={DollarSign}
          iconColor="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage chart */}
        <div className="lg:col-span-2">
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">API Usage</h2>
                  <p className="text-sm text-muted-foreground">Requests over the last 7 days</p>
                </div>
                <Activity className="size-5 text-muted-foreground" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentUsage}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en', { weekday: 'short' })}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222 47% 10%)',
                        border: '1px solid hsl(217 33% 17%)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#00d4ff"
                      strokeWidth={2}
                      fill="url(#colorRequests)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Agent status */}
        <GlowCard glowColor="purple">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Agent Status</h2>
            <div className="space-y-4">
              {[
                { name: 'The Architect', icon: Boxes, color: 'text-cyan-500', status: 'Online' },
                { name: 'The Engineer', icon: Code2, color: 'text-purple-500', status: 'Online' },
                { name: 'The QA Specialist', icon: Shield, color: 'text-green-500', status: 'Online' },
              ].map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className={`p-2 rounded-lg bg-muted/50 ${agent.color}`}>
                    <agent.icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">Ready to process</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-500">{agent.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Generate API Key',
            description: 'Create a new key to access the Agentic API',
            icon: Key,
            href: '/api-keys',
            color: 'from-cyan-500/20 to-blue-500/20',
          },
          {
            title: 'Start Coding',
            description: 'Launch VibeCoder IDE and build with AI',
            icon: Code2,
            href: '/vibecoder',
            color: 'from-purple-500/20 to-pink-500/20',
          },
          {
            title: 'View Documentation',
            description: 'Learn how to integrate the Jostavan API',
            icon: Boxes,
            href: '/docs',
            color: 'from-green-500/20 to-emerald-500/20',
          },
        ].map((action) => (
          <Link key={action.title} to={action.href}>
            <div className={`group p-6 rounded-xl bg-gradient-to-br ${action.color} border border-border hover:border-primary/50 transition-all duration-300`}>
              <action.icon className="size-8 text-foreground mb-4" />
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                {action.title}
                <ArrowRight className="size-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
