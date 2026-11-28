// Resolve legacy catalog entries while keeping the editor's stored data intact.
const destinations = new Map(Object.entries({
  "https://superdeterminism-dream.sunny-seed-0354.chatgpt.site": "https://masato-lab.pages.dev/apps/superdeterminism/",
  "https://personal-jet-flight-nasu.sunny-seed-0354.chatgpt.site": "https://masato-lab.pages.dev/apps/fighter-jet/",
  "https://dub-siren.sunny-seed-0354.chatgpt.site": "https://masato-lab.pages.dev/apps/dub-riddim/",
  "https://double-qr-pwa.sunny-seed-0354.chatgpt.site": "https://masato-lab.pages.dev/apps/double-qr/",
  "https://grammar-studio-nasu.sunny-seed-0354.chatgpt.site": "https://masato-lab.pages.dev/apps/grammar-studio/"
}));

export function migratedTool(tool) {
  const appUrl = destinations.get(String(tool?.appUrl || '').replace(/\/$/, ''));
  return appUrl ? {...tool, appUrl} : tool;
}
