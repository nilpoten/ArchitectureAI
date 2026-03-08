import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface Node {
  id: string;
  name: string;
  group: string;
  val: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function GraphVisualization({ data }: { data: GraphData | null }) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Glowing color palette
  const getNodeColor = (node: Node) => {
    switch (node.group) {
      case 'module': return '#818cf8'; // Indigo 400
      case 'class': return '#c084fc'; // Purple 400
      case 'function': return '#2dd4bf'; // Teal 400
      default: return '#94a3b8'; // Slate 400
    }
  };

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 rounded-xl border border-slate-800">
        <p className="text-slate-400">No graph data available. Ingest a repository first.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950/20 rounded-2xl overflow-hidden relative isolate">
      {/* Soft overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-10 opacity-60"></div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-700 backdrop-blur-sm text-xs text-slate-300">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#2dd4bf'}}></div> Function</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#c084fc'}}></div> Class</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#818cf8'}}></div> Module</div>
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data || { nodes: [], links: [] }}
        nodeLabel="name"
        nodeColor={getNodeColor}
        nodeRelSize={6}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={2}
        linkColor={() => 'rgba(148, 163, 184, 0.2)'} // slate-400
        linkWidth={1.5}
        backgroundColor="transparent"
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        onEngineStop={() => {
          if (fgRef.current) {
            fgRef.current.zoomToFit(400, 50);
          }
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          
          // Outer Glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = getNodeColor(node as Node);
          
          ctx.fillStyle = getNodeColor(node as Node);
          ctx.beginPath();
          // @ts-ignore
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fill();
          
          // Reset shadow for text
          ctx.shadowBlur = 0;

          // Only show labels when zoomed in
          if (globalScale > 1.5) {
            ctx.font = `${fontSize}px Inter, Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            // @ts-ignore
            ctx.fillText(label, node.x, node.y + 8);
          }
        }}
      />
    </div>
  );
}
