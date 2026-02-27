"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface Node extends d3.SimulationNodeDatum {
  id: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

interface NetworkGraphProps {
  connections: Link[];
  address: string;
}

export default function NetworkGraph({ connections, address }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(address);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || connections.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear old graph

    // Build nodes from links
    const nodes: Node[] = Array.from(
      new Set(connections.flatMap((l) => [l.source as string, l.target as string]))
    ).map((id) => ({ id }));

    // Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink<Node, Link>(connections).id((d) => d.id))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(connections)
      .join("line")
      .attr("stroke-width", 1.5);

    // Draw nodes
    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d) => (d.id === selectedNode ? "orange" : "steelblue"))
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (_, d) => setSelectedNode(d.id));

    // Update positions
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
    });

    // ✅ Proper cleanup
    return () => {
      simulation.stop();
    };
  }, [connections, address, selectedNode]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "500px" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}
