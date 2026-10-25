"use client";
import {useState} from 'react';
/** Presentation only: session storage never enters the project or command history. */
export function useSessionDisclosure(key:string){
 const [expanded,setExpanded]=useState(()=>{try{return typeof window==='undefined'||sessionStorage.getItem(key)!=='false';}catch{return true;}});
 return [expanded,(value:boolean)=>{setExpanded(value);try{sessionStorage.setItem(key,String(value));}catch{/* Storage may be unavailable. */}}] as const;
}
