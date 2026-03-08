import { useState } from 'react';
import { Network, Search, Code2, Cpu, Sparkles, ChevronRight, Github } from 'lucide-react';
import { GraphVisualization } from './components/GraphVisualization';
import { PRImpactDashboard } from './components/PRImpactDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{status: string, message: string} | null>(null);
  
  const [graphData, setGraphData] = useState<any>(null);
  const [activeRepo, setActiveRepo] = useState<string>('');
  
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [querying, setQuerying] = useState(false);

  const loadDemoData = (targetRepoUrl?: string) => {
    // If they typed a repo, extract its name, otherwise use default
    const repoName = targetRepoUrl ? targetRepoUrl.split('/').pop() || "demo-repo" : "fastapi-demo-core";
    setActiveRepo(repoName);
    setIngestStatus({ status: 'success', message: 'Backend unreachable. Seamlessly fell back to Demo Architecture.' });
    setGraphData({
      nodes: [
        { id: "api", name: "api.py", group: "module" },
        { id: "auth", name: "auth.py", group: "module" },
        { id: "db", name: "database.py", group: "module" },
        { id: "models", name: "models.py", group: "module" },
        { id: "payment", name: "payment_service.py", group: "module" },
        { id: "User", name: "User", group: "class" },
        { id: "Transaction", name: "Transaction", group: "class" },
        { id: "login", name: "login()", group: "function" },
        { id: "verify_token", name: "verify_token()", group: "function" },
        { id: "process_payment", name: "process_payment()", group: "function" },
        { id: "get_db", name: "get_db()", group: "function" }
      ],
      links: [
        { source: "api", target: "auth", value: 1 },
        { source: "api", target: "payment", value: 1 },
        { source: "auth", target: "db", value: 1 },
        { source: "auth", target: "User", value: 1 },
        { source: "payment", target: "db", value: 1 },
        { source: "payment", target: "Transaction", value: 1 },
        { source: "login", target: "verify_token", value: 1 },
        { source: "login", target: "User", value: 1 },
        { source: "process_payment", target: "Transaction", value: 1 },
        { source: "process_payment", target: "verify_token", value: 1 },
        { source: "db", target: "get_db", value: 1 }
      ]
    });
  };

  const handleIngest = async () => {
    if (!repoUrl) return;
    setIngesting(true);
    setIngestStatus({ status: 'info', message: 'Analyzing repository structure...' });
    try {
      const res = await axios.post('http://localhost:8000/api/v1/ingest', { repo_url: repoUrl });
      setIngestStatus({ status: 'success', message: res.data.message });
      setActiveRepo(res.data.metadata.name);
      fetchGraph(res.data.metadata.name);
    } catch (e: any) {
      console.warn("Backend API failed. Falling back to Demo Mode to ensure visualization renders.");
      // Automatically fallback to demo data if the API is down
      setTimeout(() => {
        loadDemoData(repoUrl);
        setIngesting(false);
      }, 1500);
      return;
    } 
    setIngesting(false);
  };

  const fetchGraph = async (repoName: string) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/graph/${repoName}`);
      setGraphData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuery = async () => {
    if (!query) return;
    setQuerying(true);

    // If we are in fallback / demo mode (either explicit or implicit based on graph data context)
    if (activeRepo === "fastapi-demo-core" || !ingestStatus?.message.includes("Successfully ingested")) {
      setTimeout(() => {
        setQueryResult({
          question: query,
          answer: "Based on the mock architecture data, the authentication flow relies heavily on `database.py` and the `User` class. If you change authentication, you also need to ensure the `payment_service.py` is updated, since it verifies tokens downstream.",
          context: {
            snippets: [
              { file_path: "auth.py", type: "module", name: "auth.py" },
              { file_path: "database.py", type: "module", name: "database.py" }
            ]
          }
        });
        setQuerying(false);
      }, 1500);
      return;
    }

    try {
      const res = await axios.post('http://localhost:8000/api/v1/query', { question: query });
      setQueryResult(res.data);
    } catch (e) {
      console.error(e);
      // Fallback response if AI is down
      setQueryResult({
         question: query,
         answer: "Backend AI unreachable. Returning fallback architectural analysis: This module represents a critical intersection of data.",
         context: { snippets: [] }
      });
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-64 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
      <div className="absolute top-0 -right-64 w-96 h-96 bg-cyan-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-64 left-1/2 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/10">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white tracking-tight leading-none">
                Architecture<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
              </h1>
              <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Intelligence System</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <button 
              onClick={() => loadDemoData()}
              className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Demo View
            </button>
            <div className="h-6 gap-0 w-px bg-slate-800 hidden md:block"></div>
            <div className="relative group hidden md:flex">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="https://github.com/user/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleIngest()}
                className="bg-slate-900/50 border border-slate-700/50 text-sm rounded-full pl-9 pr-28 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-96 transition-all placeholder-slate-500 text-white shadow-inner"
              />
              <button 
                onClick={handleIngest}
                disabled={ingesting}
                className="absolute right-1 top-1 bottom-1 bg-white text-slate-900 hover:bg-slate-200 text-xs font-bold px-5 rounded-full transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {ingesting ? 'Scanning...' : 'Analyze'}
                {!ingesting && <ChevronRight className="w-3 h-3 stroke-[3]" />}
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Graph */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 flex flex-col gap-8"
        >
          {ingestStatus && ingestStatus.status === 'success' && (
             <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
             >
               <Sparkles className="w-4 h-4 flex-shrink-0" />
               {ingestStatus.message}
             </motion.div>
          )}

          <div className="h-[600px] w-full relative rounded-2xl group/graph glass-panel overflow-hidden">
            <GraphVisualization data={graphData} />
            {ingestStatus?.status === 'info' && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl z-20">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <Cpu className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <p className="text-xl font-display font-medium text-white">{ingestStatus.message}</p>
                <p className="text-sm text-slate-400 mt-2">Extracting AST and mapping dependencies...</p>
              </div>
            )}
          </div>
          
          {/* RAG Query Interface */}
          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none" />
            
            <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-3 text-white relative z-10">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              Ask the Architecture AI
            </h2>
            <div className="flex gap-4 relative z-10">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. What services depend on the authentication flow?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600 shadow-inner text-white"
                />
              </div>
              <button 
                onClick={handleQuery}
                disabled={querying || !query}
                className="bg-white hover:bg-slate-200 text-slate-900 font-semibold px-8 py-3.5 rounded-xl transition-all disabled:opacity-50 shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center min-w-[120px]"
              >
                {querying ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  'Query'
                )}
              </button>
            </div>

            <AnimatePresence>
              {queryResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-6 bg-slate-950/80 rounded-xl border border-white/5"
                >
                  <div className="prose prose-invert prose-indigo max-w-none text-sm md:text-base">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{queryResult.answer}</p>
                  </div>
                  {queryResult.context?.snippets?.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-800/50">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Context Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {queryResult.context.snippets.map((s: any, i: number) => (
                          <div key={i} className="text-xs font-mono bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 flex items-center gap-2 text-slate-400">
                            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                            {s.file_path.split('/').pop()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Column: PR Impact Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-1"
        >
          <PRImpactDashboard repoName={activeRepo} />
        </motion.div>
      </main>
    </div>
  );
}

export default App;
