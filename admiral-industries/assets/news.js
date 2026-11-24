(()=>{
'use strict';
// Add new announcements here; the home page displays the latest five.
const news=[
  [
    "2026-11-24",
    "CORPORATE",
    "全4製品の価格を0円に設定",
    "All four products now offered at ¥0",
    "製品ページに価格と購入ボタンを追加しました。決済・会員登録は不要です。外部APIの利用料金は別途発生する場合があります。",
    "Product pages now show a price and purchase button. No payment or registration is required; external API usage may incur separate charges.",
    "#products",
    "products"
  ],
  [
    "2026-11-24",
    "CORPORATE",
    "コーポレートサイトの表示を改善",
    "Corporate website design refinements",
    "ロゴの輪郭や文字の組版を調整し、製品画像に重なっていた番号ラベルを削除しました。",
    "We refined the logo and typography and removed number labels that obscured product images.",
    "",
    ""
  ],
  [
    "2026-11-23",
    "CORPORATE",
    "2027年度経営計画を公開",
    "FY2027 business plan published",
    "経営方針・事業報告を掲載しました。発明的な体験を持続可能な開発につなげる方針です。",
    "Our management policy and operating report outline how inventive experiences can become a sustainable creative practice.",
    "leadership/",
    "leadership"
  ],
  [
    "2026-11-22",
    "RELEASE",
    "SANA RADIOを公開",
    "SANA RADIO released",
    "人工言語SANAで音楽、ニュース、天気、深夜番組などを放送する架空のラジオ局です。",
    "An imaginary radio station broadcasting music, news, weather and late-night programs in the constructed SANA language.",
    "products/sana-radio/",
    "sana-radio"
  ],
  [
    "2026-11-22",
    "UPDATE",
    "HYPER HAIKUの俳句生成を改善",
    "HYPER HAIKU poetry generation refined",
    "季節を直接説明するのではなく、季語を用いた俳句を生成するよう改善しました。",
    "We refined haiku generation to express the seasons through seasonal words (kigo), rather than naming the seasons directly.",
    "products/hyper-haiku/",
    "hyper-haiku"
  ],
  [
    "2026-11-21",
    "RELEASE",
    "JFLATBADを公開",
    "JFLATBAD released",
    "ありえない発明を公報のような形式で検索・生成する、特許制度を題材にした創作作品です。",
    "A satirical creative work that searches and generates impossible inventions in the style of patent publications.",
    "products/jflatbad/",
    "jflatbad"
  ]
];
const root=document.querySelector('[data-news-list]');if(!root)return;
const archive=root.dataset.newsList==='archive';const base=archive?'../':'./';
const el=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node;};
const bilingual=(node,ja,en)=>{node.append(el('span','ja',ja),el('span','en',en));return node;};
news.slice().sort((a,b)=>b[0].localeCompare(a[0])).slice(0,archive?news.length:5).forEach((entry,i)=>{
 const [date,category,ja,en,bodyJa,bodyEn,url]=entry;const id='news-'+date+'-'+(i+1);const item=el('article','news-row');item.id=id;
 const time=el('time','news-date',date.replaceAll('-','.'));time.dateTime=date;item.append(time,el('span','news-category',category));
 const content=el('div','news-content');const title=el(archive?'h2':'a','news-title');if(!archive)title.href='news/#'+id;bilingual(title,ja,en);content.append(title);
 if(archive){content.append(bilingual(el('p','news-description'),bodyJa,bodyEn));if(url){const link=el('a','news-related');link.href=base+url;bilingual(link,'関連ページを見る ↗','Related page ↗');content.append(link);}}
 item.append(content);root.append(item);
});
})();
