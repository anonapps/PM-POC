import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/** Smooth exit and arrival tangents make direction readable even for backward links. */
export function dependencyCurve(fromX:number,fromY:number,toX:number,toY:number,horizontalScale=1):string {
  const bend=Math.max(2*horizontalScale,Math.min(12*horizontalScale,Math.abs(toX-fromX)/2));
  const lift=Math.abs(fromY-toY)<1?20:0;
  return `M ${fromX} ${fromY} C ${fromX+bend} ${fromY-lift}, ${toX-bend} ${toY-lift}, ${toX} ${toY}`;
}

export function DependencyConnectors({className,height,paths,label,style}:{className:string;height:number;paths:readonly {key:string;fromX:number;fromY:number;toX:number;toY:number;label:string}[];label:string;style?:CSSProperties}) {
  const markerId=`dependency-${useId().replace(/:/g,"")}`;
  const svgRef=useRef<SVGSVGElement>(null);
  const [width,setWidth]=useState(100);
  useLayoutEffect(()=>{
    const svg=svgRef.current;if(!svg)return;
    const measure=()=>setWidth(Math.max(1,svg.getBoundingClientRect().width));
    measure();const observer=new ResizeObserver(measure);observer.observe(svg);
    return ()=>observer.disconnect();
  },[]);
  return <svg ref={svgRef} className={`${className} dependency-connectors`} style={style} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label={label}>
    <defs><marker id={markerId} markerWidth="7" markerHeight="7" viewBox="0 0 7 7" markerUnits="userSpaceOnUse" refX="14" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#456488"/></marker></defs>
    {paths.map(path=>{const d=dependencyCurve(path.fromX*width/100,path.fromY,path.toX*width/100,path.toY,width/100);return <g className="dependency-connection" key={path.key} tabIndex={0} role="img" aria-label={path.label}>
      <title>{path.label}</title>
      <path className="dependency-halo" d={d}/>
      <path className="dependency-line" d={d} markerEnd={`url(#${markerId})`}/>
      <path className="dependency-hit" d={d}/>
    </g>;})}
  </svg>;
}
