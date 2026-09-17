import { useState, useCallback } from 'react';
import { LayoutDashboard, Activity, Zap, BarChart3, FlaskConical, Shield, FileText, Settings, Play, ChevronRight, Cloud, Award } from 'lucide-react';
import { clsx } from '@/lib/clsx';
import { engine } from '@/lib/engine';
import { PageId } from '@/lib/types';
import { useEngine } from '@/lib/useEngine';
import { OverviewPage } from '@/pages/OverviewPage';
import { LivePipelinePage } from '@/pages/LivePipelinePage';
import { EventsPage } from '@/pages/EventsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { PerformanceLabPage } from '@/pages/PerformanceLabPage';
import { ReliabilityLabPage } from '@/pages/ReliabilityLabPage';
import { EvidencePage } from '@/pages/EvidencePage';
import { ConfigurationPage } from '@/pages/ConfigurationPage';
import { CapstoneScorecard } from '@/pages/CapstoneScorecard';
import { DemoMode } from '@/components/DemoMode';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live', label: 'Live Pipeline', icon: Activity },
  { id: 'events', label: 'Events', icon: Zap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'perf', label: 'Performance Lab', icon: FlaskConical },
  { id: 'reliability', label: 'Reliability Lab', icon: Shield },
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'config', label: 'Configuration', icon: Settings },
];

function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [showScorecard, setShowScorecard] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  useEngine();

  const navigate = useCallback((p: PageId) => {
    setPage(p);
    setShowScorecard(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-base-950 text-slate-200">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-base-700/50 bg-base-900/60 lg:flex">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-base-700/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15">
            <Cloud size={20} className="text-accent-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">Stratus</div>
            <div className="text-[10px] text-slate-500">Pipeline Control Center</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.id && !showScorecard;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-accent-500/10 text-accent-300 border-l-2 border-accent-500'
                    : 'text-slate-400 hover:bg-base-800/60 hover:text-slate-200',
                )}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
          <div className="my-2 border-t border-base-700/40" />
          <button
            onClick={() => setShowScorecard(true)}
            className={clsx(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              showScorecard
                ? 'bg-accent-500/10 text-accent-300 border-l-2 border-accent-500'
                : 'text-slate-400 hover:bg-base-800/60 hover:text-slate-200',
            )}
          >
            <Award size={16} />
            Capstone Scorecard
          </button>
        </nav>

        {/* Demo mode button */}
        <div className="border-t border-base-700/50 p-3">
          <button
            onClick={() => setDemoActive(true)}
            className="btn btn-primary w-full"
          >
            <Play size={14} /> Start Demo Mode
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-base-700/50 bg-base-900/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-accent-400" />
          <span className="text-sm font-bold">Stratus</span>
        </div>
        <select
          value={showScorecard ? 'scorecard' : page}
          onChange={(e) => {
            if (e.target.value === 'scorecard') setShowScorecard(true);
            else navigate(e.target.value as PageId);
          }}
          className="rounded-lg border border-base-700 bg-base-850 px-2 py-1 text-xs text-slate-200"
        >
          {NAV_ITEMS.map((n) => (
            <option key={n.id} value={n.id}>{n.label}</option>
          ))}
          <option value="scorecard">Capstone Scorecard</option>
        </select>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden pt-12 lg:pt-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-base-700/50 bg-base-900/80 px-6 py-2.5 backdrop-blur lg:flex">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Stratus</span>
            <ChevronRight size={14} className="text-slate-700" />
            <span className="text-slate-300">{showScorecard ? 'Capstone Scorecard' : NAV_ITEMS.find((n) => n.id === page)?.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ok-500" />
              </span>
              <span className="text-slate-400">Live</span>
              <span className="tabular text-slate-500">·</span>
              <span className="tabular text-slate-400">{engine.totalEvents} events</span>
              <span className="tabular text-slate-500">·</span>
              <span className="tabular text-slate-400">{engine.currentThroughput().toFixed(0)} ev/s</span>
            </div>
            <button
              onClick={() => setDemoActive(true)}
              className="btn btn-outline text-xs"
            >
              <Play size={12} /> Demo
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="grid-bg min-h-[calc(100vh-49px)]">
          <div className="p-4 lg:p-6">
            {showScorecard ? (
              <CapstoneScorecard />
            ) : (
              <>
                {page === 'overview' && <OverviewPage />}
                {page === 'live' && <LivePipelinePage />}
                {page === 'events' && <EventsPage />}
                {page === 'analytics' && <AnalyticsPage />}
                {page === 'perf' && <PerformanceLabPage />}
                {page === 'reliability' && <ReliabilityLabPage />}
                {page === 'evidence' && <EvidencePage />}
                {page === 'config' && <ConfigurationPage />}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Demo mode overlay */}
      {demoActive && <DemoMode onClose={() => setDemoActive(false)} onNavigate={(p) => navigate(p)} onShowScorecard={() => { setShowScorecard(true); setDemoActive(false); }} />}
    </div>
  );
}

export default App;
