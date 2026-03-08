import { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, GitBranch, Activity, Network } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Impact {
  modified: string;
  impacted: string;
  impact_name: string;
  distance: number;
}

interface PRAnalysisResult {
  risk_score: 'Low' | 'Medium' | 'High';
  total_impacted_entities: number;
  max_dependency_distance: number;
  impacts: Impact[];
  message: string;
}

export function PRImpactDashboard({ repoName }: { repoName: string }) {
  const [files, setFiles] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PRAnalysisResult | null>(null);

  const analyzePR = async () => {
    if (!files.trim() || !repoName) return;
    
    setLoading(true);

    if (repoName === "fastapi-demo-core" || repoName === "demo-repo") {
      setTimeout(() => {
        setResult({
          risk_score: 'Medium',
          total_impacted_entities: 3,
          max_dependency_distance: 2,
          message: 'PR analysis complete. Blast radius spans across 3 downstream entities.',
          impacts: [
            { modified: 'auth.py', impacted: 'db.py', impact_name: 'database.py', distance: 1 },
            { modified: 'auth.py', impacted: 'User', impact_name: 'User', distance: 1 },
            { modified: 'auth.py', impacted: 'payment_service.py', impact_name: 'payment_service.py', distance: 2 }
          ]
        });
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const fileList = files.split('\\n').map(f => f.trim()).filter(Boolean);
      const response = await axios.post('http://localhost:8000/api/v1/pr-analysis', {
        repo_name: repoName,
        modified_files: fileList
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert('Failed to analyze PR');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: string) => {
    switch (score) {
      case 'High': return 'from-red-500/20 to-red-900/20 border-red-500/30 text-red-400';
      case 'Medium': return 'from-amber-500/20 to-amber-900/20 border-amber-500/30 text-amber-400';
      case 'Low': return 'from-emerald-500/20 to-emerald-900/20 border-emerald-500/30 text-emerald-400';
      default: return 'from-slate-800 to-slate-900 border-slate-700 text-slate-400';
    }
  };

  const getRiskIcon = (score: string) => {
    switch (score) {
      case 'High': return <AlertCircle className="w-10 h-10 text-red-500 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />;
      case 'Medium': return <AlertTriangle className="w-10 h-10 text-amber-500 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
      case 'Low': return <CheckCircle2 className="w-10 h-10 text-emerald-500 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />;
      default: return null;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-8 flex flex-col h-[calc(100vh-140px)] sticky top-28 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-3 text-white">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <GitBranch className="w-5 h-5 text-cyan-400" />
        </div>
        Simulate PR Impact
      </h2>
      
      <div className="mb-6 relative z-10 shrink-0">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Modified Files (one per line)
        </label>
        <div className="relative">
          <textarea
            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-600 font-mono shadow-inner resize-none"
            rows={4}
            placeholder="backend/services/auth.py"
            value={files}
            onChange={(e) => setFiles(e.target.value)}
          />
        </div>
        <button
          onClick={analyzePR}
          disabled={loading || !files.trim() || !repoName}
          className="mt-4 w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <>
              <Activity className="w-4 h-4" />
              Analyze Blast Radius
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className={`p-6 rounded-2xl border bg-gradient-to-br flex items-center gap-5 shadow-lg ${getRiskColor(result.risk_score)}`}>
                <div className="shrink-0">
                  {getRiskIcon(result.risk_score)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">Risk Score: {result.risk_score}</h3>
                  <p className="text-sm opacity-90 mt-1 leading-snug">{result.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center shadow-inner">
                  <div className="text-3xl font-display font-bold text-white mb-1">{result.total_impacted_entities ?? 0}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Downstream Entities</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center shadow-inner">
                  <div className="text-3xl font-display font-bold text-white mb-1">{result.max_dependency_distance ?? 0}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max Depth</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 ml-1 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" />
                  Impact Path Details
                </h4>
                {result.impacts?.length > 0 ? (
                  <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                    <ul className="divide-y divide-slate-800/50">
                      {result.impacts.map((impact, i) => (
                        <motion.li 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="p-4 text-sm flex items-center justify-between hover:bg-slate-800/50 transition-colors group"
                        >
                          <div className="flex flex-col gap-1.5 max-w-[42%]">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modified</span>
                            <span className="font-mono text-cyan-400 truncate bg-cyan-400/10 px-2 py-0.5 rounded" title={impact.modified}>
                              {impact.modified.split(':').pop()}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center shrink-0 px-2">
                             <div className="h-px w-8 bg-slate-700 relative">
                               <ArrowRight className="w-3.5 h-3.5 text-slate-500 absolute -right-2 top-1/2 -translate-y-1/2 group-hover:text-cyan-400 transition-colors" />
                             </div>
                             <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Depth {impact.distance}</span>
                          </div>

                          <div className="flex flex-col gap-1.5 max-w-[42%] text-right items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Impacted</span>
                            <span className="font-mono text-emerald-400 truncate bg-emerald-400/10 px-2 py-0.5 rounded" title={impact.impact_name}>
                              {impact.impact_name}
                            </span>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                    <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-medium">No downstream dependencies found.</p>
                    <p className="text-xs text-slate-500 mt-1">This change appears safe.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
