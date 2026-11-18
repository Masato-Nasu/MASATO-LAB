// Editorial essay pinned to the public Peripheral Memory feed.
// Keep it separate from the KV editor data so existing user entries remain intact.
const essay = `アートの本質はコミュニケーションにある。

人はなぜ何かを作り、それを他者に見せたいと思うのだろうか。自分が面白いと感じたものを形にして世の中に差し出す。それは、自分の発見や感覚を誰かと共有したいという欲求なのかもしれない。

しかし、作品の意図がすべて理解される必要はない。わかる人にはわかってほしい。わからなくても、面白いと感じてもらえればよい。アートにおけるコミュニケーションとは、情報を正確に伝えることよりも、他者の中に何かを生じさせることなのだろう。

人間は誰でも敏感に世界を感じ取っている。形、重さ、手触り、心地よさ、違和感。膨大な知覚の多くは、意識に上ることなく処理されている。デザインは特に、この無意識の領域を扱う。

よくできた道具を使うとき、人はその使いやすさをいちいち意識しない。手が自然に動き、迷わず目的にたどり着く。使用者は設計上の意図を知らなくても、その働きを身体で受け取っている。気づかれないことは、伝わっていないことを意味しない。

では、クリエーターとそうでない人の違いは何だろうか。それは必ずしも感受性の強弱ではない。誰もが感じているものを意識の上に引き上げ、形にできること。そこにクリエーターの特徴があるのではないか。

一方で、創作は意識だけの仕事ではない。手を動かすうちに思いがけない形が現れ、そこから次の発想が生まれる。偶然が制作を導く。意識と無意識は一方通行ではなく、絶えず往復している。

無意識の知覚から意識へ。意識から作品へ。そして作品から、他者の無意識へ。

創作者が汲み上げたものは、作品を通じて別の人の身体や感覚に届く。受け手は作者の意図を言葉で理解しなくても、何かを感じ取ることができる。作品とは、そうした感覚の往復を可能にする媒体なのかもしれない。

AIはすでに多くの表現を生成できる。しかし、表現を作る能力と、それを誰かに伝えたいという欲求は同じではない。AIの時代だからこそ、身体で世界を感じ、それを他者へ差し出そうとする人間の営みが、改めて重要になるように思う。

創作とは、単なる自己表現ではない。無意識と意識を往復しながら、自己と他者をつなぐコミュニケーションなのである。`;

export const featuredMemory = {
  slug: "unconscious-communication",
  title: "創作とは、無意識を介したコミュニケーションである",
  date: "2026-11-18",
  comment: essay,
  image: "/images/unconscious-communication.svg",
  imageRatio: "16:9",
  imageFit: "cover",
  tags: ["Art", "Design", "Unconscious", "Communication"]
};

export function ensureFeaturedMemory(data) {
  if (!data || typeof data !== "object") return data;
  if (!Array.isArray(data.memory)) data.memory = [];
  if (!data.memory.some(item => item && (item.slug === featuredMemory.slug || item.title === featuredMemory.title))) {
    data.memory.unshift({ ...featuredMemory });
  }
  return data;
}
