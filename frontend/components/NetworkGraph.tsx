'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  risk: number;
  is_blacklisted: boolean;
  tx_count: number;
  is_center?: boolean;
}

interface Link {
  source: string;
  target: string;
  volume: number;
  tx_count: number;
}

interface NetworkGraphProps {
  address: string;
  connections: {
    from_wallet: string;
    to_wallet: string;
    transaction_count: number;
    total_volume_sol: number;
    relationship_score?: number;
  }[];
  onNodeClick?: (address: string) => void;
}

export default function NetworkGraph({ address, connections, onNodeClick }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: Node } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(address);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || connections.length === 0) return undefined;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    // Build nodes and links from connections
    const nodeMap = new Map<string, Node>();

    // Center node
    nodeMap.set(address, {
      id: address,
      risk: 50,
      is_blacklisted: false,
      tx_count: connections.length,
      is_center: true,
    });

    connections.forEach((conn) => {
  [conn.from_wallet, conn.to_wallet].forEach((addr) => {
    if (!nodeMap.has(addr)) {
      nodeMap.set(addr, {
        id: addr,
        risk: Math.floor(Math.random() * 100),
        is_blacklisted: false,
        tx_count: conn.transaction_count,
      });
    }
  });
});

    const nodes: Node[] = Array.from(nodeMap.values());
    const links: Link[] = connections.map((conn) => ({
      source: conn.from_wallet,
      target: conn.to_wallet,
      volume: Number(conn.total_volume_sol) || 0,
      tx_count: conn.transaction_count || 1,
    }));

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Defs — glow filters
    const defs = svg.append('defs');

    // Gold glow
    const goldGlow = defs.append('filter').attr('id', 'glow-gold').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    goldGlow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const goldMerge = goldGlow.append('feMerge');
    goldMerge.append('feMergeNode').attr('in', 'coloredBlur');
    goldMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Red glow
    const redGlow = defs.append('filter').attr('id', 'glow-red').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    redGlow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const redMerge = redGlow.append('feMerge');
    redMerge.append('feMergeNode').attr('in', 'coloredBlur');
    redMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(245,197,24,0.4)');

    // Background grid
    const gridSize = 40;
    const gridGroup = svg.append('g').attr('class', 'grid');
    for (let x = 0; x < width; x += gridSize) {
      gridGroup.append('line')
        .attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height)
        .attr('stroke', 'rgba(245,197,24,0.03)').attr('stroke-width', 1);
    }
    for (let y = 0; y < height; y += gridSize) {
      gridGroup.append('line')
        .attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y)
        .attr('stroke', 'rgba(245,197,24,0.03)').attr('stroke-width', 1);
    }

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(120).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Links
    const linkGroup = svg.append('g').attr('class', 'links');
    const link = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        const vol = d.volume;
        if (vol > 100) return 'rgba(255,51,51,0.5)';
        if (vol > 10) return 'rgba(245,197,24,0.4)';
        return 'rgba(0,212,255,0.3)';
      })
      .attr('stroke-width', (d) => Math.max(1, Math.min(4, Math.log(d.tx_count + 1))))
      .attr('marker-end', 'url(#arrow)');

    // Link labels (volume)
    const linkLabel = svg.append('g').attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('font-size', '9px')
      .attr('fill', 'rgba(245,197,24,0.5)')
      .attr('font-family', 'Share Tech Mono, monospace')
      .attr('text-anchor', 'middle')
      .text((d) => `${Number(d.volume).toFixed(1)} SOL`);

    // Node groups
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<any, any>()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d: any) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (event, d: Node) => {
        setSelectedNode(d.id);
        if (onNodeClick) onNodeClick(d.id);
      })
      .on('mouseover', (event, d: Node) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        });
      })
      .on('mouseout', () => setTooltip(null));

    // Outer ring for center node
    node.filter((d: Node) => !!d.is_center)
      .append('circle')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(245,197,24,0.3)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    // Pulse ring for high risk
    node.filter((d: Node) => d.risk >= 70)
      .append('circle')
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,51,51,0.4)')
      .attr('stroke-width', 1);

    // Main node circle
    node.append('circle')
      .attr('r', (d: Node) => d.is_center ? 18 : Math.max(8, Math.min(14, 6 + d.tx_count)))
      .attr('fill', (d: Node) => {
        if (d.is_center) return 'rgba(245,197,24,0.15)';
        if (d.is_blacklisted) return 'rgba(255,0,0,0.2)';
        if (d.risk >= 70) return 'rgba(255,51,51,0.15)';
        if (d.risk >= 40) return 'rgba(245,197,24,0.1)';
        return 'rgba(0,255,136,0.1)';
      })
      .attr('stroke', (d: Node) => {
        if (d.is_center) return '#f5c518';
        if (d.is_blacklisted) return '#ff0000';
        if (d.risk >= 70) return '#ff3333';
        if (d.risk >= 40) return '#f5c518';
        return '#00ff88';
      })
      .attr('stroke-width', (d: Node) => d.is_center ? 2 : 1.5)
      .attr('filter', (d: Node) => {
        if (d.is_center) return 'url(#glow-gold)';
        if (d.risk >= 70) return 'url(#glow-red)';
        return 'none';
      });

    // Shield icon for center node
    node.filter((d: Node) => !!d.is_center)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '14px')
      .text('⬡')
      .attr('fill', '#f5c518');

    // Risk score label
    node.filter((d: Node) => !d.is_center)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-weight', 'bold')
      .attr('fill', (d: Node) => {
        if (d.risk >= 70) return '#ff3333';
        if (d.risk >= 40) return '#f5c518';
        return '#00ff88';
      })
      .text((d: Node) => d.risk);

    // Address label below node
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: Node) => d.is_center ? 30 : 22)
      .attr('font-size', '9px')
      .attr('font-family', 'Share Tech Mono, monospace')
      .attr('fill', (d: Node) => d.is_center ? 'rgba(245,197,24,0.8)' : 'rgba(200,200,212,0.5)')
      .text((d: Node) => `${d.id.slice(0, 4)}...${d.id.slice(-4)}`);

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        linkGroup.attr('transform', event.transform.toString());
        nodeGroup.attr('transform', event.transform.toString());
        svg.select('.link-labels').attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    return () => { simulation.stop(); };
  }, [address, connections]);

  const nodeColor = (risk: number) => {
    if (risk >= 70) return '#ff3333';
    if (risk >= 40) return '#f5c518';
    return '#00ff88';
  };

  return (
    <div className="relative w-full h-full" ref={containerRef} style={{ minHeight: '500px' }}>
      <svg ref={svgRef} className="w-full h-full" style={{ background: 'transparent' }} />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 p-3 rounded border"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: '#0a0a0f',
            borderColor: 'rgba(245,197,24,0.3)',
            boxShadow: '0 0 20px rgba(245,197,24,0.1)',
            maxWidth: '240px',
          }}
        >
          <p className="font-display text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--bat-gold)' }}>
            {tooltip.node.is_center ? '◉ CENTER NODE' : '◈ WALLET NODE'}
          </p>
          <p className="font-mono text-xs mb-2 break-all" style={{ color: '#c8c8d4', fontFamily: 'Share Tech Mono, monospace' }}>
            {tooltip.node.id}
          </p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>RISK</p>
              <p className="font-display text-sm font-black" style={{ color: nodeColor(tooltip.node.risk) }}>
                {tooltip.node.risk}/100
              </p>
            </div>
            <div>
              <p className="font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>TX COUNT</p>
              <p className="font-display text-sm font-black" style={{ color: '#c8c8d4' }}>
                {tooltip.node.tx_count}
              </p>
            </div>
            {tooltip.node.is_blacklisted && (
              <span className="font-display text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,0,0,0.2)', color: '#ff0000', border: '1px solid rgba(255,0,0,0.3)' }}>
                🚫 BLACKLISTED
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 p-3 rounded border"
        style={{ background: 'rgba(5,5,8,0.9)', borderColor: 'rgba(245,197,24,0.15)' }}
      >
        <p className="font-display text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--bat-gold)' }}>LEGEND</p>
        <div className="space-y-1.5">
          {[
            { color: '#f5c518', label: 'CENTER WALLET' },
            { color: '#00ff88', label: 'LOW RISK (0-39)' },
            { color: '#f5c518', label: 'MEDIUM RISK (40-69)' },
            { color: '#ff3333', label: 'HIGH RISK (70+)' },
            { color: '#ff0000', label: 'BLACKLISTED' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
              <span className="font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)', fontSize: '9px' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(245,197,24,0.1)' }}>
          <p className="font-display text-xs" style={{ color: 'var(--bat-text-dim)', fontSize: '9px' }}>
            SCROLL TO ZOOM · DRAG TO PAN · CLICK NODE
          </p>
        </div>
      </div>

      {/* Empty state */}
      {connections.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border"
              style={{ background: 'rgba(245,197,24,0.05)', borderColor: 'rgba(245,197,24,0.2)' }}
            >
              <span className="text-2xl">⬡</span>
            </div>
            <p className="font-display text-xs font-bold tracking-[0.2em] mb-1" style={{ color: 'var(--bat-gold)' }}>
              NO CONNECTIONS FOUND
            </p>
            <p className="font-body text-sm" style={{ color: 'var(--bat-text-dim)', fontWeight: 600 }}>
              Search a wallet with transaction history
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
