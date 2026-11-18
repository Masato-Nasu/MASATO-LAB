export const totoNippo = {
  title: '東都日報', slug: 'toto-nippo',
  description: '世界はおかしい。新聞は真面目。平行世界の出来事を、真面目な新聞の文体で読む架空の朝刊です。今日を中心に前後50年の日付を指定でき、交通、食、学校、文化、スポーツなど多彩な記事を届けます。OpenAI APIキーを使うBYOK方式。アプリを開いた日の新聞を生成・保存し、保存済みの号は再生成せずに読めます。JPEG保存・端末の共有メニュー、HTML共有、JSONバックアップに対応。ホーム画面に追加できるPWA。保存済みの紙面はオフラインでも閲覧できます（新規生成は通信が必要）。記事はフィクションです。',
  image: '/images/toto-nippo.svg', imageRatio: '4:3', imageFit: 'contain',
  appUrl: 'https://masato-lab.pages.dev/apps/toto-nippo/',
  repoUrl: 'https://github.com/Masato-Nasu/TOTO-NIPPO',
  category: 'art-concept', platform: 'web', platforms: ['web'],
  toolsPlacement: 'other', toolsPlacementEdited: true,
  tags: ['FICTION', 'NEWSPAPER', 'BYOK', 'JPEG', 'PWA']
};
export function ensureTotoNippo(data) {
  if (!data) return data;
  const tools = Array.isArray(data.tools) ? data.tools : [];
  if (tools.some(t => t.slug === 'toto-nippo' || t.repoUrl === totoNippo.repoUrl || t.title === totoNippo.title)) return data;
  return {...data, tools: [...tools, {...totoNippo}]};
}
