// Keep the ADMIRAL INDUSTRIES entry visible in MASATO LAB's public catalog.
// The company is a fictional creative project, not a registered corporation.
// Do not insert a duplicate if the owner later saves an editable entry.
const admiralTool = {
  title: 'ADMIRAL INDUSTRIES',
  slug: 'admiral-industries',
  description: '開 愛（HIRAKI AI）社長と那須雅人デザイン会長による架空のソフトウェア企業。ゲーム、生成芸術、AIによる創作の実験を「製品」として紹介する、企業そのものを作品にしたプロジェクト。日本語・英語対応。企業理念は Be extremely inventive!!',
  image: '/admiral-industries/assets/admiral-logo.svg?v=3',
  imageRatio: '16:9',
  imageFit: 'contain',
  appUrl: 'https://masato-lab.pages.dev/admiral-industries/',
  repoUrl: 'https://github.com/Masato-Nasu/MASATO-LAB/tree/main/admiral-industries',
  category: 'art-concept',
  platform: 'web',
  platforms: ['web'],
  toolsPlacement: 'main',
  tags: ['AI', 'GENERATIVE ART', 'CORPORATE FICTION']
};

export function ensureAdmiralIndustries(data) {
  if (!data || !Array.isArray(data.tools)) return data;
  const normalize = text => String(text || '').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
  const exists = data.tools.some(tool => 
    normalize(tool?.title) === 'admiralindustries' ||
    normalize(tool?.slug) === 'admiralindustries' ||
    /\/admiral-industries\/?(?:[?#].*)?$/i.test(String(tool?.appUrl || ''))
  );
  if (!exists) data.tools.push({...admiralTool});
  return data;
}
