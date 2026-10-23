"use client";

export function ModuleSearch({title,value,onChange,placeholder}:{
  title:string;value:string;onChange:(value:string)=>void;placeholder:string;
}) {
  return <label className="search-input">Search {title}
    <input type="search" value={value} onChange={event=>onChange(event.target.value)} placeholder={placeholder}/>
  </label>;
}
