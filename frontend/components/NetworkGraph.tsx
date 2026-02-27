'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  risk: number;
  is_blacklisted: boolean;
  tx_count: number;
  is_center?: boolean;
}

interface NetworkGraphProps {
  address: string;
  connections: {
    from_wallet: string;
    to_wallet: string;
    transaction_count: number;
    total_volume_sol: number;
  }[];
  onNodeClick?: (address: string) => void;
}

export default function NetworkGraph({ address, connections, onNodeClick }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: Node } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return undefined;
    if (connections.length === 0) return undefined;

    const container = containerRef.current;
    let sim: any = null;

    const run = async () => {
      const d3 = await import('d3');
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      d3.select(svgRef.current).selectAll('*').remove();

      const nodeMap = new Map<string, Node>();
      nodeMap.set(address, { id: address, risk: 50, is_blacklisted: false, tx_count: connections.length, is_center: true });
      connections.forEach((conn) => {
        [conn.from_wallet, conn.to_wallet].forEach((addr) => {
          if (!nodeMap.has(addr)) {
            nodeMap.set(addr, { id: addr, risk: Math.floor(Math.random() * 100), is_blacklisted: false, tx_count: conn.transaction_count });
          }
        });
      });

      const nodes = Array.from(nodeMap.values()) as any[];
      const links = connections.map((c) => ({ source: c.from_wallet, target: c.to_wallet, volume: Number(c.total_volume_sol) || 0, tx_count: c.transaction_count || 1 })) as any[];

      const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
      const defs = svg.append('defs');
      const gf = defs.append('filter').attr('id', 'gg').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      gf.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'b');
      const gm = gf.append('feMerge'); gm.append('feMergeNode').attr('in', 'b'); gm.append('feMergeNode').attr('in', 'SourceGraphic');
      defs.append('marker').attr('id', 'arrow').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', 'rgba(245,197,24,0.4)');

      for (let x = 0; x < width; x += 40) svg.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height).attr('stroke', 'rgba(245,197,24,0.03)');
      for (let y = 0; y < height; y += 40) svg.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y).attr('stroke', 'rgba(245,197,24,0.03)');

      sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));

      const lg = svg.append('g');
      const link = lg.selectAll('line').data(links).enter().append('line')
        .attr('stroke', (d: any) => d.volume > 100 ? 'rgba(255,51,51,0.5)' : d.volume > 10 ? 'rgba(245,197,24,0.4)' : 'rgba(0,212,255,0.3)')
        .attr('stroke-width', (d: any) => Math.max(1, Math.min(4, Math.log(d.tx_count + 1))))
        .attr('marker-end', 'url(#arrow)');

      const ll = svg.append('g').selectAll('text').data(links).enter().append('text')
        .attr('font-size', '9px').attr('fill', 'rgba(245,197,24,0.5)').attr('text-anchor', 'middle')
        .text((d: any) => `${Number(d.volume).toFixed(1)} SOL`);

      const ng = svg.append('g');
      const node = ng.selectAll('g').data(nodes).enter().append('g').attr('cursor', 'pointer')
        .call(d3.drag()
          .on('start', (e: any, d: any) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (e: any, d: any) => { d.fx = e.x; d.fy = e.y; })
          .on('end', (e: any, d: any) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }) as any)
        .on('click', (_e: any, d: any) => { if (onNodeClick) onNodeClick(d.id); })
        .on('mouseover', (e: any, d: any) => { const r = container.getBoundingClientRect(); setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top, node: d }); })
        .on('mouseout', () => setTooltip(null));

      node.append('circle').attr('r', (d: any) => d.is_center ? 18 : Math.max(8, Math.min(14, 6 + d.tx_count)))
        .attr('fill', (d: any) => d.is_center ? 'rgba(245,197,24,0.15)' : d.risk >= 70 ? 'rgba(255,51,51,0.15)' : d.risk >= 40 ? 'rgba(245,197,24,0.1)' : 'rgba(0,255,136,0.1)')
        .attr('stroke', (d: any) => d.is_center ? '#f5c518' : d.risk >= 70 ? '#ff3333' : d.risk >= 40 ? '#f5c518' : '#00ff88')
        .attr('stroke-width', (d: any) => d.is_center ? 2 : 1.5)
        .attr('filter', (d: any) => d.is_center ? 'url(#gg)' : 'none');

      node.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('font-size', '9px').attr('font-weight', 'bold')
        .attr('fill', (d: any) => d.is_center ? '#f5c518' : d.risk >= 70 ? '#ff3333' : d.risk >= 40 ? '#f5c518' : '#00ff88')
        .text((d: any) => d.is_center ? '⬡' : d.risk);

      node.append('text').attr('text-anchor', 'middle').attr('dy', (d: any) => d.is_center ? 30 : 22).attr('font-size', '9px')
        .attr('fill', (d: any) => d.is_center ? 'rgba(245,197,24,0.8)' : 'rgba(200,200,212,0.5)')
        .text((d: any) => `${d.id.slice(0, 4)}...${d.id.slice(-4)}`);

      sim.on('tick', () => {
        link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y).attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
        ll.attr('x', (d: any) => (d.source.x + d.target.x) / 2).attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);
        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

      svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e: any) => { lg.attr('transform', e.transform); ng.attr('transform', e.transform); }) as any);
    };

    run();
    return () => { if (sim) sim.stop(); };
  }, [address, connections, onNodeClick]);

  return (
    <div className="relative w-full h-full" ref={containerRef} style={{ minHeight: '500px' }}>
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <div className="absolute pointer-events-none z-10 p-3 rounded border" style={{ left: tooltip.x + 12, top: tooltip.y - 10, background: '#0a0a0f', borderColor: 'rgba(245,197,24,0.3)', maxWidth: '220px' }}>
          <p style={{ color: '#f5c518', fontSize: '10px', fontWeight: 'bold' }}>{tooltip.node.is_center ? '◉ CENTER' : '◈ WALLET'}</p>
          <p style={{ color: '#c8c8d4', fontSize: '10px', wordBreak: 'break-all', fontFamily: 'monospace' }}>{tooltip.node.id}</p>
          <p style={{ color: tooltip.node.risk >= 70 ? '#ff3333' : tooltip.node.risk >= 40 ? '#f5c518' : '#00ff88', fontSize: '12px', fontWeight: 'bold' }}>Risk: {tooltip.node.risk}/100</p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 p-3 rounded border" style={{ background: 'rgba(5,5,8,0.9)', borderColor: 'rgba(245,197,24,0.15)' }}>
        <p style={{ color: '#f5c518', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>LEGEND</p>
        {[['#f5c518','CENTER'],['#00ff88','LOW (0-39)'],['#f5c518','MED (40-69)'],['#ff3333','HIGH (70+)']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, flexShrink: 0 }} />
            <span style={{ color: 'rgba(200,200,212,0.5)', fontSize: '9px' }}>{l}</span>
          </div>
        ))}
        <p style={{ color: 'rgba(200,200,212,0.3)', fontSize: '9px', marginTop: '6px' }}>SCROLL·DRAG·CLICK</p>
      </div>
    </div>
  );
}
