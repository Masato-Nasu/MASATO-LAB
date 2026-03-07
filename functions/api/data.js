const DEFAULT_DATA = {
  "site": {
    "name": "MASATO NASU",
    "tagline": "Portfolio · Peripheral Memory · Tools",
    "about": "Product designer / computational experiments.\n\nThis pack is designed so a person without a website can start one and run it seriously on GitHub Pages."
  },
  "portfolio": [
    {
      "title": "Example Work",
      "year": "2026",
      "role": "Design",
      "description": "Replace this with your own portfolio work.",
      "image": "",
      "imageRatio": "4:3",
      "link": "",
      "tags": [
        "example"
      ]
    },
    {
      "title": "Ouroboros Mobius Ring",
      "year": "2005",
      "role": "Accessories Design",
      "description": "このリングは、表と裏の区別をもたない、一続きの面からできています。\n外周に現れるエッジもまた一つだけで、どこまでも辿っていくことができます。\n見た目は静かでミニマルですが、内部にはきわめて特異な位相幾何学的構造が潜んでいます。\n\nこの形を中央で分けると、互いに鏡像関係にある二つのメビウスの輪として捉えることができます。\nそのためこのリングは、位相幾何学的には**「クラインの壺に一つ穴を開けたもの」**と同じ性質をもつ形態です。\n内と外、表と裏、始まりと終わりといった通常の区別がゆるやかにほどけ、一つの連続体として成立しています。\n\n造形としては、数学的な厳密さだけでなく、腕に通したときのやわらかな流れと自然ななじみも重視しました。\nサイズ感は女性の手に美しく収まりやすいバランスを意識しており、強い主張をしすぎず、それでいて見るたびに構造の不思議さが立ち上がるリングです。\n\n単なる装飾品ではなく、\n触れられるトポロジーとしてのジュエリー。\n身につけることで、かたちそのものが持つ知性と詩性を静かに感じられる作品です。",
      "image": "images/ouroboros-mobius-ring.png",
      "imageRatio": "4:3",
      "link": "",
      "tags": []
    }
  ],
  "memory": [
    {
      "title": "Example Memory",
      "url": "https://example.com",
      "comment": "Peripheral Memory is the blog section inside this site.\nURL + comment + tags.",
      "tags": [
        "example",
        "memory"
      ],
      "date": "2026-03-06"
    }
  ],
  "tools": [
    {
      "title": "Example Tool",
      "description": "Replace with your own app or tool.",
      "image": "",
      "appUrl": "",
      "repoUrl": "",
      "tags": [
        "example"
      ]
    }
  ]
};

export async function onRequestGet(context) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };

  try {
    const raw = await context.env.SITE_DATA.get("site-data");
    if (raw) return new Response(raw, { headers });
  } catch (error) {
    console.error("KV read failed", error);
  }

  return new Response(JSON.stringify(DEFAULT_DATA), { headers });
}
