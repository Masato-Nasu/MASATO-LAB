const sanaRadio = {
  title: 'SANA RADIO',
  slug: 'sana-radio',
  description: '存在しない世界から届く、意味のある放送。短波ラジオのダイヤルで、SANA語の架空ニュース、天気予報、深夜トーク、Peripheral Memoryのエッセー朗読、インストゥルメンタルDUBを聴けます。日本語と英語の字幕、6SEG文字表示、ホーム画面への追加に対応。OpenAI APIキーを設定すると、新しい原稿やDUBを生成できます。',
  image: '/apps/sana-radio/icon-512.png',
  imageRatio: '4:3',
  imageFit: 'contain',
  appUrl: 'https://masato-lab.pages.dev/apps/sana-radio/',
  repoUrl: 'https://github.com/Masato-Nasu/MASATO-LAB/tree/main/apps/sana-radio',
  category: 'music-sound',
  platform: 'web',
  platforms: ['web'],
  toolsPlacement: 'main',
  toolsPlacementEdited: true,
  tags: ['SANA', '人工言語', 'RADIO', 'DUB', 'PWA']
};

export function ensureSanaRadio(data) {
  if (!data) return data;
  const tools = Array.isArray(data.tools) ? data.tools : [];
  if (tools.some(item => item?.slug === sanaRadio.slug || item?.title === sanaRadio.title || item?.appUrl === sanaRadio.appUrl)) return data;
  return {...data, tools: [...tools, {...sanaRadio}]};
}
