// Unspecified and newly added tools default to the other tools page.
export function toolKey(value = '') {
  return String(value).normalize('NFKC').toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]/g, '');
}
const selected = ['JIJI FIGHTER', 'TANGO-CHO2', 'DATA BOTTLE', 'SANA LANGUAGE', 'EphemeralCypher / エフェメラルサイファー', 'KUSUDAMA'].map(toolKey);
export function selectedToolRank(tool) {
  return selected.indexOf(toolKey(tool.title));
}
export function isMainTool(tool) {
  if (tool.toolsPlacement === 'main') return true;
  if (tool.toolsPlacement === 'other') return false;
  return selectedToolRank(tool) >= 0;
}
