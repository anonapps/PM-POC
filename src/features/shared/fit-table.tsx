"use client";
import { useLayoutEffect, useRef, type ComponentPropsWithRef } from "react";

/** Preserve all cells and sorting controls when rows wrap to fit the workspace. */
export function FitTable({children,ref:externalRef,className="",...props}:ComponentPropsWithRef<"table">) {
  const table=useRef<HTMLTableElement>(null);
  useLayoutEffect(()=>{
    const node=table.current;if(!node)return;
    const headings=Array.from(node.tHead?.rows[0]?.cells??[],cell=>cell.textContent?.replace(/[↑↓]/g,"").trim()||"Select");
    for(const body of node.tBodies)for(const row of body.rows)Array.from(row.cells).forEach((cell,index)=>{
      if(cell.colSpan===1)cell.dataset.field=headings[index]??"";
    });
  },[children]);
  return <table {...props} className={`fit-table ${className}`} ref={node=>{
    table.current=node;
    if(typeof externalRef==="function")return externalRef(node);
    if(externalRef)externalRef.current=node;
  }}>{children}</table>;
}
