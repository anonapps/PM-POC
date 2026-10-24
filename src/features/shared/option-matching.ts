export function matchesOption<T>(item:T,query:string):boolean {
  const normalise=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase();
  const terms=normalise(query.trim()).split(/\s+/).filter(Boolean);
  if(terms.length===0)return true;
  const haystack=normalise(labelFor(item));
  return terms.every(term=>haystack.includes(term));
}
function labelFor<T>(item:T):string {
  if(typeof item==="string")return item;
  if(item&&typeof item==="object") {
    const values=["label","name","title","humanId","id"].filter(key=>key in item).map(key=>String((item as Record<string,unknown>)[key]??""));
    if(values.length)return values.join(" ");
  }
  return String(item);
}
