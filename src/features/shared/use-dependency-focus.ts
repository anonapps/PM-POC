import { useState } from "react";

/** One pinned relationship; hover/focus previews temporarily take precedence. */
export function useDependencyFocus() {
  const [selectedKey,setSelectedKey]=useState<string|null>(null);
  const [previewKey,setPreviewKey]=useState<string|null>(null);
  return {
    selectedKey,activeKey:previewKey??selectedKey,
    preview:setPreviewKey,
    select:(key:string)=>{setPreviewKey(key);setSelectedKey(previous=>previous===key?null:key);},
    clear:()=>{setPreviewKey(null);setSelectedKey(null);},
  };
}
