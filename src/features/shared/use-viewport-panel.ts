'use client';
import {useLayoutEffect,useRef} from 'react';
/** A fixed viewport budget keeps result scrolling separate from the page footer. */
export function useViewportPanel(){
 const ref=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{const panel=ref.current;if(!panel)return;const measure=()=>panel.style.setProperty('--data-panel-height',`${Math.max(1,Math.floor(window.innerHeight-panel.getBoundingClientRect().top))}px`);const observer=new ResizeObserver(measure),mutations=new MutationObserver(measure);if(panel.parentElement){panel.parentElement.scrollTop=0;observer.observe(panel.parentElement);mutations.observe(panel.parentElement,{childList:true});}const header=panel.closest('.app-main')?.querySelector('header');if(header)observer.observe(header);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);measure();return()=>{observer.disconnect();mutations.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};},[]);
 return ref;
}
