/** Pure viewport geometry shared by every filter panel; flip above near the bottom. */
export function filterPanelPosition(anchor:{left:number;top:number;bottom:number},width:number,height:number) {
  const margin=8,gap=6,panelWidth=Math.min(400,Math.max(0,width-margin*2));
  const below=Math.max(0,height-anchor.bottom-gap-margin),above=Math.max(0,anchor.top-gap-margin);
  const useAbove=below<280&&above>below;
  const maxHeight=Math.min(480,useAbove?above:below);
  return {left:Math.max(margin,Math.min(anchor.left,width-panelWidth-margin)),top:useAbove?Math.max(margin,anchor.top-gap-maxHeight):Math.max(margin,Math.min(height-margin,anchor.bottom+gap)),width:panelWidth,maxHeight};
}
