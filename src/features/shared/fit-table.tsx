"use client";
import { Children,cloneElement,isValidElement,useLayoutEffect,useRef,type ReactNode,type ComponentPropsWithRef } from "react";

/** Consistent clipped header labels retain full text and sortable controls. */
function headingText(value:ReactNode):string{return Children.toArray(value).map(child=>typeof child==='string'||typeof child==='number'?String(child):isValidElement<{children?:ReactNode}>(child)?headingText(child.props.children):'').join('');}
function sharedHeadings(children:ReactNode):ReactNode{return Children.map(children,child=>{
 if(!isValidElement<{children?:ReactNode;title?:string}>(child))return child;
 if(child.type==='th')return cloneElement(child,{title:child.props.title??(headingText(child.props.children)||undefined)},<div className="column-heading-label">{child.props.children}</div>);
 if(child.type==='thead'||child.type==='tr')return cloneElement(child,{},sharedHeadings(child.props.children));
 return child;
});}

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
  }}>{sharedHeadings(children)}</table>;
}
