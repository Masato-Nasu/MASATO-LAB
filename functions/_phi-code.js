const phiCode = {
  "title": "PHI CODE",
  "slug": "phi-code",
  "description": "情報はフレームとフレームの間に存在する。ファイ現象から着想した光学通信の実験です。24×24のマスの点滅をスマートフォンのカメラで読み取り、共有した秘密鍵で文章を復号します。AES-256-GCM、文章圧縮、受信フレームの補完に対応。AIやAPIキーを必要とせず、端末内で処理するPWAです。",
  "image": "/images/phi-code-slanted.svg",
  "imageRatio": "4:3",
  "imageFit": "contain",
  "appUrl": "https://phi-code.pages.dev/",
  "repoUrl": "https://github.com/Masato-Nasu/MASATO-LAB/blob/main/apps/phi-code/README.md",
  "category": "cipher-security",
  "platform": "web",
  "platforms": [
    "web"
  ],
  "toolsPlacement": "main",
  "toolsPlacementEdited": true,
  "tags": [
    "OPTICAL COMMUNICATION",
    "PHI PHENOMENON",
    "AES-256-GCM",
    "PWA"
  ]
};

export function ensurePhiCode(data) {
  if (!data) return data;
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const matches = t => t?.slug === phiCode.slug || String(t?.title || '').normalize('NFKC').trim().toUpperCase() === phiCode.title || String(t?.appUrl || '').replace(/\/$/, '') === phiCode.appUrl.replace(/\/$/, '');
  if (!tools.some(matches)) return {...data, tools: [...tools, {...phiCode}]};
  // Migrate the image and GitHub link even for records already saved in KV. Preserve placement and other editor fields.
  return {...data, tools: tools.map(t => matches(t) ? {...t, image: phiCode.image, repoUrl: phiCode.repoUrl} : t)};
}
