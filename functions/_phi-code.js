const phiCode = {
  "title": "PHI CODE",
  "slug": "phi-code",
  "description": "情報はフレームとフレームの間に存在する。ファイ現象から着想した光学通信の実験です。24×24のマスの点滅をスマートフォンのカメラで読み取り、共有した秘密鍵で文章を復号します。AES-256-GCM、文章圧縮、受信フレームの補完に対応。AIやAPIキーを必要とせず、端末内で処理するPWAです。",
  "image": "/images/phi-code.svg?v=071",
  "imageRatio": "4:3",
  "imageFit": "contain",
  "appUrl": "https://phi-code.pages.dev/",
  "repoUrl": "https://github.com/Masato-Nasu/MASATO-LAB/tree/main/apps/phi-code",
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
  if (tools.some(t => t?.slug === phiCode.slug || String(t?.title || '').trim().toUpperCase() === phiCode.title || String(t?.appUrl || '').replace(/\/$/, '') === phiCode.appUrl.replace(/\/$/, ''))) return data;
  return {...data, tools: [...tools, {...phiCode}]};
}
