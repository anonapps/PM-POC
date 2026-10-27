import { useId, type CSSProperties } from "react";

/** Smooth exit and arrival tangents make direction readable even for backward links. */
export function dependencyCurve(fromX:number,fromY:number,toX:number,toY:number):string {
  const bend=Math.max(2,Math.min(12,Math.abs(toX-fromX)/2));
  const lift=Math.abs(fromY-toY)<1?20:0;
  return `M ${fromX} ${fromY} C ${fromX+bend} ${fromY-lift}, ${toX-bend} ${toY-lift}, ${toX} ${toY}`;
}

export function DependencyConnectors({className,height,paths,label,style}:{className:string;height:number;paths:readonly {key:string;path:string;label:string}[];label:string;style?:CSSProperties}) {
  const markerId=`dependency-${useId().replace(/:/g,"")}`;
  return <svg className={`${className} dependency-connectors`} style={style} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-label={label}>
    <defs><marker id={markerId} markerWidth="5" markerHeight="5" viewBox="0 0 7 7" refX="14" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#456488"/></marker></defs>
    {paths.map(path=><g className="dependency-connection" key={path.key} tabIndex={0} role="img" aria-label={path.label}>
      <title>{path.label}</title>
      <path className="dependency-halo" d={path.path}/>
      <path className="dependency-line" d={path.path} markerEnd={`url(#${markerId})`}/>
      <path className="dependency-hit" d={path.path}/>
    </g>)}
  </svg>;
}
