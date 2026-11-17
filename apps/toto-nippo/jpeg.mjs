// Draw text directly to canvas: no external images, fonts, or SVG serialization.
export async function newspaperJpeg(issue){
 if(document.fonts?.ready)await document.fonts.ready;
 const W=1600,M=82,INK='#252c28',PAPER='#f1ede2',LINE='#aaa99d',ACCENT='#8b362b';
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=100;
 let ctx=canvas.getContext('2d');if(!ctx)throw Error('このブラウザーでは画像を作成できません。');
 const font=(n,bold=false)=>`${bold?'bold ':''}${n}px "Yu Mincho","Hiragino Mincho ProN","Noto Serif CJK JP",serif`;
 function lines(s,size,width,bold=false){ctx.font=font(size,bold);const result=[];for(const paragraph of String(s).split('\n')){let row='';for(const char of paragraph){if(row&&ctx.measureText(row+char).width>width){result.push(row);row=char}else row+=char}result.push(row)}return result}
 const commands=[];let bottom=0;
 function block(s,x,y,width,size=25,bold=false,color=INK,lineHeight=size*1.8){const rows=lines(s,size,width,bold);for(let i=0;i<rows.length;i++)commands.push({kind:'text',s:rows[i],x,y:y+i*lineHeight,size,bold,color});const end=y+rows.length*lineHeight;bottom=Math.max(bottom,end);return end}
 function rule(x,y,w,color=LINE){commands.push({kind:'rule',x,y,w,color});bottom=Math.max(bottom,y)}
 function label(s,x,y,w){block(s,x,y,w,20,true,ACCENT,30);rule(x,y+35,w);return y+55}
 const c=issue.content,inner=W-2*M;
 block('THE TOTO DAILY NEWS',M,35,inner,16,false,INK,22);
 block('世界はおかしい。新聞は真面目。',M,80,inner,24);
 block('東 都 日 報',W/2-310,137,800,100,true,INK,120);
 block('朝刊 · 平行世界版',W-380,90,310,26,true);
 rule(M,280,inner,INK);rule(M,287,inner,INK);
 block(issue.date.replaceAll('-','.')+'　朝刊',M,310,inner,29,true);
 block('架空の新聞 / FICTION',W-455,316,380,20,false,ACCENT);
 rule(M,365,inner,INK);
 let y=label(c.category,M,391,inner);
 y=block(c.headline,M,y,inner,63,true,INK,89)+10;
 y=block(c.deck,M,y,inner,30,true)+24;
 const gap=48,left=870,right=inner-left-gap,rx=M+left+gap;
 let ly=y;for(const paragraph of c.leadBody){ly=block('　'+paragraph,M,ly,left,28)+18}
 let ry=label('社会の窓',rx,y,right);ry=block(c.sideTitle,rx,ry,right,34,true)+10;ry=block(c.sideBody,rx,ry,right,25)+28;
 ry=label('東都のお天気',rx,ry,right);ry=block(c.weatherName+'　'+c.temperature,rx,ry,right,27,true)+8;ry=block(c.weatherBody,rx,ry,right,24)+28;
 ry=label('お詫びと訂正',rx,ry,right);ry=block(c.correction,rx,ry,right,24)+15;
 const middle=Math.max(ly,ry)+25;rule(M,middle,inner,INK);
 const col=(inner-2*gap)/3;let a=label('まちの話題',M,middle+25,col);a=block(c.localTitle,M,a,col,32,true)+12;a=block(c.localBody,M,a,col,25);
 const bx=M+col+gap;let b=label('東都余滴',bx,middle+25,col);b=block(c.columnTitle,bx,b,col,32,true)+12;b=block(c.columnBody,bx,b,col,25);
 const cx=bx+col+gap;let d=label('広告',cx,middle+25,col);d=block(c.adKicker,cx,d,col,23)+12;d=block(c.adTitle,cx,d,col,38,true)+12;d=block(c.adBody,cx,d,col,25)+20;d=block(c.adCompany,cx,d,col,27,true);
 y=Math.max(a,b,d)+35;rule(M,y,inner,INK);y=label('くらしの案内',M,y+24,inner);y=block(c.classified,M,y,inner,24)+25;
 rule(M,y,inner,INK);y=block('本紙はフィクションです。現実のニュース・予言ではありません。',M,y+25,inner,21)+10;
 block('東都日報  /  '+issue.date+'  /  PARALLEL WORLD PRESS',M,y,inner,18);
 const H=Math.ceil(bottom+60),scale=Math.min(1,8192/H,Math.sqrt(12000000/(W*H)));canvas.width=Math.floor(W*scale);canvas.height=Math.ceil(H*scale);ctx=canvas.getContext('2d');if(!ctx)throw Error('画像の作成に失敗しました。');ctx.scale(scale,scale);ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.textBaseline='top';
 for(const item of commands){ctx.fillStyle=item.color;ctx.strokeStyle=item.color;if(item.kind==='text'){ctx.font=font(item.size,item.bold);ctx.fillText(item.s,item.x,item.y)}else{ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(item.x,item.y);ctx.lineTo(item.x+item.w,item.y);ctx.stroke()}}
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('JPEGを作成できませんでした。')),'image/jpeg',.94));
}
