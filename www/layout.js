/* Tata letak tombol sentuh: fungsi murni tanpa DOM, supaya bisa dites di Node (lihat test/layout.test.js).
   Satuan: piksel CSS. Posisi tombol disimpan sebagai pecahan layar (x, y dari 0 sampai 1), s = skala, o = transparansi. */
const CTRL={stick:{w:132,h:132},tAtk:{w:92,h:92},tDash:{w:68,h:68},tPower:{w:64,h:64},tSwap:{w:58,h:58},tPause:{w:44,h:36}};
const CNAME={stick:'JOYSTICK',tAtk:'SERANG',tDash:'DASH',tPower:'POWER',tSwap:'GANTI SENJATA',tPause:'JEDA'};
const GRID=8;      // langkah snap (px)
const GAP=6;       // jarak minimum antar tombol saat dirapikan (px)

const _cl=(v,a,b)=>v<a?a:v>b?b:v;

/* Perkiraan area aman untuk orientasi yang belum pernah diukur.
   Poni biasanya ada di satu sisi pendek layar: saat HP diputar, sisi itu pindah dari kiri/kanan ke atas (dan sebaliknya).
   s = area aman terukur di orientasi `from`; hasilnya perkiraan untuk orientasi `to` ('land' | 'port'). */
function estSafe(s,from,to){
  if(from===to)return {t:s.t,r:s.r,b:s.b,l:s.l};
  const notch=Math.max(s.t,s.l,s.r);
  if(to==='port')return {t:notch,r:0,b:Math.max(s.b,0),l:0};
  return {t:0,r:notch,b:Math.max(s.b,0),l:notch};
}

/* Tata letak bawaan. W,H = ukuran layar pada orientasi itu, s = area aman {t,r,b,l} PADA orientasi itu. */
function defLayout(W,H,s){
  s=s||{t:0,r:0,b:0,l:0};
  const m=14,L=s.l+m,R=W-s.r-m,B=H-s.b-m,T=s.t+m,f=(x,y)=>({x:x/W,y:y/H,s:1});
  const pause=f(R-206,T+20);
  if(W>=H)return {stick:f(L+70,B-70),tAtk:f(R-46,B-50),tDash:f(R-136,B-34),tPower:f(R-42,B-140),tSwap:f(R-136,B-108),tPause:pause};
  return {stick:f(L+72,B-96),tAtk:f(R-46,B-110),tDash:f(R-136,B-84),tPower:f(R-42,B-204),tSwap:f(R-136,B-166),tPause:pause};
}

/* Persegi (pusat dan setengah ukuran) satu tombol, sudah dijepit ke area aman. Sama persis dengan yang dipakai applyLayout. */
function ctlRect(id,l,W,H,s){
  const c=CTRL[id],w=c.w*l.s,h=c.h*l.s,hx=w/2,hy=h/2;
  const cx=_cl(l.x*W,s.l+hx,Math.max(s.l+hx,W-s.r-hx));
  const cy=_cl(l.y*H,s.t+hy,Math.max(s.t+hy,H-s.b-hy));
  return {id,cx,cy,hx,hy};
}

/* Dua tombol dianggap bertumpuk bila kotaknya menyatu lebih dari `tol` px. Joystick dan tombol bulat dipersempit
   sedikit (sudut kotak kosong) supaya tombol yang berdekatan tapi tidak benar-benar bersentuhan tidak ikut ditandai. */
function overlapOf(a,b,tol){
  tol=tol||0;
  const sh=r=>r.id==='tPause'?0:r.hx*.12;
  const ox=(a.hx-sh(a))+(b.hx-sh(b))-Math.abs(a.cx-b.cx);
  const oy=(a.hy-sh(a))+(b.hy-sh(b))-Math.abs(a.cy-b.cy);
  return ox>tol&&oy>tol?{ox,oy}:null;
}
function findOverlaps(layout,W,H,s){
  const ids=Object.keys(CTRL),rs=ids.map(id=>ctlRect(id,layout[id],W,H,s)),bad=new Set();
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)if(overlapOf(rs[i],rs[j],2)){bad.add(rs[i].id);bad.add(rs[j].id);}
  return bad;
}

/* Rapikan: dorong pasangan yang bertumpuk menjauh (sumbu dengan tumpang tindih paling kecil), jepit ke area aman, ulangi.
   Mengubah `layout` di tempat. Mengembalikan true bila akhirnya tidak ada yang bertumpuk. */
function separate(layout,W,H,s){
  const ids=Object.keys(CTRL);
  for(let it=0;it<80;it++){
    let moved=false;
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
      const a=ctlRect(ids[i],layout[ids[i]],W,H,s),b=ctlRect(ids[j],layout[ids[j]],W,H,s),o=overlapOf(a,b,0);
      if(!o)continue; moved=true;
      const A=layout[ids[i]],B=layout[ids[j]];
      if(o.ox<o.oy){const d=(o.ox+GAP)/2*(a.cx<=b.cx?-1:1);A.x=(a.cx+d)/W;B.x=(b.cx-d)/W;}
      else{const d=(o.oy+GAP)/2*(a.cy<=b.cy?-1:1);A.y=(a.cy+d)/H;B.y=(b.cy-d)/H;}
      for(const k of [ids[i],ids[j]]){const r=ctlRect(k,layout[k],W,H,s);layout[k].x=r.cx/W;layout[k].y=r.cy/H;}
    }
    if(!moved)break;
  }
  return findOverlaps(layout,W,H,s).size===0;
}

/* Snap ke kisi GRID px. */
const snapPx=(v,on)=>on?Math.round(v/GRID)*GRID:v;

/* Batas geser untuk menggeser SEMUA tombol sekaligus: delta (px) yang masih menjaga setiap tombol di dalam area aman. */
function groupDeltaLimits(layout,W,H,s){
  let x0=-Infinity,x1=Infinity,y0=-Infinity,y1=Infinity;
  for(const id of Object.keys(CTRL)){
    const r=ctlRect(id,layout[id],W,H,s);
    x0=Math.max(x0,s.l+r.hx-r.cx);x1=Math.min(x1,W-s.r-r.hx-r.cx);
    y0=Math.max(y0,s.t+r.hy-r.cy);y1=Math.min(y1,H-s.b-r.hy-r.cy);
  }
  return {x0:Math.min(x0,0),x1:Math.max(x1,0),y0:Math.min(y0,0),y1:Math.max(y1,0)};
}

if(typeof module!=='undefined'&&module.exports)module.exports={CTRL,CNAME,GRID,GAP,estSafe,defLayout,ctlRect,overlapOf,findOverlaps,separate,snapPx,groupDeltaLimits};
