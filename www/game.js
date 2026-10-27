/* Naci-Crypt (c) 2026 Muhammad Ikhsan / NaciTwo Games. Hak cipta dilindungi, lihat LICENSE. Dukung: https://sociabuzz.com/nacitwo/tribe */
(()=>{
'use strict';
/* ============ util ============ */
const TILE=16, MW=56, MH=40;
const $=id=>document.getElementById(id);
const rnd=Math.random, ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)), rf=(a,b)=>a+rnd()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, hyp=Math.hypot;
const pick=a=>a[Math.floor(rnd()*a.length)];
const cv=$('game'), g=cv.getContext('2d');
let CW=0,CH=0,S=3,U=2,HU=2,VW=0,VH=0;
function resize(){
  const d=Math.min(window.devicePixelRatio||1,2);
  CW=cv.width=Math.max(320,Math.floor(innerWidth*d)); CH=cv.height=Math.max(200,Math.floor(innerHeight*d));
  S=Math.max(2,Math.round(Math.min(CW/400,CH/225))); U=Math.max(1,Math.round(S*0.66)); HU=Math.max(U,Math.round((CW/Math.max(1,innerWidth))*2));
  VW=CW/S; VH=CH/S; g.imageSmoothingEnabled=false;
}
addEventListener('resize',resize); resize();

/* ============ assets ============ */
const SPR={}, IMG={};
const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(i);i.src=src;});
function silhouette(img,color){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);return c;}
async function loadAll(){
  const jobs=[];
  for(const [k,s] of Object.entries(ASSETS.sprites)){SPR[k]={};for(const [an,d] of Object.entries(s)){
    jobs.push(loadImg(d.src).then(im=>{SPR[k][an]=Object.assign({},d,{img:im,white:silhouette(im,'#fff'),gold:silhouette(im,'#ffd23f'),red:silhouette(im,'#ff3b3b'),ice:silhouette(im,'#9fe8ff')});}));}}
  for(const [k,src] of Object.entries(ASSETS.images)) jobs.push(loadImg(src).then(im=>{IMG[k]=im;}));
  if(typeof ASSETS2!=='undefined') for(const [k,src] of Object.entries(ASSETS2.images)) jobs.push(loadImg(src).then(im=>{IMG[k]=im;}));
  await Promise.all(jobs);
  try{buildArt();}catch(e){console.warn('buildArt gagal',e);}
}
/* ---- art turunan dari aset tambahan (DarkDungeon, Mini Dungeon, Crystals&Ore, RPG Items) ---- */
const ART={torch:[],crys:[],orb:{},slot:{},held:{},book:null};
const TORCH_RGB=['255,90,60','90,120,255','80,220,110','255,170,50','170,70,210','255,90,170','90,240,230','235,125,50'];
const CRYS_DEF=[
  {rgb:'185,140,255',gem:'gemB'},{rgb:'95,140,255',gem:'gemA'},{rgb:'168,236,255',gem:'gemA'},{rgb:'90,116,216',gem:'gemA'},
  {rgb:'63,224,138',gem:'gemA'},{rgb:'255,90,90',gem:'gemB'},{rgb:'255,225,74',gem:'gemB'},{rgb:'139,224,106',gem:'gemA'},{rgb:'232,240,255',gem:'gemA'}];
const mkCv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function outline(c){const o=mkCv(c.width+2,c.height+2),ox=o.getContext('2d'),sl=silhouette(c,'#0b0f17');
  for(let dx=0;dx<3;dx++)for(let dy=0;dy<3;dy++)if(dx!==1||dy!==1)ox.drawImage(sl,dx,dy);ox.drawImage(c,1,1);return o;}
function trimmed(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0)return {x:0,y:0,w:c.width,h:c.height};return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};}
function cropOf(c,t){const o=mkCv(t.w,t.h);o.getContext('2d').drawImage(c,t.x,t.y,t.w,t.h,0,0,t.w,t.h);return o;}
function rpgCell(name){const R=typeof ASSETS2!=='undefined'?ASSETS2.rpg:null;if(!R||!IMG.rpg)return null;const i=R.names.indexOf(name);if(i<0)return null;
  const c=mkCv(R.cell,R.cell);c.getContext('2d').drawImage(IMG.rpg,(i%R.cols)*R.cell,((i/R.cols)|0)*R.cell,R.cell,R.cell,0,0,R.cell,R.cell);return c;}
function smallOf(sx,sy,th){ // potong sprite 24x24 dari sheet kristal, kecilkan supaya pas jadi item di lantai
  const c=mkCv(24,24);c.getContext('2d').drawImage(IMG.crys,sx,sy,24,24,0,0,24,24);const t=trimmed(c),k=Math.min(1,th/t.h);
  const o=mkCv(Math.max(1,Math.round(t.w*k)),Math.max(1,Math.round(t.h*k))),x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
  x.drawImage(c,t.x,t.y,t.w,t.h,0,0,o.width,o.height);return o;}
function buildArt(){
  if(IMG.dd){ // obor/lampu berwarna: ambil piksel jenuh dari DarkDungeon.png (8 warna)
    for(let c=0;c<8;c++){const x0=80+16*(c%4),y0=c<4?130:178,W=16,H=26,cv2=mkCv(W,H),cx=cv2.getContext('2d');cx.drawImage(IMG.dd,x0,y0,W,H,0,0,W,H);
      const d=cx.getImageData(0,0,W,H),p=d.data,keep=new Uint8Array(W*H),sv=i=>{const r=p[i*4],g=p[i*4+1],b=p[i*4+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);return [mx?(mx-mn)/mx:0,mx];};
      for(let i=0;i<W*H;i++){const o=sv(i);if(o[0]>.42&&o[1]>70)keep[i]=1;}
      const k2=keep.slice();for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(keep[i])continue;if(sv(i)[1]>170&&((x>0&&keep[i-1])||(x<W-1&&keep[i+1])||(y>0&&keep[i-W])||(y<H-1&&keep[i+W])))k2[i]=1;}
      for(let i=0;i<W*H;i++)if(!k2[i])p[i*4+3]=0;cx.putImageData(d,0,0);ART.torch[c]=cropOf(cv2,trimmed(cv2));}
  }
  if(IMG.crys){
    for(let i=0;i<9;i++){const c=mkCv(24,24);c.getContext('2d').drawImage(IMG.crys,i*24,96,24,24,0,0,24,24);const t=trimmed(c);ART.crys[i]={img:c,t,white:silhouette(c,'#fff')};}
    IMG.gemA=smallOf(2*24,96,12);IMG.gemB=smallOf(5*24,96,12);IMG.ore=smallOf(1*24,0,11);
  }
  for(const k of PLIST){const c=rpgCell(k);if(c)ART.orb[k]=outline(c);}
  {const c=rpgCell('book');if(c)ART.book=outline(c);}
}
function drawSpr(def,frame,x,y,o){
  o=o||{}; const fw=def.fw, sc=o.scale||1, sx=frame*fw, dx=-fw/2, dy=-def.ay+(o.dy||0), bob=o.bob||0, sp=def.fh-14;
  const bl=(im,ox,oy)=>{ if(bob){ g.drawImage(im,sx,0,fw,sp,ox,oy+bob,fw,sp); g.drawImage(im,sx,sp,fw,def.fh-sp,ox,oy+sp,fw,def.fh-sp); } else g.drawImage(im,sx,0,fw,def.fh,ox,oy,fw,def.fh); };
  g.save(); g.translate(Math.round(x+(o.ox||0)),Math.round(y+(o.oy||0)));
  if(o.flip) g.scale(-1,1);
  const stx=sc*(o.stx||1), sty=sc*(o.sty||1);
  if(stx!==1||sty!==1) g.scale(stx,sty);
  if(o.alpha!==undefined) g.globalAlpha=o.alpha;
  if(o.outline){const im=def[o.outline];for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]) bl(im,dx+ox,dy+oy);}
  bl(def.img,dx,dy);
  if(o.flash>0){g.globalAlpha=(o.alpha===undefined?1:o.alpha)*Math.min(1,o.flash);bl(def.white,dx,dy);}
  if(o.tint>0){g.globalAlpha=o.tint;bl(def.ice,dx,dy);}
  g.restore();
}

/* ============ audio ============ */
let AC=null, muted=false, musicOn=true;
function ac(){ if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}} if(AC&&AC.state==='suspended')AC.resume(); return AC; }
function tone(f,d,type,vol,slide,delay){
  const a=ac(); if(!a||muted) return; const t=a.currentTime+(delay||0);
  const o=a.createOscillator(), gn=a.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,t);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
  gn.gain.setValueAtTime(vol||.06,t); gn.gain.exponentialRampToValueAtTime(.0008,t+d);
  o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t+d+.03);
}
let noiseBuf=null;
function noise(d,vol,delay){
  const a=ac(); if(!a||muted) return;
  if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*.5,a.sampleRate);const c=noiseBuf.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;}
  const t=a.currentTime+(delay||0), s=a.createBufferSource(), gn=a.createGain(), f=a.createBiquadFilter();
  s.buffer=noiseBuf; f.type='bandpass'; f.frequency.value=1800; gn.gain.setValueAtTime(vol||.08,t); gn.gain.exponentialRampToValueAtTime(.0008,t+d);
  s.connect(f); f.connect(gn); gn.connect(a.destination); s.start(t); s.stop(t+d+.03);
}
const SFX={
  swing:()=>{noise(.12,.07);tone(420,.1,'sawtooth',.03,-250);},
  hit:()=>{noise(.1,.1);tone(160,.1,'square',.06,-90);},
  kill:()=>{tone(220,.18,'square',.07,-150);noise(.2,.09);},
  hurt:()=>{tone(180,.25,'sawtooth',.09,-120);noise(.15,.08);},
  dash:()=>{noise(.15,.05);tone(300,.12,'triangle',.04,200);},
  coin:()=>{tone(988,.07,'square',.04);tone(1319,.12,'square',.04,0,.06);},
  gem:()=>{tone(880,.08,'triangle',.06);tone(1175,.08,'triangle',.06,0,.07);tone(1568,.16,'triangle',.06,0,.14);},
  pot:()=>{tone(520,.1,'sine',.08,300);tone(780,.2,'sine',.08,0,.08);},
  key:()=>{[660,880,1100,1320].forEach((f,i)=>tone(f,.14,'square',.05,0,i*.07));},
  chest:()=>{[392,494,587,784].forEach((f,i)=>tone(f,.16,'triangle',.07,0,i*.08));},
  shoot:()=>{tone(520,.16,'sawtooth',.035,-300);},
  boom:()=>{noise(.5,.14);tone(90,.4,'sawtooth',.1,-50);},
  portal:()=>{[262,330,392,523,659].forEach((f,i)=>tone(f,.25,'triangle',.06,0,i*.08));},
  win:()=>{[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,.22,'square',.05,0,i*.12));},
  lose:()=>{[330,262,208,165].forEach((f,i)=>tone(f,.4,'sawtooth',.06,0,i*.22));},
  ui:()=>{tone(660,.06,'square',.04);},
  // satu suara khas per senjata
  sw_sword:()=>{noise(.12,.07);tone(420,.1,'sawtooth',.03,-250);},
  sw_spear:()=>{noise(.06,.05);tone(880,.09,'triangle',.05,700);tone(1400,.05,'square',.02,0,.05);},
  sw_axe:()=>{noise(.3,.12);tone(120,.28,'sawtooth',.09,-70);tone(60,.22,'square',.06,0,.04);},
  bow:()=>{noise(.05,.04);tone(180,.07,'square',.05,300);tone(900,.18,'sine',.05,-700,.03);},
  fire:()=>{noise(.3,.07);tone(200,.28,'sawtooth',.05,420);tone(620,.2,'triangle',.035,-300,.08);},
  nova:()=>{noise(.5,.12);tone(140,.45,'sawtooth',.09,500);tone(70,.5,'square',.06,-30);},
  zap:()=>{noise(.2,.12);[1400,900,1800,600].forEach((f,i)=>tone(f,.07,'sawtooth',.05,-200,i*.04));},
  shield:()=>{[440,660,880].forEach((f,i)=>tone(f,.2,'sine',.07,0,i*.06));},
  freeze:()=>{[1568,1319,1175,988].forEach((f,i)=>tone(f,.18,'triangle',.05,0,i*.05));},
  crys:()=>{tone(1568,.07,'triangle',.05);tone(2093,.1,'sine',.04,0,.04);},
  crysBreak:()=>{noise(.25,.09);[1319,1568,1976,2637].forEach((f,i)=>tone(f,.14,'triangle',.05,0,i*.04));},
  pick:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,.1,'square',.04,0,i*.05));},
  splash:()=>{noise(.5,.04);[392,523,659,784,1047].forEach((f,i)=>tone(f,.22,'triangle',.06,0,.25+i*.12));tone(130,.9,'sine',.05,0,.2);}
};
const sfx=n=>{try{SFX[n]&&SFX[n]();}catch(e){}};
// ambient music: sparse minor plucks over a low drone
const SCALE=[110,130.8,146.8,164.8,196,220,261.6,293.7,329.6];
let musicTimer=null, mStep=0;
function music(){
  if(musicTimer) return;
  musicTimer=setInterval(()=>{
    if(muted||!musicOn||!AC||state!=='play') return;
    const base=[0,0,3,2,0,0,4,3][mStep%8]; mStep++;
    tone(SCALE[base]/2,.9,'triangle',.05);
    if(rnd()<.6) tone(SCALE[ri(2,8)],.5,'sine',.025,0,.25);
  },480);
}

/* ============ input ============ */
const keys={}; let mouse={x:0,y:0,active:false,t:0,down:false}; let touchMode=('ontouchstart' in window)||(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const stickV={x:0,y:0}; let tAtk=false, tDashQ=false;
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if(e.repeat) return;
  if(editing){ if(e.code==='Escape')closeLayout(); return; }
  keys[e.code]=true;
  if(e.code==='KeyP'||e.code==='Escape'){ if(state==='play') setPause(true); else if(state==='pause') setPause(false); }
  if(e.code==='KeyM') toggleMute();
  if(state==='play'&&!editing){ if(e.code==='KeyQ')swapWeapon(1); if(e.code==='KeyE'||e.code==='KeyL')usePower(); if(e.code==='KeyR')cyclePower(1);
    const dg=e.code.startsWith('Digit')?+e.code[5]:0; if(dg>=1&&dg<=WLIST.length)setWeapon(WLIST[dg-1]); }
  if((e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyK')) dashQ=0.15;
  if(e.code==='Space'||e.code==='KeyJ') atkQ=0.15;
  ac();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*VW;mouse.y=(e.clientY-r.top)/r.height*VH;mouse.active=true;mouse.t=performance.now();});
cv.addEventListener('mousedown',e=>{ if(e.button===0){mouse.down=true;atkQ=0.15;ac();} if(e.button===2){dashQ=0.15;} });
addEventListener('mouseup',()=>{mouse.down=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{if(state==='play'&&!editing)swapWeapon(e.deltaY>0?1:-1);},{passive:true});
let atkQ=0, dashQ=0;
// touch + layout editor
const LKEY='nacicrypt_layout';
const SAFE=(()=>{const d=document.createElement('div');d.id='sa';d.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';document.body.appendChild(d);return d;})();
function safe(){const c=getComputedStyle(SAFE);return {t:parseFloat(c.paddingTop)||0,r:parseFloat(c.paddingRight)||0,b:parseFloat(c.paddingBottom)||0,l:parseFloat(c.paddingLeft)||0};}
let layouts=null, curO='land', layout=null, uiOp=.9, editing=false, editFrom='title', selCtl='tAtk', hist=[], openSnap='';
let custom={land:false,port:false}, defSig={land:'',port:''}, snapOn=true, groupOn=false;
const orient=()=>innerWidth>=innerHeight?'land':'port';
// Area aman: terukur untuk orientasi sekarang, diperkirakan (estSafe) untuk orientasi lain sampai HP benar-benar diputar.
function safeFor(o){const cur=orient(),s=safe();return o===cur?s:estSafe(s,cur,o);}
function dimsFor(o){const W=innerWidth,H=innerHeight,a=Math.max(W,H),b=Math.min(W,H);return o==='land'?[a,b]:[b,a];}
function buildDef(o){const d=dimsFor(o);return defLayout(d[0],d[1],safeFor(o));}
function sigOf(o){const d=dimsFor(o),s=safeFor(o);return [o,d[0],d[1],s.t,s.r,s.b,s.l].map(v=>typeof v==='number'?Math.round(v):v).join(',');}
function defs(){return {land:buildDef('land'),port:buildDef('port')};}
const touchCustom=()=>{custom[curO]=true;};
function loadLayout(){layouts=defs();custom={land:false,port:false};
  try{const j=JSON.parse(localStorage.getItem(LKEY)||'null');
    if(j){for(const o of ['land','port']){const s=j.v>=2?j[o]:(o==='land'?{l:j.l}:null);
        if(s&&s.l){let any=false;for(const k in layouts[o]){const v=s.l[k];if(v&&isFinite(v.x)&&isFinite(v.y)){layouts[o][k]={x:clamp(+v.x,0,1),y:clamp(+v.y,0,1),s:clamp(+v.s||1,.6,1.8)};if(v.o!==undefined&&isFinite(v.o))layouts[o][k].o=clamp(+v.o,.3,1);any=true;}}custom[o]=any;}}
      if(j.op)uiOp=clamp(+j.op,.3,1); if(j.snap===false)snapOn=false;}}catch(e){}
  curO=orient(); layout=layouts[curO]; defSig.land=sigOf('land'); defSig.port=sigOf('port');}
// Hanya orientasi yang sudah diubah pemain yang disimpan; sisanya dihitung ulang dari area aman tiap kali layar/poni berubah.
function saveLayout(){try{localStorage.setItem(LKEY,JSON.stringify({v:3,op:uiOp,snap:snapOn,land:custom.land?{l:layouts.land}:null,port:custom.port?{l:layouts.port}:null}));}catch(e){}}
function applyLayout(){
  if(!layouts)loadLayout();
  if(!editing)for(const k of ['land','port'])if(!custom[k]){const sg=sigOf(k);if(sg!==defSig[k]){defSig[k]=sg;layouts[k]=buildDef(k);}}
  curO=orient(); layout=layouts[curO];
  const W=innerWidth,H=innerHeight,s=safe();
  for(const id in CTRL){const el=$(id),l=layout[id],r=ctlRect(id,l,W,H,s);
    el.style.width=r.hx*2+'px';el.style.height=r.hy*2+'px';el.style.left=r.cx+'px';el.style.top=r.cy+'px';
    el.style.fontSize=Math.round((id==='tPower'||id==='tSwap'?9:11)*l.s)+'px';
    el.style.setProperty('--op',l.o!==undefined?l.o:uiOp);}
  $('touch').style.setProperty('--op',uiOp);
  if(editing){const bad=findOverlaps(layout,W,H,s);for(const id in CTRL)$(id).classList.toggle('bad',bad.has(id));}
}
const snapNow=()=>JSON.stringify({layouts,uiOp,custom});
function pushHist(){hist.push(snapNow());if(hist.length>40)hist.shift();}
function restore(sn){const j=JSON.parse(sn);layouts=j.layouts;uiOp=j.uiOp;if(j.custom)custom=j.custom;layout=layouts[curO];applyLayout();selectCtl(selCtl);}
const opOf=id=>layout[id].o!==undefined?layout[id].o:uiOp;
function selectCtl(id){selCtl=id;for(const k in CTRL)$(k).classList.toggle('sel',k===id);
  const nBad=editing?Object.keys(CTRL).filter(k=>$(k).classList.contains('bad')).length:0;
  $('lInfo').textContent=CNAME[id]+' '+Math.round(layout[id].s*100)+'%';
  $('lOp').textContent='TRANSPARAN '+Math.round(opOf(id)*100)+'%';
  $('lSnap').classList.toggle('act',snapOn); $('lGroup').classList.toggle('act',groupOn);
  $('lWarn').textContent=nBad?('! '+nBad+' TOMBOL BERTUMPUK'):''; $('lFix').style.display=nBad?'':'none';
  $('lUndo').style.opacity=hist.length?1:.4;}
let barAuto=true; // true selama pemain belum menekan PINDAH BAR secara manual di sesi edit ini
function avoidLbarOverlap(){
  // Kalau posisi lbar (atas, tengah) menutupi tombol JEDA, pindahkan otomatis ke bawah supaya tidak tumpang tindih.
  if(!barAuto) return;
  const bar=$('lbar'), pz=$('tPause'); if(!bar||!pz) return;
  bar.classList.remove('bot');
  const br=bar.getBoundingClientRect(), pr=pz.getBoundingClientRect();
  const overlap=!(br.right<pr.left||br.left>pr.right||br.bottom<pr.top||br.top>pr.bottom);
  if(overlap) bar.classList.add('bot');
}
function openLayout(from){ if(!layouts)loadLayout(); editing=true; editFrom=from; hist=[]; openSnap=snapNow(); barAuto=true; showScreen(null); $('touch').classList.add('on','edit'); $('lbar').classList.add('on'); applyLayout(); selectCtl(selCtl); avoidLbarOverlap(); }
function endLayout(save){ if(!editing)return; if(!save)restore(openSnap); else saveLayout(); editing=false; groupOn=false; $('lbar').classList.remove('drag'); $('touch').classList.remove('edit'); $('lbar').classList.remove('on'); for(const k in CTRL)$(k).classList.remove('sel','bad'); showScreen(editFrom); }
function closeLayout(){endLayout(true);}
loadLayout(); applyLayout(); addEventListener('resize',()=>{applyLayout();if(editing)avoidLbarOverlap();}); addEventListener('orientationchange',()=>setTimeout(()=>{applyLayout();if(editing)avoidLbarOverlap();},150));
setInterval(()=>{if(!editing)applyLayout();},1000); // poni/area aman bisa berubah tanpa event resize
(function(){
  for(const id in CTRL){const el=$(id);let drag=null;
    el.addEventListener('pointerdown',e=>{if(!editing)return;e.preventDefault();e.stopImmediatePropagation();selectCtl(id);
      const r=el.getBoundingClientRect();drag={pid:e.pointerId,ox:e.clientX-(r.left+r.width/2),oy:e.clientY-(r.top+r.height/2),moved:false};try{el.setPointerCapture(e.pointerId);}catch(_){}},true);
    el.addEventListener('pointermove',e=>{if(!editing||!drag||e.pointerId!==drag.pid)return;
      const W=innerWidth,H=innerHeight,s=safe(),rr=ctlRect(id,layout[id],W,H,s);
      let px=snapPx(e.clientX-drag.ox,snapOn),py=snapPx(e.clientY-drag.oy,snapOn);
      px=clamp(px,s.l+rr.hx,Math.max(s.l+rr.hx,W-s.r-rr.hx));py=clamp(py,s.t+rr.hy,Math.max(s.t+rr.hy,H-s.b-rr.hy));
      if(Math.abs(px-rr.cx)<.5&&Math.abs(py-rr.cy)<.5)return;
      if(!drag.moved){pushHist();drag.moved=true;$('lbar').classList.add('drag');} touchCustom();
      if(groupOn){const lim=groupDeltaLimits(layout,W,H,s),dx=clamp(px-rr.cx,lim.x0,lim.x1),dy=clamp(py-rr.cy,lim.y0,lim.y1);for(const k in CTRL){layout[k].x+=dx/W;layout[k].y+=dy/H;}}
      else{layout[id].x=px/W;layout[id].y=py/H;}
      applyLayout();selectCtl(id);},true);
    const up=e=>{if(drag&&e.pointerId===drag.pid){drag=null;$('lbar').classList.remove('drag');selectCtl(id);}};el.addEventListener('pointerup',up,true);el.addEventListener('pointercancel',up,true);}
  const sz=d=>{pushHist();touchCustom();layout[selCtl].s=clamp(Math.round((layout[selCtl].s+d)*10)/10,.6,1.8);applyLayout();selectCtl(selCtl);sfx('ui');};
  $('lMinus').onclick=()=>sz(-.1); $('lPlus').onclick=()=>sz(.1);
  $('lOp').onclick=()=>{pushHist();touchCustom();const o=[1,.8,.6,.4],cur=opOf(selCtl);layout[selCtl].o=o[(o.findIndex(v=>Math.abs(v-cur)<.05)+1)%o.length];applyLayout();selectCtl(selCtl);sfx('ui');};
  $('lOpAll').onclick=()=>{pushHist();touchCustom();const cur=opOf(selCtl);for(const k in CTRL)layout[k].o=cur;uiOp=cur;applyLayout();selectCtl(selCtl);sfx('ui');};
  $('lSnap').onclick=()=>{snapOn=!snapOn;selectCtl(selCtl);sfx('ui');};
  $('lGroup').onclick=()=>{groupOn=!groupOn;selectCtl(selCtl);sfx('ui');};
  $('lFix').onclick=()=>{pushHist();touchCustom();separate(layout,innerWidth,innerHeight,safe());applyLayout();selectCtl(selCtl);sfx('ui');};
  $('lUndo').onclick=()=>{if(hist.length){restore(hist.pop());sfx('ui');}};
  $('lReset').onclick=()=>{pushHist();layouts[curO]=buildDef(curO);custom[curO]=false;defSig[curO]=sigOf(curO);uiOp=.9;applyLayout();selectCtl(selCtl);sfx('ui');};
  $('lCancel').onclick=()=>{sfx('ui');endLayout(false);};
  $('lDone').onclick=()=>{sfx('ui');endLayout(true);};
  $('lFlip').onclick=()=>{barAuto=false;$('lbar').classList.toggle('bot');sfx('ui');};
  $('bLayout').onclick=()=>{sfx('ui');openLayout('title');}; $('bLayout2').onclick=()=>{sfx('ui');openLayout('pause');};

  const stick=$('stick'), knob=$('knob'); let sid=null, cx=0, cy=0;
  function setK(dx,dy){const m=stick.offsetWidth*.33,l=hyp(dx,dy)||1,k=Math.min(l,m)/l;knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;stickV.x=dx*k/m;stickV.y=dy*k/m;}
  stick.addEventListener('pointerdown',e=>{if(editing)return;sid=e.pointerId;stick.setPointerCapture(sid);const r=stick.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;setK(e.clientX-cx,e.clientY-cy);ac();});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===sid)setK(e.clientX-cx,e.clientY-cy);});
  const end=e=>{if(e.pointerId===sid){sid=null;knob.style.transform='';stickV.x=stickV.y=0;}};
  stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
  $('tAtk').addEventListener('pointerdown',e=>{if(editing)return;tAtk=true;atkQ=0.15;ac();e.preventDefault();});
  $('tAtk').addEventListener('pointerup',()=>{tAtk=false;});$('tAtk').addEventListener('pointercancel',()=>{tAtk=false;});
  $('tDash').addEventListener('pointerdown',e=>{if(editing)return;dashQ=0.15;ac();e.preventDefault();});
  $('tSwap').addEventListener('pointerdown',e=>{if(editing)return;swapWeapon(1);ac();e.preventDefault();});
  let ptm=null,pheld=false;
  $('tPower').addEventListener('pointerdown',e=>{if(editing)return;e.preventDefault();ac();pheld=false;clearTimeout(ptm);ptm=setTimeout(()=>{pheld=true;cyclePower(1);},380);});
  const pup=()=>{const was=ptm;clearTimeout(ptm);ptm=null;if(!editing&&was&&!pheld)usePower();pheld=false;};
  $('tPower').addEventListener('pointerup',pup);$('tPower').addEventListener('pointercancel',()=>{clearTimeout(ptm);ptm=null;});
  $('tPowerN').addEventListener('pointerdown',e=>{if(editing)return;e.preventDefault();e.stopPropagation();ac();cyclePower(1);});
  $('tPause').addEventListener('pointerdown',()=>{if(!editing&&state==='play')setPause(true);});
  addEventListener('touchstart',()=>{touchMode=true;$('touch').classList.toggle('on',state==='play'||editing);},{passive:true,once:true});
})();

/* ============ game state ============ */
let state='splash'; // splash,title,play,pause,over,win
let floor=1, L=null, P=null, ents=[], corpses=[], pickups=[], chests=[], crystals=[], projs=[], parts=[], nums=[], waves=[], fx=[], pproj=[], trail=[], dust=[];
let shake=0, hitstop=0, time=0, msg={t:0,s:''}, bossRef=null, winT=0, overT=0, bestScore=0, kills=0, score=0, runTime=0;
try{bestScore=parseInt(localStorage.getItem('nacicrypt_best')||'0')||0;}catch(e){}

const EDEF={
  skWarrior:{hp:4,spd:36,dmg:10,ai:'melee',score:20,coins:[0,2]},
  skRogue:{hp:3,spd:58,dmg:10,ai:'dasher',score:25,coins:[0,2]},
  skMage:{hp:3,spd:28,dmg:10,ai:'ranged',score:30,shots:1,cd:2.2,coins:[1,2]},
  orc:{hp:9,spd:30,dmg:20,ai:'melee',score:45,coins:[1,3]},
  orcRogue:{hp:6,spd:52,dmg:15,ai:'dasher',score:50,coins:[1,3]},
  orcShaman:{hp:6,spd:26,dmg:10,ai:'ranged',score:65,shots:3,cd:2.7,coins:[1,3]},
  orcWarrior:{hp:70,spd:34,dmg:25,ai:'boss',score:1000,scale:2,coins:[10,14]}
};
const POOL={
  1:['skWarrior','skWarrior','skWarrior','skRogue','skRogue','skMage'],
  2:['skWarrior','skRogue','skMage','orc','orc','orcRogue','orcShaman'],
  3:['orc','orc','orcRogue','orcShaman','orcShaman','skMage','skRogue']
};

/* ============ level generation ============ */
function genLevel(fl){
  const grid=new Uint8Array(MW*MH), rooms=[];
  const target=fl===3?7:6+fl; let tries=0;
  while(rooms.length<target&&tries<600){tries++;
    const w=ri(7,12),h=ri(6,9),x=ri(2,MW-w-3),y=ri(2,MH-h-3);
    if(rooms.some(r=>x<r.x+r.w+3&&x+w+3>r.x&&y<r.y+r.h+3&&y+h+3>r.y)) continue;
    rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});
  }
  for(const r of rooms) for(let yy=r.y;yy<r.y+r.h;yy++)for(let xx=r.x;xx<r.x+r.w;xx++)grid[yy*MW+xx]=1;
  const set=(x,y)=>{if(x>0&&y>0&&x<MW-1&&y<MH-1)grid[y*MW+x]=1;};
  function corridor(a,b){
    let x=a.cx,y=a.cy; const hFirst=rnd()<.5;
    const hor=()=>{while(x!==b.cx){set(x,y);set(x,y+1);x+=Math.sign(b.cx-x);}};
    const ver=()=>{while(y!==b.cy){set(x,y);set(x+1,y);y+=Math.sign(b.cy-y);}};
    if(hFirst){hor();ver();}else{ver();hor();}
    set(x,y);set(x+1,y);set(x,y+1);set(x+1,y+1);
  }
  for(let i=1;i<rooms.length;i++){
    let bj=0,bd=1e9; for(let j=0;j<i;j++){const d=hyp(rooms[i].cx-rooms[j].cx,rooms[i].cy-rooms[j].cy);if(d<bd){bd=d;bj=j;}}
    corridor(rooms[i],rooms[bj]);
  }
  for(let k=0;k<2;k++){const a=pick(rooms),b=pick(rooms);if(a!==b)corridor(a,b);}
  const Lv={grid,rooms,fl};
  return Lv;
}
const isFloor=(Lv,x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&Lv.grid[y*MW+x]===1;
function solidAt(px,py){const x=Math.floor(px/TILE),y=Math.floor(py/TILE);return !(x>=0&&y>=0&&x<MW&&y<MH&&L.grid[y*MW+x]===1);}
function bfs(Lv,sx,sy){
  const d=new Int16Array(MW*MH).fill(-1), q=[sx+sy*MW]; d[q[0]]=0;
  for(let i=0;i<q.length;i++){const c=q[i],cx=c%MW,cy=(c/MW)|0;
    for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+ox,ny=cy+oy;
      if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const n=nx+ny*MW;
      if(Lv.grid[n]===1&&d[n]<0){d[n]=d[c]+1;q.push(n);}}}
  return d;
}
/* Tema lantai: 1 = kripta gelap (DarkDungeon), 2 = aula batu abu (Mini Dungeon), 3 = kripta bernuansa merah (sarang Raja Orc). 'old' = cadangan kalau aset tambahan gagal dimuat. */
function crackAt(x,px,py,hh,a){ if(hh%5)return; x.fillStyle='rgba(0,0,0,'+a+')'; let cx=px+2+(hh>>>3)%11, cy=py+2+(hh>>>7)%11; for(let i=0;i<5+(hh>>>11)%5;i++){ x.fillRect(cx,cy,1,1); cx+=((hh>>>(3+i))&1)?1:-1; cy+=1; } }
const THEMES={
  dark:{torch:[0,3,3,0,2],
    floor:(x,xx,y,hh,px,py)=>x.drawImage(IMG.dd,16+16*(xx%4),112+16*(y%5),16,16,px,py,16,16),
    face:(x,xx,y,hh,px,py)=>x.drawImage(IMG.dd,40+16*(xx%4),24,16,16,px,py,16,16),
    roof:(x,xx,y,hh,px,py)=>{x.drawImage(IMG.dd,40+16*(xx%4),26,16,16,px,py,16,16);x.fillStyle='rgba(6,4,10,.84)';x.fillRect(px,py,16,16);}},
  mini:{torch:[1,6,1,6,5],
    floor:(x,xx,y,hh,px,py)=>{x.drawImage(IMG.mini,16,24,16,16,px,py,16,16);
      for(let i=0;i<3;i++){const q=(hh>>>(i*5))&255;x.fillStyle=(q&1)?'rgba(0,0,0,.16)':'rgba(255,255,255,.035)';x.fillRect(px+(q>>>1)%15,py+(q>>>3)%15,1,1);} crackAt(x,px,py,hh,.2);},
    face:(x,xx,y,hh,px,py)=>x.drawImage(IMG.mini,8+16*(xx%2),0,16,16,px,py,16,16),
    roof:(x,xx,y,hh,px,py)=>{x.fillStyle='#141820';x.fillRect(px,py,16,16);x.fillStyle='rgba(255,255,255,.025)';x.fillRect(px+(hh%12),py+((hh>>>4)%12),2,1);}},
  old:{torch:[0],
    floor:(x,xx,y,hh,px,py)=>{const FL=[[64,0],[80,0],[64,16],[80,16],[64,32],[80,32],[96,0],[96,32]],f=FL[hh%3<2?hh%6:(hh>>>3)%FL.length];x.drawImage(IMG.dungeonTiles,f[0],f[1],16,16,px,py,16,16);},
    face:(x,xx,y,hh,px,py)=>{const BR=[[0,16],[16,16],[32,16],[0,32],[16,32],[32,32]],b=BR[hh%BR.length];x.drawImage(IMG.dungeonTiles,b[0],b[1],16,16,px,py,16,16);},
    roof:(x,xx,y,hh,px,py)=>{x.drawImage(IMG.wallTiles,112,16,16,16,px,py,16,16);x.fillStyle='rgba(8,10,22,.72)';x.fillRect(px,py,16,16);}}
};
THEMES.crypt=Object.assign({},THEMES.dark,{torch:[0,4,5,0],tint:'rgba(80,0,30,.07)'});
function themeFor(fl){return !IMG.dd?THEMES.old:fl===2&&IMG.mini?THEMES.mini:fl===3?THEMES.crypt:THEMES.dark;}
function prerender(Lv){
  const c=document.createElement('canvas'); c.width=MW*TILE; c.height=MH*TILE; const x=c.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#06080d'; x.fillRect(0,0,c.width,c.height);
  Lv.banners=[];
  const T=themeFor(Lv.fl);
  const h2=(a,b)=>{let h=(a*374761393+b*668265263)>>>0;h=((h^(h>>>13))*1274126177)>>>0;return h;};
  for(let y=0;y<MH;y++)for(let xx=0;xx<MW;xx++){
    const px=xx*TILE,py=y*TILE,hh=h2(xx,y);
    if(Lv.grid[y*MW+xx]===1){
      T.floor(x,xx,y,hh,px,py);
      x.fillStyle='rgba(0,0,0,'+((hh>>>9)%7)*.012+')';x.fillRect(px,py,16,16);
      if(T.tint){x.fillStyle=T.tint;x.fillRect(px,py,16,16);}
    }else{
      const near=[-1,0,1].some(oy=>[-1,0,1].some(ox=>isFloor(Lv,xx+ox,y+oy)));
      if(!near) continue;
      if(isFloor(Lv,xx,y+1)){T.face(x,xx,y,hh,px,py);
        x.fillStyle='rgba(0,0,0,.18)';x.fillRect(px,py,16,16);
        if(T.tint){x.fillStyle=T.tint;x.fillRect(px,py,16,16);}
        if(hh%6===0&&!isFloor(Lv,xx,y-1)&&!Lv.banners.some(b=>b.py===py&&Math.abs(b.x-(px+8))<44)){Lv.banners.push({x:px+8,y:py,py,c:T.torch[(hh>>>4)%T.torch.length]});}
      }else{
        T.roof(x,xx,y,hh,px,py);
      }
    }
  }
  // soft shadows on floor edges
  for(let y=0;y<MH;y++)for(let xx=0;xx<MW;xx++){ if(Lv.grid[y*MW+xx]!==1)continue; const px=xx*TILE,py=y*TILE;
    if(!isFloor(Lv,xx,y-1)){x.fillStyle='rgba(0,0,0,.38)';x.fillRect(px,py,16,5);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(px,py+5,16,3);}
    if(!isFloor(Lv,xx-1,y)){x.fillStyle='rgba(0,0,0,.22)';x.fillRect(px,py,3,16);}
    if(!isFloor(Lv,xx+1,y)){x.fillStyle='rgba(0,0,0,.22)';x.fillRect(px+13,py,3,16);}
  }
  return c;
}

/* ============ weapons & powers ============ */
const WDEF={
  sword:{name:'PEDANG',dm:1,cd:.34,reach:27,arc:1.25,type:'melee',kb:170,col:'#eaf6ff'},
  spear:{name:'TOMBAK',dm:1.2,cd:.42,reach:46,arc:.5,type:'melee',kb:150,thrust:true,col:'#d8e8ff'},
  axe:{name:'KAPAK',dm:2,cd:.68,reach:31,arc:2.7,type:'melee',kb:290,col:'#ffd7a8'},
  bow:{name:'BUSUR',dm:1.15,cd:.46,type:'bow',speed:240,kb:90},
  staff:{name:'TONGKAT',dm:1.7,cd:.74,type:'staff',speed:135,kb:140,rad:27}
};
const WLIST=['sword','spear','axe','bow','staff'];
const PDEF={
  nova:{name:'NOVA',col:'#ff9a4a',rgb:'255,140,40',tip:'Ledakan di sekelilingmu'},
  petir:{name:'PETIR',col:'#ffe14a',rgb:'255,225,74',tip:'Menyambar 5 musuh terdekat'},
  perisai:{name:'PERISAI',col:'#5ab4ff',rgb:'90,180,255',tip:'Menahan 4 serangan'},
  beku:{name:'BEKU',col:'#9ff0ff',rgb:'159,240,255',tip:'Membekukan semua musuh'}
};
const PLIST=['nova','petir','perisai','beku'];
const WSPR={}, WGRIP={sword:[3,12],spear:[4,11],axe:[4,11],bow:[4,7],staff:[3,12]};
(function mkBowArt(){ // busur: tidak ada di pack RPG Items, jadi tetap digambar sendiri
  const c=document.createElement('canvas');c.width=14;c.height=13;const x=c.getContext('2d');
  const R=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
  for(let y=0;y<13;y++){const bx=Math.round(3.2*Math.sin(Math.PI*y/12))+1;R('#b07a3a',bx,y,2,1);if(y>0&&y<12)R('#ddd',1,y,1,1);}R('#cfcfcf',2,6,10,1);R('#fff',12,6,2,1);
  const o=document.createElement('canvas');o.width=16;o.height=15;const ox=o.getContext('2d'),sl=silhouette(c,'#0b0f17');
  for(let dx=0;dx<3;dx++)for(let dy=0;dy<3;dy++)if(dx!==1||dy!==1)ox.drawImage(sl,dx,dy);ox.drawImage(c,1,1);WSPR.bow=o;
})();
// Senjata lain memakai sprite RPG Items 16x16; tiap senjata punya 5 skin, makin tinggi levelnya makin bagus.
// Sprite digambar diagonal (gagang kiri-bawah, ujung kanan-atas), jadi saat dipegang diputar tambahan 45 derajat.
const rawW=(w,lv)=>rpgCell(w+clamp(lv||1,1,5));
function fallbackW(){const c=mkCv(16,16),x=c.getContext('2d');x.fillStyle='#cfd8e3';for(let i=2;i<14;i++)x.fillRect(i,15-i,2,2);return c;}
function heldArt(w,lv){
  if(w==='bow')return {img:WSPR.bow,gx:WGRIP.bow[0],gy:WGRIP.bow[1],rot:0};
  lv=clamp(lv||1,1,5);const key=w+lv;let h=ART.held[key];
  if(!h){const gr=WGRIP[w];h=ART.held[key]={img:outline(rawW(w,lv)||fallbackW()),gx:gr[0]+1,gy:gr[1]+1,rot:Math.PI/4};}
  return h;
}
function slotArt(w,lv){ // ikon 24x24 untuk HUD dan senjata di lantai
  lv=clamp(lv||1,1,5);const key=w+lv;if(ART.slot[key])return ART.slot[key];
  const c=mkCv(24,24),x=c.getContext('2d');x.imageSmoothingEnabled=false;
  if(w==='bow'){const s=WSPR.bow;x.translate(12,12);x.rotate(-Math.PI/4);x.drawImage(s,-s.width/2,-s.height/2);}
  else x.drawImage(outline(rawW(w,lv)||fallbackW()),3,3);
  return ART.slot[key]=c;
}
function swapWeapon(d){const p=P;if(!p||p.dead||state!=='play'||editing)return;const own=WLIST.filter(w=>p.own[w]);if(own.length<2)return;
  const i=(own.indexOf(p.wpn)+(d||1)+own.length)%own.length;p.wpn=own[i];p.atkT=0;say(WDEF[p.wpn].name,1.2);sfx('ui');}
function setWeapon(w){if(P&&P.own[w]&&!P.dead&&P.wpn!==w){P.wpn=w;P.atkT=0;say(WDEF[w].name,1.2);sfx('ui');}}
function cyclePower(d,quiet){const p=P;if(!p||p.dead)return;const have=PLIST.filter(k=>p.pw[k]>0);if(!have.length)return;
  let i=have.indexOf(p.psel);i=i<0?0:(i+(d||1)+have.length)%have.length;p.psel=have[i];if(!quiet){say(PDEF[p.psel].name+' x'+p.pw[p.psel],1.2);sfx('ui');}}
function usePower(){
  const p=P;if(!p||p.dead||state!=='play'||editing||p.pcd>0)return;
  if(!(p.pw[p.psel]>0)){cyclePower(1,true);if(!(p.pw[p.psel]>0)){say('Belum punya power. Cari bola cahaya!',2);return;}}
  const t=p.psel,cx=p.x,cy=p.y-8,dm=p.dmg*(p.buffDmg>0?1.5:1);
  if(t==='nova'){
    fx.push({k:'ring',x:cx,y:cy,r:4,max:84,sp:260,rgb:'255,140,40'});
    for(const e of ents.slice()){const d=hyp(e.x-cx,e.y-cy);if(d<84+(e.scale>1?12:0))damageEnemy(e,dm*3.4,Math.atan2(e.y-cy,e.x-cx),300);}
    for(let i=projs.length-1;i>=0;i--)if(hyp(projs[i].x-cx,projs[i].y-cy)<84)projs.splice(i,1);
    for(const c of crystals.slice())if(hyp(c.x-cx,c.y-cy)<84)hitCrystal(c,Math.atan2(c.y-cy,c.x-cx),9);
    addPart(cx,cy,28,'#ff9a4a',130,.7,2);shake=Math.max(shake,8);sfx('nova');
  }else if(t==='petir'){
    const tg=ents.filter(e=>hyp(e.x-cx,e.y-cy)<160).sort((a,b)=>hyp(a.x-cx,a.y-cy)-hyp(b.x-cx,b.y-cy)).slice(0,5);
    if(!tg.length){say('Tidak ada musuh dekat.',1.5);return;}
    for(const e of tg){const x2=e.x,y2=e.y-8*e.scale;let x1=x2+rf(-14,14),y1=y2-110,pts=[[x1,y1]];
      for(let i=1;i<6;i++)pts.push([x1+(x2-x1)*i/6+rf(-7,7),y1+(y2-y1)*i/6]);pts.push([x2,y2]);
      fx.push({k:'bolt',pts,t:0,life:.35});addPart(x2,y2,8,'#ffe14a',80,.4,2);
      damageEnemy(e,dm*4.6,Math.atan2(e.y-cy,e.x-cx),90);if(e.hp>0)e.stun=Math.max(e.stun,.5);}
    shake=Math.max(shake,5);sfx('zap');
  }else if(t==='perisai'){
    p.shield=9;p.shieldHits=4;fx.push({k:'ring',x:cx,y:cy,r:4,max:26,sp:120,rgb:'90,180,255'});sfx('shield');say('Perisai aktif!',1.6);
  }else if(t==='beku'){
    fx.push({k:'ring',x:cx,y:cy,r:4,max:150,sp:300,rgb:'159,240,255'});
    for(const e of ents){e.freeze=e.boss?3:4.5;e.wind=0;if(e.mode==='ctele'||e.mode==='stele'){e.mode='rest';e.mt=1;}addPart(e.x,e.y-10,6,'#bff6ff',50,.5,2);}
    sfx('freeze');say('Musuh membeku!',1.6);
  }
  p.pw[t]--;p.pcd=.7;if(!(p.pw[t]>0))cyclePower(1,true);
}
function hitCrystal(c,ang,dmg){
  c.hp-=dmg||1; c.flash=.14; c.shake=1; const d=CRYS_DEF[c.v];
  addPart(c.x,c.y-10,5,'rgb('+d.rgb+')',60,.4,2); sfx('crys');
  if(c.hp<=0)breakCrystal(c);
}
function breakCrystal(c){
  const i=crystals.indexOf(c); if(i<0)return; crystals.splice(i,1); const d=CRYS_DEF[c.v];
  addPart(c.x,c.y-10,22,'rgb('+d.rgb+')',110,.7,2); addPart(c.x,c.y-10,10,'#fff',80,.5,1);
  fx.push({k:'ring',x:c.x,y:c.y-8,r:3,max:26,sp:140,rgb:d.rgb});
  sfx('crysBreak'); shake=Math.max(shake,3); score+=25; addNum(c.x,c.y-30,'+25','#bff');
  for(let n=ri(2,3);n>0;n--)pickups.push(mkPick(d.gem,c.x,c.y-6));
  if(rnd()<.55)pickups.push(mkPick('ore',c.x,c.y-6));
  if(rnd()<.45)pickups.push(mkPick('coin',c.x,c.y-6));
  if(rnd()<.12)pickups.push(mkPick(pick(['potRed','potRed','potBlue','potYellow']),c.x,c.y-6));
  if(rnd()<.05){const k=mkPick('orb',c.x,c.y-6,0,0,pick(PLIST));k.life=1e9;pickups.push(k);}
}
function boomFire(q){
  for(const c of crystals.slice())if(hyp(c.x-q.x,(c.y-8)-q.y)<q.rad+6)hitCrystal(c,0,1);
  fx.push({k:'ring',x:q.x,y:q.y,r:3,max:q.rad,sp:150,rgb:'255,140,40'});addPart(q.x,q.y,16,'#ff9a4a',90,.5,2);addPart(q.x,q.y,8,'#ffe08a',60,.4,2);sfx('hit');shake=Math.max(shake,2);
  for(const e of ents.slice()){if(hyp(e.x-q.x,(e.y-6*e.scale)-q.y)<q.rad+4*e.scale)damageEnemy(e,q.dmg,Math.atan2(e.y-q.y,e.x-q.x),WDEF.staff.kb);}
}

/* ============ entities ============ */
function newPlayer(){
  return {x:0,y:0,vx:0,vy:0,hp:100,maxHp:100,spd:68,dmg:2,face:1,fx:0,fy:1,moving:false,anim:0,
    inv:0,flash:0,atkT:0,atkCD:0,atkAng:0,atkHit:false,dashT:0,dashCD:0,dashX:0,dashY:0,
    buffSpd:0,buffDmg:0,key:false,coins:0,dead:false,deadT:0,kx:0,ky:0,ghost:0,squash:0,stepT:0,
    wpn:'sword',own:{sword:1},wlv:{sword:1},pw:{nova:0,petir:0,perisai:0,beku:0},seenPw:{},psel:'nova',pcd:0,shield:0,shieldHits:0};
}
function mkEnemy(type,x,y,o){
  o=o||{}; const d=EDEF[type];
  let hp=d.hp*(1+(L.fl-1)*.12); if(o.elite)hp*=2.6;
  return {type,d,x,y,hp,maxHp:hp,t:rf(0,5),cd:rf(.4,1.4),wind:0,alert:false,flash:0,kx:0,ky:0,stun:0,face:1,moving:false,
    elite:!!o.elite,shots:(d.shots||0)+(o.elite?2:0),scale:d.scale||1,mode:'chase',mt:rf(2.5,4),lunge:0,lungeCD:rf(1,3),dx:0,dy:0,enraged:false,summoned:false,boss:d.ai==='boss',
    squash:0,stepT:rf(0,.3),intro:d.ai==='boss'?-1:0};
}
function blockedAt(x,y,hw){hw=hw||5;return solidAt(x-hw,y-6)||solidAt(x+hw,y-6)||solidAt(x-hw,y)||solidAt(x+hw,y);}
function moveEnt(e,dx,dy,hw){
  hw=hw||(e.scale>1?9:5);
  if(dx&&!blockedAt(e.x+dx,e.y,hw)) e.x+=dx; else if(dx){const s=Math.sign(dx);for(let i=0;i<4;i++){if(!blockedAt(e.x+s*.5,e.y,hw))e.x+=s*.5;else break;}}
  if(dy&&!blockedAt(e.x,e.y+dy,hw)) e.y+=dy; else if(dy){const s=Math.sign(dy);for(let i=0;i<4;i++){if(!blockedAt(e.x,e.y+s*.5,hw))e.y+=s*.5;else break;}}
}
function los(ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,l=hyp(dx,dy); if(l<1)return true; const nx=-dy/l*5,ny=dx/l*5;
  for(const k of [0,1,-1]){ const sx=ax+nx*k,sy=ay+ny*k,ex=bx+nx*k,ey=by+ny*k,n=Math.ceil(l/4);
    for(let i=1;i<n;i++){ if(solidAt(sx+(ex-sx)*i/n,sy+(ey-sy)*i/n))return false; } }
  return true;
}
let flow=null, flowT=0;
function updateFlow(){const cx=clamp(P.x/TILE|0,0,MW-1),cy=clamp((P.y-2)/TILE|0,0,MH-1);flow=bfs(L,cx,cy);}
function flowDir(e){
  const cx=e.x/TILE|0, cy=(e.y-2)/TILE|0; if(!flow)return null; const cd=flow[cx+cy*MW]; if(cd<0)return null;
  let best=null,bd=cd;
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){ if(!ox&&!oy)continue; const nx=cx+ox,ny=cy+oy; if(nx<0||ny<0||nx>=MW||ny>=MH)continue;
    const d=flow[nx+ny*MW]; if(d<0)continue;
    if(ox&&oy&&(L.grid[(cy)*MW+nx]!==1||L.grid[ny*MW+cx]!==1))continue;
    const sc=d+(ox&&oy?.4:0); if(sc<bd){bd=sc;best=[ox,oy];}}
  if(!best) return null; const tx=(cx+best[0])*TILE+8, ty=(cy+best[1])*TILE+8, dx=tx-e.x, dy=ty-(e.y-2), l=hyp(dx,dy)||1; return [dx/l,dy/l];
}
function toward(e,spd,dt,away){
  const dx=P.x-e.x, dy=P.y-e.y, l=hyp(dx,dy)||1; let v;
  if(away){ v=[-dx/l,-dy/l]; }
  else if(l<26||los(e.x,e.y-5,P.x,P.y-5)) v=[dx/l,dy/l]; else v=flowDir(e)||[dx/l,dy/l];
  moveEnt(e,v[0]*spd*dt,v[1]*spd*dt); const fxv=away?-v[0]:v[0]; if(Math.abs(fxv)>.15)e.face=fxv>0?1:-1; e.moving=true;
}

/* ---- floor setup ---- */
function newFloor(){
  L=genLevel(floor); const rooms=L.rooms; const sr=rooms[0];
  const d0=bfs(L,sr.cx,sr.cy);
  let exit=null;
  if(floor===3){ exit=rooms.slice(1).sort((a,b)=>b.w*b.h-a.w*a.h)[0]; }
  else { let bd=-1; for(const r of rooms.slice(1)){const dd=d0[r.cx+r.cy*MW];if(dd>bd){bd=dd;exit=r;}} }
  L.start=sr; L.exit=exit; L.map=prerender(L);
  L.explored=new Uint8Array(MW*MH); L.mini=document.createElement('canvas'); L.mini.width=MW; L.mini.height=MH; L.miniCtx=L.mini.getContext('2d'); L.miniDirty=true; L.miniT=0;
  ents=[];corpses=[];pickups=[];chests=[];crystals=[];projs=[];parts=[];nums=[];waves=[];fx=[];pproj=[];trail=[];bossRef=null;
  dust=[]; for(let i=0;i<64;i++){const r=pick(rooms); dust.push({x:(r.x+rf(1,Math.max(1,r.w-1)))*TILE,y:(r.y+rf(1,Math.max(1,r.h-1)))*TILE,ph:rf(0,6.28),spd:rf(2,6),amp:rf(3,8)});}
  P.x=sr.cx*TILE+8; P.y=sr.cy*TILE+14; P.vx=P.vy=0; P.dashT=0; P.atkT=0; P.key=false; P.inv=1.2;
  L.portal={x:exit.cx*TILE+8,y:exit.cy*TILE+8,open:false};
  const spots=(r,m)=>{const a=[];for(let y=r.y+m;y<r.y+r.h-m;y++)for(let x=r.x+m;x<r.x+r.w-m;x++)a.push([x*TILE+8,y*TILE+12]);return a;};
  const others=rooms.filter(r=>r!==sr&&r!==exit);
  const eliteRoom=floor<3?pick(others):null;
  for(const r of rooms){
    if(r===sr) continue;
    if(r===exit&&floor<3) continue; // portal room stays calm
    const sp=spots(r,1); if(!sp.length)continue;
    let n=floor===3?ri(1,2)+(r.w*r.h>70?1:0):ri(2,3)+(floor>1?1:0)+(r.w*r.h>70?1:0);
    if(r===exit&&floor===3)n=3;
    for(let i=0;i<n;i++){ const s=sp.splice(ri(0,sp.length-1),1)[0]; if(!s)break;
      ents.push(mkEnemy(pick(POOL[floor]),s[0]+rf(-3,3),s[1])); }
    if(r===eliteRoom&&sp.length){ const s=sp.splice(ri(0,sp.length-1),1)[0]; const e=mkEnemy(floor===1?'orc':'orcShaman',s[0],s[1],{elite:true}); ents.push(e); L.elite=e; }
  }
  if(floor===3){ const e=mkEnemy('orcWarrior',exit.cx*TILE+8,exit.cy*TILE+14); e.alert=false; ents.push(e); bossRef=e; }
  // potion crates
  const crateRooms=others.filter(r=>r!==eliteRoom).sort(()=>rnd()-.5).slice(0,floor===3?2:2);
  for(const r of crateRooms){const sp=spots(r,1);if(sp.length){const s=pick(sp);chests.push({x:s[0],y:s[1],open:false,t:rf(0,6)});}}
  // some pre-placed treasure
  for(const r of others){ if(rnd()<.6){const sp=spots(r,1);if(sp.length){const s=pick(sp);pickups.push(mkPick(rnd()<.2?'gemA':'coin',s[0],s[1]));}} }
  {
    const pool=others.length?others:rooms.slice(1);
    const place=(type,sub)=>{const r=pick(pool),sp=spots(r,1);if(!sp.length)return;const s=pick(sp),k=mkPick(type,s[0],s[1],0,0,sub);k.life=1e9;pickups.push(k);};
    for(const w of ({1:['spear'],2:['bow','axe'],3:['staff']})[floor])if(!P.own[w])place('wpn',w);
    for(let i=0;i<(floor===3?2:1);i++)place('orb',pick(PLIST));
    if(floor>1)place('book');
  }
  // kristal yang bisa dipecahkan (tidak menghalangi jalan); warnanya mengikuti lantai
  {const pal=({1:[1,2,3,4,8],2:[0,4,7,1,8],3:[5,0,6,5,0]})[floor]||[1,2,8];
   for(const r of rooms){ if(r===sr||(r===exit&&floor<3))continue; const sp=spots(r,1); const n=Math.min(sp.length,ri(1,2)+(r.w*r.h>70?1:0));
     for(let i=0;i<n;i++){const s=sp.splice(ri(0,sp.length-1),1)[0]; if(!s)break; if(chests.some(c=>hyp(c.x-s[0],c.y-s[1])<20))continue;
       crystals.push({x:s[0],y:s[1],hp:3,maxHp:3,t:rf(0,6),flash:0,shake:0,v:pick(pal)});}}}
  updateFlow(); flowT=0;
  say(floor===3?'Lantai 3: Sarang Raja Orc. Temukan dan kalahkan dia!':floor===1?'Lantai 1: Cari penjaga berbingkai emas — dia membawa kunci.':'Lantai 2: Kerangka makin ganas. Cari penjaga bersinar emas.',4.5);
}
let tipMem=false;
function powerTipSeen(set){if(set){tipMem=true;try{localStorage.setItem('nacicrypt_tip_power','1');}catch(e){}return true;}if(tipMem)return true;try{return localStorage.getItem('nacicrypt_tip_power')==='1';}catch(e){return false;}}
function say(s,t){msg.s=s;msg.t=t||3;}
function mkPick(type,x,y,vx,vy,sub){return {type,sub,x,y,z:0,vz:rf(40,70),vx:vx||rf(-25,25),vy:vy||rf(-25,25),t:rf(0,6),life:40,age:0};}

/* ============ combat ============ */
function addPart(x,y,n,col,sp,life,size,grav){
  for(let i=0;i<n;i++){const a=rnd()*6.283,s=rf(.3,1)*sp;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-sp*.2,l:life*rf(.6,1),m:life,c:col,s:size||1,gr:grav||0});}
}
function addNum(x,y,txt,col){nums.push({x,y,t:0,txt,c:col||'#fff'});}
function hurtPlayer(dmg,fx,fy){
  if(P.dead||P.inv>0||P.dashT>0) return false;
  if(P.shield>0){P.shieldHits--;P.inv=.45;P.flash=0;if(P.shieldHits<=0)P.shield=0;addPart(P.x,P.y-10,10,'#9fd2ff',80,.4,2);fx.push({k:'ring',x:P.x,y:P.y-8,r:8,max:22,sp:120,rgb:'90,180,255'});sfx('hit');return true;}
  P.hp-=dmg; P.inv=1.0; P.flash=.18; P.squash=1; shake=Math.max(shake,5); hitstop=.05;
  const a=Math.atan2(P.y-fy,P.x-fx); P.kx=Math.cos(a)*120; P.ky=Math.sin(a)*120;
  addPart(P.x,P.y-10,8,'#ff4d4d',70,.5,2); addNum(P.x,P.y-24,'-'+Math.round(dmg),'#ff6a6a'); sfx('hurt');
  if(P.hp<=0){P.hp=0;P.dead=true;P.deadT=0;sfx('lose');
    corpses.push({def:SPR.knight.death,x:P.x,y:P.y,t:0,flip:P.face<0,scale:1,fade:false,player:true}); overT=0; }
  return true;
}
function damageEnemy(e,dmg,ang,kb){
  e.hp-=dmg; e.flash=.14; e.squash=1; e.stun=Math.max(e.stun,e.boss?0:.18); e.alert=true;
  const k=kb*(e.boss?.18:e.elite?.6:1); e.kx+=Math.cos(ang)*k; e.ky+=Math.sin(ang)*k;
  addPart(e.x,e.y-10*e.scale,6,e.type.startsWith('sk')?'#e8e2c8':'#8fd14f',60,.4,2);
  addNum(e.x+rf(-4,4),e.y-24*e.scale,String(Math.round(dmg*10)/10),'#ffe07a'); sfx('hit'); hitstop=Math.max(hitstop,.04); shake=Math.max(shake,2);
  if(e.hp<=0) killEnemy(e);
}
function killEnemy(e){
  ents.splice(ents.indexOf(e),1);
  const sp=SPR[e.type]; corpses.push({def:sp.death,x:e.x,y:e.y,t:0,flip:e.face<0,scale:e.scale,fade:true});
  addPart(e.x,e.y-8,14,e.type.startsWith('sk')?'#f2ecd0':'#a0e050',90,.7,2,60);
  sfx('kill'); kills++; score+=e.d.score; addNum(e.x,e.y-34*e.scale,'+'+e.d.score,'#9ff');
  const [c0,c1]=e.d.coins; for(let i=ri(c0,c1);i>0;i--)pickups.push(mkPick('coin',e.x,e.y-4));
  if(rnd()<.14)pickups.push(mkPick(pick(['potRed','potRed','potBlue','potYellow']),e.x,e.y-4));
  if(rnd()<.08)pickups.push(mkPick(rnd()<.35?'gemB':'gemA',e.x,e.y-4));
  if(rnd()<.07){const k=mkPick('orb',e.x,e.y-4,0,0,pick(PLIST));k.life=1e9;pickups.push(k);}
  {if(rnd()<.03){const nw=WLIST.filter(w=>!P.own[w]),k=mkPick('wpn',e.x,e.y-4,0,0,pick(nw.length?nw:WLIST));k.life=1e9;pickups.push(k);}}
  if(e.elite){pickups.push(mkPick('key',e.x,e.y-4,0,0));say('Kunci jatuh! Ambil dan temukan portal.',3.5);L.elite=null;shake=6;}
  if(e.boss){shake=14;winT=2.6;sfx('boom');addPart(e.x,e.y-20,60,'#ffd24a',170,1.2,2);bossRef=null;for(const o of ents.slice())if(o!==e)killEnemy(o);}
}
function shoot(e,ang,spd){ projs.push({x:e.x,y:e.y-10,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:3,dmg:e.d.dmg,c:e.type.startsWith('orc')?'#ff9a3a':'#7fe3ff'}); }
function playerAttack(){
  const W=WDEF[P.wpn], a=P.atkAng, ca=Math.cos(a), sa=Math.sin(a), dm0=P.dmg*W.dm*(1+.15*((P.wlv[P.wpn]||1)-1))*(P.buffDmg>0?1.5:1);
  if(W.type==='bow'){pproj.push({k:'arrow',x:P.x+ca*8,y:P.y-8+sa*8,vx:ca*W.speed,vy:sa*W.speed,life:1.1,dmg:dm0,pierce:1,hit:[],a});sfx('bow');return;}
  if(W.type==='staff'){pproj.push({k:'fire',x:P.x+ca*9,y:P.y-8+sa*9,vx:ca*W.speed,vy:sa*W.speed,life:1.6,dmg:dm0,rad:W.rad,a,t:0});sfx('fire');return;}
  let hit=0; const R=W.reach;
  for(const e of ents.slice()){
    const dx=e.x-P.x, dy=(e.y-6*e.scale)-(P.y-8), d=hyp(dx,dy), rr=R+(e.scale>1?12:0);
    if(d>rr+4)continue; let da=Math.atan2(dy,dx)-a; da=Math.atan2(Math.sin(da),Math.cos(da));
    if(Math.abs(da)<W.arc||d<10){ hit++; damageEnemy(e,dm0,Math.atan2(dy,dx),W.kb); }
  }
  for(const c of crystals.slice()){
    const dx=c.x-P.x, dy=(c.y-8)-(P.y-8), d=hyp(dx,dy); if(d>R+6)continue; let da=Math.atan2(dy,dx)-a; da=Math.atan2(Math.sin(da),Math.cos(da));
    if(Math.abs(da)<W.arc||d<12){ hit++; hitCrystal(c,Math.atan2(dy,dx),1); }
  }
  for(let i=projs.length-1;i>=0;i--){const p=projs[i];if(hyp(p.x-P.x,p.y-(P.y-8))<R&&p.dmg){addPart(p.x,p.y,5,p.c,50,.3,1);projs.splice(i,1);sfx('hit');}}
  if(hit)addPart(P.x+ca*18,P.y-8+sa*18,4,'#fff',60,.2,1);
}

/* ============ update ============ */
function update(dt){
  time+=dt; runTime+=dt;
  if(msg.t>0)msg.t-=dt;
  // ---- player ----
  const p=P;
  if(!p.dead){
    let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0), iy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
    if(stickV.x||stickV.y){ix=stickV.x;iy=stickV.y; if(hyp(ix,iy)<.18)ix=iy=0;}
    let l=hyp(ix,iy); if(l>1){ix/=l;iy/=l;l=1;}
    p.moving=l>.1;
    if(p.moving){p.fx=ix/(l||1);p.fy=iy/(l||1);}
    const spd=p.spd*(p.buffSpd>0?1.4:1)*(p.atkT>0?.55:1);
    if(p.dashT>0){
      p.dashT-=dt; moveEnt(p,p.dashX*dt*230,p.dashY*dt*230,5);
      if(rnd()<.6)parts.push({x:p.x,y:p.y-6,vx:0,vy:0,l:.25,m:.25,c:'rgba(160,220,255,.7)',s:3,gr:0});
      trail.push({x:p.x,y:p.y,flip:p.face<0,t:0});
    }else{
      moveEnt(p,ix*spd*dt,iy*spd*dt,5);
      if(p.moving){ p.stepT-=dt; if(p.stepT<=0){ p.stepT=.24; addPart(p.x,p.y+3,1,'rgba(205,195,175,.4)',24,.32,1,34); } }
    }
    p.squash=Math.max(0,p.squash-dt*7);
    if(p.kx||p.ky){moveEnt(p,p.kx*dt,p.ky*dt,5);p.kx*=Math.pow(.003,dt);p.ky*=Math.pow(.003,dt);if(Math.abs(p.kx)+Math.abs(p.ky)<6)p.kx=p.ky=0;}
    if(p.atkT<=0&&Math.abs(ix)>.2)p.face=ix>0?1:-1;
    p.inv=Math.max(0,p.inv-dt); p.flash=Math.max(0,p.flash-dt); p.dashCD=Math.max(0,p.dashCD-dt); p.atkCD=Math.max(0,p.atkCD-dt);
    p.buffSpd=Math.max(0,p.buffSpd-dt); p.buffDmg=Math.max(0,p.buffDmg-dt); p.pcd=Math.max(0,p.pcd-dt); if(p.shield>0)p.shield=Math.max(0,p.shield-dt);
    atkQ=Math.max(0,atkQ-dt); dashQ=Math.max(0,dashQ-dt);
    // aim
    const useMouse=!touchMode&&mouse.active&&performance.now()-mouse.t<2500;
    let aim;
    if(useMouse){ const sx=p.x-camX, sy=p.y-8-camY; aim=Math.atan2(mouse.y-sy,mouse.x-sx); }
    else{
      let best=null,bd=70; for(const e of ents){const d=hyp(e.x-p.x,e.y-p.y);if(d<bd){bd=d;best=e;}}
      aim = (best&&(touchMode||!p.moving))?Math.atan2(best.y-6-(p.y-8),best.x-p.x):Math.atan2(p.fy,p.fx);
    }
    // attack
    const wantAtk=atkQ>0||keys.Space||keys.KeyJ||(mouse.down&&!touchMode)||tAtk;
    if(wantAtk&&p.atkCD<=0&&p.dashT<=0){const W=WDEF[p.wpn];p.atkT=.3;p.atkCD=W.cd/(p.atkSpd||1);p.atkAng=aim;p.fx=Math.cos(aim);p.fy=Math.sin(aim);p.atkHit=false;atkQ=0;if(W.type==='melee')sfx('sw_'+p.wpn);if(Math.abs(Math.cos(aim))>.2)p.face=Math.cos(aim)>0?1:-1;}
    if(p.atkT>0){p.atkT-=dt;if(!p.atkHit&&p.atkT<.21){p.atkHit=true;playerAttack();}}
    // dash
    if(dashQ>0&&p.dashCD<=0&&p.dashT<=0){
      let dx=p.moving?p.fx:Math.cos(aim),dy=p.moving?p.fy:Math.sin(aim); const dl=hyp(dx,dy)||1;
      p.dashX=dx/dl;p.dashY=dy/dl;p.dashT=.17;p.dashCD=.85;p.inv=Math.max(p.inv,.22);dashQ=0;sfx('dash');addPart(p.x,p.y-4,6,'#cfe8ff',50,.3,2);
    }
  }
  // ---- flow ----
  flowT-=dt; if(flowT<=0){updateFlow();flowT=.22;}
  // ---- enemies ----
  for(const e of ents.slice()) updateEnemy(e,dt);
  // separation
  for(let i=0;i<ents.length;i++)for(let j=i+1;j<ents.length;j++){const a=ents[i],b=ents[j];const dx=b.x-a.x,dy=b.y-a.y,d=hyp(dx,dy),m=9*(a.scale+b.scale)/2;
    if(d<m&&d>.01){const k=(m-d)*.5/d;moveEnt(b,dx*k*.5,dy*k*.5);moveEnt(a,-dx*k*.5,-dy*k*.5);}}
  // ---- projectiles ----
  for(let i=projs.length-1;i>=0;i--){const q=projs[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;
    if(q.life<=0||solidAt(q.x,q.y)){addPart(q.x,q.y,4,q.c,40,.25,1);projs.splice(i,1);continue;}
    if(!P.dead&&hyp(q.x-P.x,q.y-(P.y-9))<6){ if(P.dashT>0||P.inv>0)continue; hurtPlayer(q.dmg,q.x-q.vx,q.y-q.vy);projs.splice(i,1);}
  }
  // ---- waves (boss shock) ----
  for(let i=waves.length-1;i>=0;i--){const w=waves[i];w.r+=w.sp*dt;
    if(!w.hit&&!P.dead){const d=hyp(P.x-w.x,P.y-w.y);if(Math.abs(d-w.r)<7){if(hurtPlayer(w.dmg,w.x,w.y))w.hit=true;}}
    if(w.r>w.max)waves.splice(i,1);}
  // ---- player projectiles ----
  for(let i=pproj.length-1;i>=0;i--){const q=pproj[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;let rm=false;
    if(q.k==='fire'&&rnd()<.8)parts.push({x:q.x+rf(-2,2),y:q.y+rf(-2,2),vx:rf(-10,10),vy:rf(-10,10),l:.3,m:.3,c:rnd()<.5?'#ff9a4a':'#ffd27a',s:2,gr:0});
    for(let j=projs.length-1;j>=0&&!rm;j--){const o=projs[j];if(hyp(q.x-o.x,q.y-o.y)<7){addPart(o.x,o.y,5,o.c,50,.3,1);projs.splice(j,1);sfx('hit');if(q.k==='fire'){rm=true;boomFire(q);}else if(q.pierce--<=0)rm=true;}}
    if(rm){}else if(q.life<=0||solidAt(q.x,q.y)){rm=true;if(q.k==='fire')boomFire(q);else addPart(q.x,q.y,3,'#ddd',40,.2,1);}
    else{
      for(const c of crystals.slice()){ if(q.hit&&q.hit.includes(c))continue;
        if(hyp(q.x-c.x,q.y-(c.y-8))<9){ if(q.k==='arrow'){q.hit.push(c);hitCrystal(c,Math.atan2(q.vy,q.vx),1);if(q.pierce--<=0){rm=true;break;}} else{rm=true;boomFire(q);break;} } }
      if(!rm) for(const e of ents.slice()){ if(q.hit&&q.hit.includes(e))continue;
      if(hyp(q.x-e.x,q.y-(e.y-6*e.scale))<6*e.scale+3){
        if(q.k==='arrow'){q.hit.push(e);damageEnemy(e,q.dmg,Math.atan2(q.vy,q.vx),WDEF.bow.kb);if(q.pierce--<=0){rm=true;break;}}
        else{rm=true;boomFire(q);break;} } } }
    if(rm)pproj.splice(i,1);}
  for(let i=fx.length-1;i>=0;i--){const f=fx[i];if(f.k==='ring'){f.r+=f.sp*dt;if(f.r>=f.max)fx.splice(i,1);}else{f.t+=dt;if(f.t>f.life)fx.splice(i,1);}}
  // ---- pickups ----
  for(let i=pickups.length-1;i>=0;i--){const k=pickups[i];k.age+=dt;k.t+=dt;
    if(k.z>0||k.vz>0){k.vz-=220*dt;k.z+=k.vz*dt;if(k.z<=0){k.z=0;k.vz=k.vz<-40?-k.vz*.4:0;}
      const nx=k.x+k.vx*dt,ny=k.y+k.vy*dt;if(!solidAt(nx,ny))k.x=nx;if(!solidAt(k.x,ny))k.y=ny;k.vx*=.96;k.vy*=.96;}
    if(!P.dead){const d=hyp(P.x-k.x,(P.y-4)-k.y);
      if(d<34&&k.age>.35&&k.type!=='key'||d<40&&k.type==='key'&&k.age>.3){const a=Math.atan2(P.y-4-k.y,P.x-k.x);k.x+=Math.cos(a)*110*dt;k.y+=Math.sin(a)*110*dt;}
      if(d<9&&k.age>.3){collect(k);pickups.splice(i,1);}}
  }
  for(const c of crystals){c.t+=dt;c.flash=Math.max(0,c.flash-dt);c.shake=Math.max(0,c.shake-dt*6);}
  // ---- chests ----
  for(const c of chests){c.t+=dt;if(!c.open&&!P.dead&&hyp(P.x-c.x,P.y-c.y)<14)openChest(c);}
  // ---- portal ----
  L.portal.open=P.key;
  if(!P.dead&&floor<3&&P.key&&hyp(P.x-L.portal.x,P.y-L.portal.y)<13){ nextFloor(); return; }
  // ---- explore ----
  const pcx=P.x/TILE|0,pcy=P.y/TILE|0; let ch=false;
  for(let y=pcy-6;y<=pcy+6;y++)for(let x=pcx-8;x<=pcx+8;x++){ if(x<0||y<0||x>=MW||y>=MH)continue; if((x-pcx)*(x-pcx)/64+(y-pcy)*(y-pcy)/36>1)continue; const n=x+y*MW; if(!L.explored[n]){L.explored[n]=1;ch=true;} }
  if(ch)L.miniDirty=true;
  // ---- particles ----
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.l-=dt;if(q.l<=0){parts.splice(i,1);continue;}q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.gr*dt;q.vx*=.97;}
  for(let i=trail.length-1;i>=0;i--){trail[i].t+=dt;if(trail[i].t>.24)trail.splice(i,1);}
  for(let i=nums.length-1;i>=0;i--){nums[i].t+=dt;if(nums[i].t>.8)nums.splice(i,1);}
  for(let i=corpses.length-1;i>=0;i--){const c=corpses[i];c.t+=dt;if(!c.player&&c.t>7)corpses.splice(i,1);}
  shake=Math.max(0,shake-dt*22);
  // ---- end states ----
  if(P.dead){overT+=dt; if(overT>1.7&&state==='play')endGame(false);}
  if(winT>0){winT-=dt;if(winT<=0)endGame(true);}
}

function updateEnemy(e,dt){
  e.squash=Math.max(0,e.squash-dt*7);
  if(e.intro>0){e.intro=Math.max(0,e.intro-dt);shake=Math.max(shake,e.intro>0?2:0);if(e.intro<=0){shake=10;sfx('boom');say('RAJA ORC MUNCUL!',2.2);}}
  if(e.freeze>0){e.freeze-=dt;e.moving=false;e.wind=0;e.flash=Math.max(0,e.flash-dt);return;}
  const d=e.d; e.t+=dt; e.flash=Math.max(0,e.flash-dt); e.cd-=dt; e.moving=false;
  if(e.kx||e.ky){moveEnt(e,e.kx*dt,e.ky*dt);e.kx*=Math.pow(.01,dt);e.ky*=Math.pow(.01,dt);if(Math.abs(e.kx)+Math.abs(e.ky)<5)e.kx=e.ky=0;}
  if(e.stun>0){e.stun-=dt;return;}
  if(e.intro>0)return;
  if(P.dead)return;
  const dx=P.x-e.x, dy=P.y-e.y, dist=hyp(dx,dy);
  if(!e.alert){ if((dist<115&&los(e.x,e.y-5,P.x,P.y-5))||dist<36){e.alert=true;if(e.intro<0)e.intro=1.1;} else return; }
  if(dist>520&&!e.boss){return;}
  const ang=Math.atan2(dy,dx);
  switch(d.ai){
    case 'melee':{
      if(e.wind>0){e.wind-=dt;if(e.wind<=0){ if(dist<26)hurtPlayer(d.dmg,e.x,e.y); e.cd=1.15; addPart(e.x+Math.cos(ang)*12,e.y-8,3,'#fff',40,.2,1);} break; }
      if(dist>17)toward(e,d.spd,dt);
      else if(e.cd<=0){e.wind=.42;if(Math.abs(dx)>2)e.face=dx>0?1:-1;}
      break; }
    case 'dasher':{
      e.lungeCD-=dt;
      if(e.lunge>0){e.lunge-=dt;moveEnt(e,e.dx*d.spd*3.4*dt,e.dy*d.spd*3.4*dt);e.moving=true;}
      else{ toward(e,d.spd,dt); if(e.lungeCD<=0&&dist<75&&dist>24&&los(e.x,e.y-5,P.x,P.y-5)){e.lunge=.28;e.dx=dx/dist;e.dy=dy/dist;e.lungeCD=rf(2.2,3.4);e.flash=.12;} }
      if(dist<13&&e.cd<=0){ if(hurtPlayer(d.dmg,e.x,e.y)) e.cd=.9; }
      if(Math.abs(dx)>2)e.face=dx>0?1:-1;
      break; }
    case 'ranged':{
      if(e.wind>0){e.wind-=dt;if(e.wind<=0){
          const n=e.shots||1, spread=n>1?.34:0; for(let i=0;i<n;i++){const a=ang+(n>1?(i-(n-1)/2)*spread:rf(-.06,.06));shoot(e,a,78);} sfx('shoot'); e.cd=d.cd*rf(.9,1.3);}
        if(Math.abs(dx)>2)e.face=dx>0?1:-1; break; }
      const vis=los(e.x,e.y-6,P.x,P.y-6);
      if(dist<52&&vis)toward(e,d.spd*1.2,dt,true); else if(dist>96||!vis)toward(e,d.spd,dt);
      if(Math.abs(dx)>2)e.face=dx>0?1:-1;
      if(vis&&dist<140&&e.cd<=0)e.wind=.5;
      break; }
    case 'boss':{
      if(!e.enraged&&e.hp<e.maxHp*.5){e.enraged=true;say('Raja Orc murka!',2.5);shake=8;sfx('boom');
        for(let i=0;i<3;i++){const a=i*2.1+rnd();const m=mkEnemy(pick(['skWarrior','skRogue']),e.x+Math.cos(a)*30,e.y+Math.sin(a)*24);m.alert=true;if(!blockedAt(m.x,m.y,5))ents.push(m);}}
      const sp=d.spd*(e.enraged?1.35:1);
      e.mt-=dt;
      if(Math.abs(dx)>3&&e.mode!=='charge')e.face=dx>0?1:-1;
      if(e.mode==='chase'){ if(dist>24)toward(e,sp,dt);
        if(dist<22&&e.cd<=0){ if(hurtPlayer(d.dmg,e.x,e.y))e.cd=1; }
        if(e.mt<=0){ e.mode=rnd()<.5?'ctele':'stele'; e.mt=e.mode==='ctele'?.75:.9; e.dx=dx/(dist||1); e.dy=dy/(dist||1); }
      }else if(e.mode==='ctele'){ e.dx=dx/(dist||1);e.dy=dy/(dist||1); e.flash=(Math.sin(e.t*30)>0)?.35:0; if(e.mt<=0){e.mode='charge';e.mt=.55;sfx('dash');} }
      else if(e.mode==='charge'){ const ox=e.x,oy=e.y; moveEnt(e,e.dx*sp*6*dt,e.dy*sp*6*dt,9); e.moving=true; if(hyp(e.x-ox,e.y-oy)<.2){e.mt=Math.min(e.mt,.05);shake=Math.max(shake,5);}
        if(hyp(P.x-e.x,P.y-e.y)<24)hurtPlayer(d.dmg+5,e.x-e.dx*10,e.y-e.dy*10);
        if(rnd()<.7)parts.push({x:e.x,y:e.y-2,vx:rf(-10,10),vy:rf(-10,0),l:.4,m:.4,c:'rgba(180,170,150,.6)',s:3,gr:0});
        if(e.mt<=0){e.mode='rest';e.mt=.9;} }
      else if(e.mode==='stele'){ e.flash=(Math.sin(e.t*26)>0)?.3:0; if(e.mt<=0){e.mode='rest';e.mt=.9;waves.push({x:e.x,y:e.y,r:6,sp:150,max:84,dmg:20,hit:false});shake=9;sfx('boom');} }
      else if(e.mode==='rest'){ if(e.mt<=0){e.mode='chase';e.mt=rf(2.4,3.6)-(e.enraged?.8:0);} }
      break; }
  }
  if(e.moving){ e.stepT-=dt; if(e.stepT<=0){ e.stepT=.3/(e.scale||1); addPart(e.x,e.y+2,1,'rgba(195,185,165,.32)',20,.3,1,30); } }
}
function collect(k){
  switch(k.type){
    case 'coin':P.coins++;score+=10;sfx('coin');addNum(P.x,P.y-26,'+10','#ffd84a');break;
    case 'gemA':score+=50;sfx('gem');addNum(P.x,P.y-26,'+50','#7fffe0');break;
    case 'gemB':score+=100;sfx('gem');addNum(P.x,P.y-26,'+100','#ff9be0');break;
    case 'ore':P.coins+=3;score+=30;sfx('coin');addNum(P.x,P.y-26,'+3 koin','#ffd84a');addPart(P.x,P.y-10,6,'#ffd84a',50,.4,2);break;
    case 'book':sfx('chest');shake=3;addPart(P.x,P.y-12,20,'#ffd84a',90,.7,2);rollUpgrade(P.x,P.y-12,'BUKU KUNO: ');break;
    case 'potRed':P.hp=Math.min(P.maxHp,P.hp+35);sfx('pot');addNum(P.x,P.y-26,'+35 HP','#7bff7b');addPart(P.x,P.y-10,10,'#ff6a6a',50,.6,2);break;
    case 'potBlue':P.buffSpd=12;sfx('pot');say('Lari cepat 12 detik!',2);addPart(P.x,P.y-10,10,'#6aa8ff',50,.6,2);break;
    case 'potYellow':P.buffDmg=12;sfx('pot');say('Serangan kuat 12 detik!',2);addPart(P.x,P.y-10,10,'#ffd84a',50,.6,2);break;
    case 'wpn':
      if(!P.own[k.sub]){P.own[k.sub]=1;P.wlv[k.sub]=1;P.wpn=k.sub;P.atkT=0;sfx('key');say(WDEF[k.sub].name+' didapat!',2.8);addPart(P.x,P.y-12,16,'#fff',80,.7,2);}
      else if((P.wlv[k.sub]||1)<5){P.wlv[k.sub]=(P.wlv[k.sub]||1)+1;sfx('key');say(WDEF[k.sub].name+' naik ke Lv'+P.wlv[k.sub]+'!',2.8);addPart(P.x,P.y-12,16,'#ffd84a',80,.7,2);}
      else{score+=50;sfx('gem');addNum(P.x,P.y-26,'+50','#7fffe0');}
      break;
    case 'orb':
      P.pw[k.sub]=Math.min(5,P.pw[k.sub]+1);P.psel=k.sub;sfx('pick');
      {let m='Power '+PDEF[k.sub].name+' x'+P.pw[k.sub]+' (tombol POWER)',t=2.4;
        // tips singkat: cara pakai (sekali seumur app), lalu fungsi tiap power (sekali per permainan)
        if(!powerTipSeen()){powerTipSeen(true);m=touchMode?'POWER: ketuk = pakai, tahan = ganti power':'POWER: E = pakai, R = ganti power';t=4.2;}
        else if(!P.seenPw[k.sub]){m=PDEF[k.sub].name+': '+PDEF[k.sub].tip;t=3.2;}
        P.seenPw[k.sub]=1;say(m,t);}
addPart(P.x,P.y-12,12,PDEF[k.sub].col,70,.6,2);
      break;
    case 'key':P.key=true;sfx('key');say(floor<3?'Kunci didapat! Menuju portal...':'Kunci didapat!',3);addPart(P.x,P.y-12,16,'#ffd84a',80,.7,2);break;
  }
}
function rollUpgrade(x,y,pre){
  const opts=[['maxhp','Nyawa maks +20!'],['dmg','Serangan +25%!'],['spd','Kecepatan +10%!'],['atk','Ayunan lebih cepat!'],['pow','Power baru!'],['pow','Power baru!'],['wup','Senjata naik level!']];
  const nw=WLIST.filter(w=>!P.own[w]);if(nw.length)opts.push(['wpn','Senjata baru!']);
  const o=pick(opts);
  if(o[0]==='maxhp'){P.maxHp+=20;P.hp=Math.min(P.maxHp,P.hp+30);}
  if(o[0]==='pow'){const k=mkPick('orb',x,y-4,0,0,pick(PLIST));k.life=1e9;pickups.push(k);}
  if(o[0]==='wpn'){const k=mkPick('wpn',x,y-4,0,0,pick(nw));k.life=1e9;pickups.push(k);}
  if(o[0]==='wup'){P.wlv[P.wpn]=Math.min(5,(P.wlv[P.wpn]||1)+1);}
  if(o[0]==='dmg')P.dmg*=1.25; if(o[0]==='spd')P.spd*=1.1; if(o[0]==='atk')P.atkSpd=(P.atkSpd||1)*1.18;
  say((pre||'')+o[1],2.6); addNum(x,y-20,o[1],'#fff');
}
function openChest(c){
  c.open=true;sfx('chest');shake=3;addPart(c.x,c.y-8,18,'#ffe07a',90,.7,2);
  rollUpgrade(c.x,c.y);
  for(let i=0;i<3;i++)pickups.push(mkPick('coin',c.x,c.y-4)); if(rnd()<.5)pickups.push(mkPick('potRed',c.x,c.y-4));
}
function nextFloor(){ sfx('portal'); floor++; score+=200; P.hp=Math.min(P.maxHp,P.hp+Math.round(P.maxHp*.4)); newFloor(); fade=1; }
let fade=0;

/* ============ render ============ */
let camX=0,camY=0;
function setCam(snap){
  const tx=P.x-VW/2, ty=P.y-8-VH/2, mx=MW*TILE-VW, my=MH*TILE-VH;
  const cx=mx<0?mx/2:clamp(tx,0,mx), cy=my<0?my/2:clamp(ty,0,my);
  if(snap){camX=cx;camY=cy;}else{camX+=(cx-camX)*.14;camY+=(cy-camY)*.14;}
}
function frameOf(def,t,fps,n){return Math.floor(t*fps)%(n||def.n);}
// sheet idle menghadap depan; sheet run menghadap kanan. Pose diam memakai frame run berkaki rapat (1 & 4) agar arah hadap konsisten.
const IDLEF=[1,4];
const idleFrame=t=>IDLEF[Math.floor(t*.7)%IDLEF.length];
const breath=t=>[0,1,1,0][Math.floor(t*3)%4];
const bodyOff={x:0,y:0};
function drawEnemy(e){
  const sp=SPR[e.type]; const frz=e.freeze>0, moving=e.moving&&!frz;
  // Pose depan vs samping diputuskan oleh nextFront (pose.js): histeresis + tahan minimal 0,4 detik, supaya tidak berkedip di garis batas.
  if(nextFront(e,P.y-e.y,Math.abs(P.x-e.x),moving,frz,time)&&e.lastDraw){e.prevDraw=e.lastDraw;e.blendAt=time;}
  const front=!!e.front;
  const def=front?sp.idle:sp.run;
  const fr=front?frameOf(def,e.t,6):moving?frameOf(def,e.t,10):idleFrame(frz?0:e.t);
  const sq=e.squash, introK=e.intro>0?e.intro/1.1:0;
  const o={scale:e.scale*(1+introK*1.6),flash:e.flash/.14,flip:front?false:e.face<0,tint:frz?.55:0,bob:(!moving&&!front&&!frz)?breath(e.t):0,outline:e.elite?'gold':(e.wind>0&&Math.floor(e.t*20)%2?'red':null),
    stx:1+sq*.2-introK*.3,sty:1-sq*.2+introK*.5,alpha:e.intro>0?Math.max(.2,1-introK):1};
  e.lastDraw={def,fr,o};
  if(e.boss)drawBossAura(e);
  shadow(e.x,e.y,7*e.scale*(1+introK));
  drawSpr(def,fr,e.x,e.y,o);
  // Peralihan pose: pose lama memudar di atas pose baru selama 0,14 detik, jadi tidak lompat mendadak.
  if(e.prevDraw){const k=1-(time-e.blendAt)/.14;if(k>0&&k<=1)drawSpr(e.prevDraw.def,e.prevDraw.fr,e.x,e.y,Object.assign({},e.prevDraw.o,{alpha:k*.85,flash:0,tint:0,outline:null}));else e.prevDraw=null;}
  if(e.wind>0&&(e.d.ai==='melee'||e.d.ai==='ranged')){g.fillStyle='#ff4040';g.fillRect(Math.round(e.x)-1,Math.round(e.y-34*e.scale),2,5);g.fillRect(Math.round(e.x)-1,Math.round(e.y-28*e.scale),2,2);}
  if(e.hp<e.maxHp&&!e.boss){const w=14,x=Math.round(e.x-w/2),y=Math.round(e.y-30*e.scale);g.fillStyle='#000';g.fillRect(x-1,y-1,w+2,4);g.fillStyle=e.elite?'#ffcf4a':'#d33';g.fillRect(x,y,Math.max(0,w*e.hp/e.maxHp),2);}
  if(e.mode==='ctele'){g.save();g.strokeStyle='rgba(255,70,50,.55)';g.lineWidth=10;g.beginPath();g.moveTo(e.x,e.y-4);g.lineTo(e.x+e.dx*110,e.y-4+e.dy*110);g.stroke();g.restore();}
  if(e.mode==='stele'){g.save();g.strokeStyle='rgba(255,90,60,'+(.35+.3*Math.sin(e.t*20))+')';g.lineWidth=2;g.beginPath();g.ellipse(e.x,e.y-2,84*(1-e.mt/.9)+4,(84*(1-e.mt/.9)+4)*.8,0,0,6.283);g.stroke();g.restore();}
}
function shadow(x,y,r){g.fillStyle='rgba(0,0,0,.38)';g.beginPath();g.ellipse(Math.round(x),Math.round(y)-1,r,r*.4,0,0,6.283);g.fill();}
function drawBossAura(e){
  const x=Math.round(e.x),y=Math.round(e.y)+1,pulse=.5+.5*Math.sin(time*2.4),col=e.enraged?'255,70,50':'255,150,40';
  g.save();
  g.globalAlpha=.22+.12*pulse; g.strokeStyle='rgba('+col+',1)'; g.lineWidth=2;
  g.beginPath(); g.ellipse(x,y,16+pulse*2,7+pulse,0,0,6.283); g.stroke();
  g.globalAlpha=.1+.06*pulse; g.fillStyle='rgba('+col+',1)';
  g.beginPath(); g.ellipse(x,y,16+pulse*2,7+pulse,0,0,6.283); g.fill();
  g.restore();
  if(e.enraged&&rnd()<.4)parts.push({x:x+rf(-10,10),y:y+2,vx:rf(-4,4),vy:-rf(14,26),l:.5,m:.5,c:'rgba(255,110,50,.55)',s:1,gr:-6});
}
function drawHeld(){
  const p=P,W=WDEF[p.wpn],art=heldArt(p.wpn,p.wlv[p.wpn]); let ang,ox,oy;
  if(p.atkT>0){const t=1-p.atkT/.3,a=p.atkAng,k=Math.min(1,t*1.7);
    if(W.thrust){ang=a;const off=Math.sin(k*Math.PI)*(W.reach-22);ox=Math.cos(a)*(6+off);oy=Math.sin(a)*(6+off);}
    else if(W.type==='melee'){ang=a-1.3+k*2.6;ox=Math.cos(ang)*5;oy=Math.sin(ang)*5;}
    else{ang=a;const rc=t<.3?-3*(1-t/.3):0;ox=Math.cos(a)*(7+rc);oy=Math.sin(a)*(7+rc);}
  }else{
    // ayunan idle lembut: sedikit berbeda saat diam vs berjalan, biar senjata terasa "hidup"
    const mv=p.moving||p.dashT>0, sway=mv?Math.sin(time*13.5)*.1:Math.sin(time*2.1)*.05;
    ang=(p.face>0?-.9:Math.PI+.9)+sway; ox=p.face*6; oy=2+(mv?Math.sin(time*13.5)*1.1:Math.sin(time*2.1)*.6);
  }
  g.save();g.translate(Math.round(p.x+ox+bodyOff.x),Math.round(p.y-8+oy+bodyOff.y));g.rotate(ang);if(Math.cos(ang)<0)g.scale(1,-1);if(art.rot)g.rotate(art.rot);
  g.drawImage(art.img,-art.gx,-art.gy);g.restore();
}
function drawGhost(def,frame,x,y,flip,alpha){
  const fw=def.fw,sx=frame*fw,dx=-fw/2,dy=-def.ay;
  g.save();g.translate(Math.round(x),Math.round(y));if(flip)g.scale(-1,1);
  g.globalAlpha=alpha;g.drawImage(def.ice,sx,0,fw,def.fh,dx,dy,fw,def.fh);g.restore();g.globalAlpha=1;
}
function drawPlayer(){
  const p=P; if(p.dead||state==='title'||state==='splash')return;
  const blink=p.inv>0&&Math.floor(time*24)%2===0&&p.flash<=0&&!(p.shield>0);
  if(blink)return;
  const moving=p.moving||p.dashT>0;
  const front=!moving&&p.atkT<=0&&p.fy>.7;
  const def=front?SPR.knight.idle:SPR.knight.run; const fr=front?frameOf(def,time,6):moving?frameOf(def,time,p.dashT>0?18:10):idleFrame(time);
  let bx=0,by=0;if(p.atkT>0){const k=Math.min(1,(1-p.atkT/.3)*1.6),l=Math.sin(k*Math.PI),W=WDEF[p.wpn],a=p.atkAng,dr=W.type==='melee'?1:-.6;bx=Math.cos(a)*l*3*dr;by=Math.sin(a)*l*1.5*dr;}
  bodyOff.x=bx;bodyOff.y=by;
  shadow(p.x,p.y,6);
  for(const gtr of trail){const a=Math.max(0,1-gtr.t/.24)*.4;if(a>0)drawGhost(SPR.knight.run,2,gtr.x,gtr.y,gtr.flip,a);}
  const behind=p.atkT>0&&Math.sin(p.atkAng)<-.3;
  if(behind)drawHeld();
  const sq=p.squash;
  drawSpr(def,fr,p.x,p.y,{flip:front?false:p.face<0,flash:p.flash/.18,alpha:1,ox:bx,oy:by,bob:(!moving&&!front)?breath(time):0,stx:1+sq*.18,sty:1-sq*.18});
  if(!behind)drawHeld();
  if(p.buffDmg>0||p.buffSpd>0){g.save();g.globalAlpha=.25+.15*Math.sin(time*10);g.fillStyle=p.buffDmg>0?'#ffd84a':'#6aa8ff';g.beginPath();g.ellipse(p.x,p.y-10,10,14,0,0,6.283);g.fill();g.restore();}
  if(p.shield>0){g.save();const a=p.shield<2?(Math.floor(time*12)%2?.2:.6):.85;g.globalAlpha=a*.25;g.fillStyle='#7cc4ff';g.beginPath();g.ellipse(p.x,p.y-10,14,17,0,0,6.283);g.fill();g.globalAlpha=a;g.strokeStyle='#bfe4ff';g.lineWidth=1.2;g.stroke();g.restore();}
}
function drawSlash(){
  const p=P; if(p.atkT<=0||p.dead)return; const W=WDEF[p.wpn]; if(W.type!=='melee')return; const t=1-p.atkT/.3; // 0..1
  const a=p.atkAng; const R=W.reach; const cx=p.x,cy=p.y-8; const al=t<.25?t/.25:1-(t-.25)/.75; if(al<=0)return;
  g.save();
  if(W.thrust){
    const len=R*Math.min(1,t*3);g.globalAlpha=Math.max(0,al)*.8;g.strokeStyle=p.buffDmg>0?'#ffe38a':W.col;g.lineWidth=2.5;g.lineCap='round';
    g.beginPath();g.moveTo(cx+Math.cos(a)*10,cy+Math.sin(a)*10);g.lineTo(cx+Math.cos(a)*len,cy+Math.sin(a)*len);g.stroke();
  }else{
    const A=W.arc,a0=a-A+t*(A*.4),a1=a+A;
    g.globalAlpha=Math.max(0,al)*.95; g.fillStyle=p.buffDmg>0?'#ffe38a':W.col;
    g.beginPath(); g.arc(cx,cy,R,a0,a1); g.arc(cx-Math.cos(a)*5,cy-Math.sin(a)*5,R-10,a1,a0,true); g.closePath(); g.fill();
    g.globalAlpha=Math.max(0,al)*.6; g.fillStyle='#fff'; g.beginPath(); g.arc(cx,cy,R-1,a1-.5,a1); g.arc(cx,cy,R-4,a1,a1-.5,true); g.fill();
  }
  g.restore();
}
function drawFx(){
  for(const q of pproj){
    if(q.k==='arrow'){g.save();g.translate(q.x,q.y);g.rotate(Math.atan2(q.vy,q.vx));g.fillStyle='#d8d8d8';g.fillRect(-7,-.5,9,1);g.fillStyle='#fff';g.fillRect(2,-1,3,2);g.fillStyle='#c93a2a';g.fillRect(-8,-1.5,2,3);g.restore();}
    else{g.save();const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,8);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'#ffb04a');gr.addColorStop(1,'rgba(255,90,20,0)');g.fillStyle=gr;g.beginPath();g.arc(q.x,q.y,8,0,6.283);g.fill();g.restore();}
  }
  for(const f of fx){
    if(f.k==='ring'){const a=Math.max(0,1-f.r/f.max);g.save();g.strokeStyle='rgba('+f.rgb+','+(a*.9)+')';g.lineWidth=3;g.beginPath();g.ellipse(f.x,f.y,f.r,f.r*.8,0,0,6.283);g.stroke();g.fillStyle='rgba('+f.rgb+','+(a*.15)+')';g.fill();g.restore();}
    else{const a=1-f.t/f.life;g.save();g.lineJoin='round';
      for(const w of [[5,'rgba(255,225,74,'+(a*.35)+')'],[2,'rgba(255,255,255,'+a+')']]){g.lineWidth=w[0];g.strokeStyle=w[1];g.beginPath();f.pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();}g.restore();}
  }
}
function drawCorpse(c){
  const def=c.def; const n=def.n; const fr=Math.min(n-1,Math.floor(c.t*10)); let al=1; if(c.fade&&c.t>5)al=Math.max(0,1-(c.t-5)/2);
  drawSpr(def,fr,c.x,c.y,{flip:c.flip,scale:c.scale,alpha:al});
}
function drawBanners(){ // obor dinding berwarna (dari DarkDungeon.png) + cahaya berkedip
  if(!L.banners)return;
  for(const b of L.banners){
    const im=ART.torch[b.c], rgb=TORCH_RGB[b.c]||'255,165,70';
    const flick=.5+.3*Math.sin(time*9+b.x)+.2*Math.sin(time*23+b.y);
    const gy=b.y+13;
    if(im) g.drawImage(im,Math.round(b.x-im.width/2),Math.round(b.y+14-im.height));
    g.save(); g.globalCompositeOperation='lighter';
    const gr=g.createRadialGradient(b.x,gy,0,b.x,gy,34);
    gr.addColorStop(0,'rgba('+rgb+','+Math.max(0,.2*flick)+')'); gr.addColorStop(1,'rgba('+rgb+',0)');
    g.fillStyle=gr; g.beginPath(); g.arc(b.x,gy,34,0,6.283); g.fill(); g.restore();
    if(rnd()<.02)parts.push({x:b.x+rf(-1.5,1.5),y:b.y+4,vx:rf(-4,4),vy:-rf(14,26),l:.7,m:.7,c:'rgba('+rgb+',.85)',s:1,gr:0});
  }
}
function drawDust(){
  g.globalAlpha=1;
  for(const q of dust){
    const xx=q.x+Math.sin(time*.6+q.ph)*q.amp, yy=q.y+Math.cos(time*.5+q.ph*1.3)*q.amp*.6-(time*q.spd*.6)%14;
    const a=Math.max(0,.09+.06*Math.sin(time*2+q.ph));
    g.fillStyle='rgba(190,205,225,'+a+')'; g.fillRect(Math.round(xx),Math.round(yy),1,1);
  }
}
function drawPortal(){
  const pt=L.portal,t=time; const open=pt.open; const x=Math.round(pt.x),y=Math.round(pt.y);
  if(floor===3)return;
  g.save();
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(x,y+6,14,6,0,0,6.283);g.fill();
  const col=open?['#59ffe0','#2aa8ff','#c8fff4']:['#7a3a3a','#4a2020','#a05a5a'];
  for(let i=0;i<4;i++){g.strokeStyle=col[i%2];g.globalAlpha=.9-i*.15;g.lineWidth=2;g.beginPath();g.ellipse(x,y-2,13-i*3,8-i*2,t*(open?2:.4)*(i%2?1:-1),0.3,6.283-.3);g.stroke();}
  g.globalAlpha=1;
  if(open){const gr=g.createRadialGradient(x,y-2,1,x,y-2,14);gr.addColorStop(0,'rgba(200,255,250,.95)');gr.addColorStop(1,'rgba(40,160,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y-2,14,9,0,0,6.283);g.fill();
    for(let i=0;i<2;i++)if(rnd()<.2)parts.push({x:x+rf(-9,9),y:y,vx:0,vy:-24,l:.7,m:.7,c:'#9ffff0',s:1,gr:0});}
  else{g.drawImage(IMG.key,x-5,y-8);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x-6,y-9,12,1);}
  g.restore();
}
function drawWorld(){
  g.save();
  g.setTransform(S,0,0,S,0,0);
  const sx=shake>0?rf(-shake,shake)*.5:0, sy=shake>0?rf(-shake,shake)*.5:0;
  const cx=Math.round(camX+sx), cy=Math.round(camY+sy);
  g.fillStyle='#06080d';g.fillRect(0,0,VW,VH);
  g.translate(-cx,-cy);
  // visible map section
  const vx=clamp(cx,0,MW*TILE),vy=clamp(cy,0,MH*TILE),vw=Math.min(VW+2,MW*TILE-vx),vh=Math.min(VH+2,MH*TILE-vy);
  if(vw>0&&vh>0) g.drawImage(L.map,vx,vy,vw,vh,vx,vy,vw,vh);
  drawDust();
  drawBanners();
  drawPortal();
  for(const c of corpses) if(!c.player) drawCorpse(c);
  // depth list
  const list=[];
  for(const c of chests) list.push({y:c.y,f:()=>{const x=Math.round(c.x),y=Math.round(c.y);shadow(c.x,c.y,8);g.save();if(c.open)g.globalAlpha=.55;g.drawImage(IMG.esoteric,87,18,19,15,x-9,y-14,19,15);g.restore();
      if(!c.open){const s=(Math.sin(c.t*3)+1)*.5;g.fillStyle='rgba(255,240,160,'+(.25+.5*s)+')';g.fillRect(x+4,y-15,1,1);g.fillRect(x-6,y-9-Math.round(s),1,1);}}});
  for(const c of crystals) list.push({y:c.y,f:()=>drawCrystal(c)});
  for(const k of pickups){const bob=k.z>0?k.z:Math.sin(k.t*4)*1.5+2.5;
    list.push({y:k.y,f:()=>{if(k.type==='wpn'||k.type==='orb'||k.type==='book'){drawSpecial(k,bob);return;}const im=IMG[k.type];const x=Math.round(k.x-im.width/2),y=Math.round(k.y-im.height-bob);
      g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(Math.round(k.x),Math.round(k.y),3,1.2,0,0,6.283);g.fill();
      if(k.type==='key'){g.save();g.globalAlpha=.5+.3*Math.sin(k.t*6);g.fillStyle='#ffe07a';g.beginPath();g.arc(Math.round(k.x),y+4,9,0,6.283);g.fill();g.restore();}
      if(k.age>k.life-5&&Math.floor(k.age*8)%2)return; g.drawImage(im,x,y);}});}
  for(const e of ents) list.push({y:e.y,f:()=>drawEnemy(e)});
  list.push({y:P.y,f:drawPlayer});
  list.sort((a,b)=>a.y-b.y); for(const o of list)o.f();
  if(P.dead)for(const c of corpses)if(c.player)drawCorpse(c);
  drawSlash();
  drawFx();
  for(const w of waves){g.save();g.strokeStyle='rgba(255,150,70,'+(1-w.r/w.max)*.9+')';g.lineWidth=3;g.beginPath();g.ellipse(w.x,w.y-2,w.r,w.r*.8,0,0,6.283);g.stroke();g.restore();}
  for(const q of projs){g.save();const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,6);gr.addColorStop(0,'#fff');gr.addColorStop(.35,q.c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(q.x,q.y,6,0,6.283);g.fill();g.restore();}
  for(const q of parts){g.globalAlpha=Math.min(1,q.l/q.m*1.5);g.fillStyle=q.c;g.fillRect(Math.round(q.x),Math.round(q.y),q.s,q.s);} g.globalAlpha=1;
  // objective arrow (hanya saat benar-benar bermain — jangan bocor ke menu/jeda)
  if(state==='play') drawArrow();
  // damage numbers
  g.font='6px "Press Start 2P",monospace';g.textAlign='center';g.textBaseline='middle';
  for(const n of nums){const y=n.y-n.t*18;g.globalAlpha=Math.min(1,(.8-n.t)*3);g.lineWidth=2;g.strokeStyle='#000';g.strokeText(n.txt,Math.round(n.x),Math.round(y));g.fillStyle=n.c;g.fillText(n.txt,Math.round(n.x),Math.round(y));}
  g.globalAlpha=1;
  g.restore();
}
function drawCrystal(c){
  const a=ART.crys[c.v]; if(!a)return;
  const x=Math.round(c.x+(c.shake>0?rf(-1,1):0)), y=Math.round(c.y), d=CRYS_DEF[c.v], t=a.t, pu=.5+.5*Math.sin(c.t*2.2);
  g.fillStyle='rgba(0,0,0,.32)';g.beginPath();g.ellipse(x,y+1,Math.max(6,t.w*.45),2.6,0,0,6.283);g.fill();
  g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y-8,1,x,y-8,22);
  gr.addColorStop(0,'rgba('+d.rgb+','+(.22+.14*pu)+')');gr.addColorStop(1,'rgba('+d.rgb+',0)');g.fillStyle=gr;g.beginPath();g.arc(x,y-8,22,0,6.283);g.fill();g.restore();
  const dy=y-(t.y+t.h)+1; g.drawImage(a.img,x-12,dy);
  if(c.flash>0){g.save();g.globalAlpha=Math.min(1,c.flash/.14);g.drawImage(a.white,x-12,dy);g.restore();}
  if(c.hp<c.maxHp&&c.hp>0){for(let i=0;i<c.maxHp;i++){g.fillStyle=i<c.hp?'rgb('+d.rgb+')':'rgba(0,0,0,.6)';g.fillRect(x-4+i*3,dy-3,2,1);}}
  if(rnd()<.015)parts.push({x:x+rf(-7,7),y:y-rf(4,18),vx:0,vy:-10,l:.8,m:.8,c:'rgba('+d.rgb+',.9)',s:1,gr:0});
}
function drawSpecial(k,bob){
  const x=Math.round(k.x),y=Math.round(k.y-bob-7),pu=.55+.35*Math.sin(k.t*5);
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,Math.round(k.y),4,1.4,0,0,6.283);g.fill();
  g.save();
  const lab=(txt,col,yy)=>{g.font='5px "Press Start 2P",monospace';g.textAlign='center';g.textBaseline='bottom';g.lineWidth=2;g.strokeStyle='#000';g.lineJoin='round';g.strokeText(txt,x,yy);g.fillStyle=col;g.fillText(txt,x,yy);};
  const glow=(r,rgb,al)=>{const gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,'rgba('+rgb+','+al+')');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();};
  if(k.type==='wpn'){
    const own=P.own[k.sub],lv=P.wlv[k.sub]||1;
    glow(12,'255,255,255',pu*.5); g.drawImage(slotArt(k.sub,own?Math.min(5,lv+1):1),x-12,y-12);
    // label: senjata baru, naik level, atau sudah maksimal
    lab(!own?'BARU':lv<5?'LV'+(lv+1):'MAX',!own?'#7bff7b':lv<5?'#ffd84a':'#9aa7c2',y-12);}
  else if(k.type==='book'){
    glow(15,'255,210,80',.35+pu*.3); if(ART.book)g.drawImage(ART.book,x-9,y-9); else{g.fillStyle='#ffd84a';g.fillRect(x-5,y-6,10,12);}
    lab('KUNO','#ffd84a',y-11);}
  else{const c=PDEF[k.sub];glow(11,c.rgb,.5+pu*.4);
    const oa=ART.orb[k.sub];
    if(oa)g.drawImage(oa,x-9,y-9);
    else{g.fillStyle=c.col;g.beginPath();g.arc(x,y,4.5,0,6.283);g.fill();g.fillStyle='#fff';g.fillRect(x-2,y-3,2,2);g.strokeStyle='#000';g.lineWidth=.8;g.beginPath();g.arc(x,y,4.5,0,6.283);g.stroke();}}
  g.restore();
}
function objective(){
  if(floor===3){return bossRef?{x:bossRef.x,y:bossRef.y}:null;}
  if(P.key)return {x:L.portal.x,y:L.portal.y};
  const k=pickups.find(p=>p.type==='key'); if(k)return {x:k.x,y:k.y};
  if(L.elite)return {x:L.elite.x,y:L.elite.y};
  return null;
}
function drawArrow(){
  if(P.dead)return; const o=objective(); if(!o)return; const d=hyp(o.x-P.x,o.y-P.y); if(d<50)return;
  const a=Math.atan2(o.y-(P.y-8),o.x-P.x), r=30+Math.sin(time*5)*1.5, x=P.x+Math.cos(a)*r, y=P.y-8+Math.sin(a)*r;
  g.save();g.translate(x,y);g.rotate(a);g.globalAlpha=.9;g.fillStyle='#ffcf4a';g.strokeStyle='#000';g.lineWidth=1.2;g.beginPath();g.moveTo(5,0);g.lineTo(-3,-4);g.lineTo(-1,0);g.lineTo(-3,4);g.closePath();g.stroke();g.fill();g.restore();
}
function drawVignette(){
  g.save();g.setTransform(1,0,0,1,0,0);
  const px=(P.x-Math.round(camX))*S,py=(P.y-8-Math.round(camY))*S, r=Math.max(CW,CH)*.62;
  const gr=g.createRadialGradient(px,py,r*.12,px,py,r); gr.addColorStop(0,'rgba(4,6,12,0)');gr.addColorStop(.55,'rgba(4,6,12,.38)');gr.addColorStop(1,'rgba(2,3,8,.88)');
  g.fillStyle=gr;g.fillRect(0,0,CW,CH);
  if(P&&P.hp<P.maxHp*.3&&!P.dead){const a=.12+.08*Math.sin(time*6);const rg=g.createRadialGradient(CW/2,CH/2,CH*.35,CW/2,CH/2,CH*.85);rg.addColorStop(0,'rgba(200,0,0,0)');rg.addColorStop(1,'rgba(200,0,0,'+(a+.2)+')');g.fillStyle=rg;g.fillRect(0,0,CW,CH);}
  if(fade>0){g.fillStyle='rgba(0,0,0,'+fade+')';g.fillRect(0,0,CW,CH);}
  g.restore();
}
function txt(s,x,y,size,col,align,outline){
  g.font=size+'px "Press Start 2P",monospace';g.textAlign=align||'left';g.textBaseline='top';
  if(outline!==false){g.lineWidth=Math.max(2,size/4);g.strokeStyle='#000';g.lineJoin='round';g.strokeText(s,x,y);}
  g.fillStyle=col||'#fff';g.fillText(s,x,y);
}
// Pecah teks jadi beberapa baris agar muat di maxW (satuan canvas, sama seperti txt()).
// Mengecilkan ukuran font bertahap kalau masih kepanjangan setelah dipecah per kata.
function wrapLines(s,size,maxW){
  g.font=size+'px "Press Start 2P",monospace';
  let words=s.split(' '), lines=[], cur='';
  for(const w of words){
    const t=cur?cur+' '+w:w;
    if(g.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;} else cur=t;
  }
  if(cur)lines.push(cur);
  return lines;
}
function txtWrapped(s,cx,y,size,col,maxW,lineGap){
  const lines=wrapLines(s,size,maxW);
  lineGap=lineGap||size*1.5;
  for(let i=0;i<lines.length;i++) txt(lines[i],cx,y+i*lineGap,size,col,'center');
  return lines.length;
}
function drawHUD(){
  g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
  const u=HU*2, pad=8*HU, F=4*u; // base
  // HP bar
  const bw=64*HU,bh=8*HU,x=pad,y=pad;
  g.fillStyle='#000';g.fillRect(x-HU,y-HU,bw+2*HU,bh+2*HU);g.fillStyle='#3a0e12';g.fillRect(x,y,bw,bh);
  const hr=clamp(P.hp/P.maxHp,0,1);g.fillStyle=hr>.3?'#e8403c':'#ff7a3a';g.fillRect(x,y,bw*hr,bh);
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x,y,bw*hr,Math.max(1,HU*2));
  txt(Math.ceil(P.hp)+'/'+P.maxHp,x+bw/2,y+bh/2-2.5*HU,4*HU+2,'#fff','center');
  // dash bar
  const dr=1-P.dashCD/.85;g.fillStyle='#000';g.fillRect(x-HU,y+bh+2*HU,bw*.5+2*HU,3*HU+2*HU);g.fillStyle=dr>=1?'#6aa8ff':'#2a3d66';g.fillRect(x,y+bh+3*HU,bw*.5*clamp(dr,0,1),3*HU);
  txt('DASH',x+bw*.5+4*HU,y+bh+2.5*HU,4*HU,dr>=1?'#9cc6ff':'#55678e');
  // coins/key/floor
  const iy=y+bh+11*HU;
  g.drawImage(IMG.coin,x,iy,IMG.coin.width*HU,IMG.coin.height*HU); txt(String(P.coins),x+10*HU,iy+1*HU,5*HU,'#ffd84a');
  if(P.key){g.drawImage(IMG.key,x+30*HU,iy+1*HU,IMG.key.width*HU,IMG.key.height*HU);}
  txt('LANTAI '+floor+'/3',x,iy+14*HU,4*HU+1,'#c9d4ea');
  txt('SKOR '+score,x,iy+22*HU,4*HU+1,'#9ff');
  // weapon & power slots
  {const sw=13*HU,sy=iy+31*HU;
    WLIST.forEach((w,i)=>{const sx=x+i*(sw+HU),own=P.own[w],cur=P.wpn===w;
      g.globalAlpha=.78;g.fillStyle='#000';g.fillRect(sx,sy,sw,sw);g.globalAlpha=1;g.fillStyle=cur?'#3a2f10':'#10151f';g.fillRect(sx+HU/2,sy+HU/2,sw-HU,sw-HU);
      g.globalAlpha=own?1:.18;g.drawImage(slotArt(w,P.wlv[w]||1),sx+(sw-24*HU/2)/2,sy+(sw-24*HU/2)/2,24*HU/2,24*HU/2);g.globalAlpha=1;
      if(cur){g.strokeStyle='#ffcf4a';g.lineWidth=Math.max(1,HU);g.strokeRect(sx+HU/2,sy+HU/2,sw-HU,sw-HU);}
      txt(String(i+1),sx+1.5*HU,sy+1.5*HU,3.8*HU,own?'#9aa7c2':'#3a4660');
      if(own&&(P.wlv[w]||1)>1)txt('L'+P.wlv[w],sx+sw-HU,sy+sw-5*HU,3.8*HU,'#ffcf4a','right');});
    const py=sy+sw+3*HU,ps=11*HU;let n=0;
    PLIST.forEach(k=>{const c=P.pw[k];if(!(c>0))return;const sx=x+n*(ps+HU),cur=P.psel===k;n++;
      g.globalAlpha=.78;g.fillStyle='#000';g.fillRect(sx,py,ps,ps);g.globalAlpha=1;{const oa=ART.orb[k];if(oa){const os=ps*.84;g.drawImage(oa,sx+(ps-os)/2,py+(ps-os)/2,os,os);}else{g.fillStyle=PDEF[k].col;g.beginPath();g.arc(sx+ps/2,py+ps/2,ps*.28,0,6.283);g.fill();}}
      if(cur){g.strokeStyle='#fff';g.lineWidth=Math.max(1,HU);g.strokeRect(sx+HU/2,py+HU/2,ps-HU,ps-HU);}
      txt('x'+c,sx+ps-HU,py+ps-5*HU,3.8*HU,'#fff','right');});
    if(P.pcd>0&&n){g.globalAlpha=.5;g.fillStyle='#000';g.fillRect(x,py,n*(ps+HU),ps*(P.pcd/.7));g.globalAlpha=1;}
  }
  // minimap
  if(L.miniDirty&&time-L.miniT>.15){L.miniT=time;L.miniDirty=false;const m=L.miniCtx;m.clearRect(0,0,MW,MH);
    for(let yy=0;yy<MH;yy++)for(let xx=0;xx<MW;xx++){const n=xx+yy*MW;if(L.explored[n]){m.fillStyle=L.grid[n]?'#3f5a78':'#141b28';m.fillRect(xx,yy,1,1);}}}
  const ms=Math.max(2,Math.floor(HU*1.6)),mw=MW*ms,mh=MH*ms,mx=CW-mw-pad,my=pad;
  g.globalAlpha=.88;g.fillStyle='#000';g.fillRect(mx-HU,my-HU,mw+2*HU,mh+2*HU);g.fillStyle='#0a0e16';g.fillRect(mx,my,mw,mh);g.drawImage(L.mini,mx,my,mw,mh);g.globalAlpha=1;
  const o=objective(); if(o){const ox=o.x/TILE|0,oy=o.y/TILE|0;if(L.explored[ox+oy*MW]||P.key||true){g.fillStyle='#ffcf4a';g.fillRect(mx+ox*ms-1,my+oy*ms-1,ms+2,ms+2);}}
  g.fillStyle='#fff';g.fillRect(mx+(P.x/TILE|0)*ms-1,my+(P.y/TILE|0)*ms-1,ms+2,ms+2);
  // buffs
  let by=my+mh+6*HU; if(P.buffSpd>0){txt('LARI '+Math.ceil(P.buffSpd)+'s',CW-pad,by,4*HU,'#8fc0ff','right');by+=6*HU;} if(P.buffDmg>0){txt('KUAT '+Math.ceil(P.buffDmg)+'s',CW-pad,by,4*HU,'#ffd84a','right');}
  // message (dibungkus biar tidak meluber di layar sempit)
  if(msg.t>0){const a=Math.min(1,msg.t*2);g.globalAlpha=a;const msz=(CH>CW?4.2:4.6)*HU+1;txtWrapped(msg.s,CW/2,CH>CW?CH*.3:CH*.14,msz,'#fff',CW-pad*4);g.globalAlpha=1;}
  // boss bar
  if(bossRef){const w=Math.min(CW*.6,160*HU),bx=(CW-w)/2,byy=CH-18*HU;g.fillStyle='#000';g.fillRect(bx-HU,byy-HU,w+2*HU,7*HU+2*HU);g.fillStyle='#3a0e12';g.fillRect(bx,byy,w,7*HU);g.fillStyle='#c93a2a';g.fillRect(bx,byy,w*clamp(bossRef.hp/bossRef.maxHp,0,1),7*HU);txt('RAJA ORC',CW/2,byy-7*HU,4.4*HU+1,'#ffb48a','center');}
  g.restore();
}
function drawTitleScene(){
  // gentle pan across the level with the hero idling
  const t=time*.25, r=L.start; P.x=r.cx*TILE+8+Math.sin(t)*40; P.y=r.cy*TILE+14; P.moving=false; P.inv=0;
  camX=P.x-VW/2; camY=P.y-8-VH/2; drawWorld(); drawVignette();
}

/* ============ flow control ============ */
const scr=id=>$(id);
function showScreen(id){ for(const s of document.querySelectorAll('.screen'))s.classList.remove('on'); if(id)scr(id).classList.add('on'); $('touch').classList.toggle('on',(state==='play'&&touchMode)||editing); }
function startGame(){
  ac(); music(); sfx('ui');
  P=newPlayer(); floor=1; score=0; kills=0; runTime=0; winT=0; overT=0; fade=1;
  state='play'; showScreen(null); newFloor(); setCam(true);
}
function endGame(win){
  if(state!=='play')return; state=win?'win':'over';
  if(win){score+=500+Math.max(0,Math.round(300-runTime));sfx('win');}
  if(score>bestScore){bestScore=score;try{localStorage.setItem('nacicrypt_best',String(bestScore));}catch(e){}}
  const st=`Skor <b>${score}</b> &nbsp;·&nbsp; Rekor <b>${bestScore}</b><br>Koin <b>${P.coins}</b> &nbsp;·&nbsp; Musuh dikalahkan <b>${kills}</b><br>Lantai <b>${floor}</b> &nbsp;·&nbsp; Waktu <b>${Math.floor(runTime/60)}:${String(Math.floor(runTime%60)).padStart(2,'0')}</b>`;
  $(win?'winStat':'overStat').innerHTML=st; showScreen(win?'win':'over');
}
function setPause(on){ if(on){state='pause';showScreen('pause');}else{state='play';showScreen(null);} }
function toMenu(){ state='title'; sfx('ui'); titleInit(); showScreen('title'); }
function toggleMute(){muted=!muted;$('bMute').textContent='SUARA: '+(muted?'MATI':'HIDUP');}
function titleInit(){
  P=newPlayer(); floor=1; L=null; newFloorTitle();
  $('best').innerHTML=bestScore?`Rekor skor: <b style="color:var(--gold);font-weight:400">${bestScore}</b>`:'';
}
function newFloorTitle(){ const f=floor; floor=1; newFloor(); floor=f; msg.t=0; ents.forEach(e=>{e.alert=false;}); }

$('bPlay').onclick=startGame; $('bRetry').onclick=startGame; $('bAgain').onclick=startGame;
$('bHow').onclick=()=>{sfx('ui');showScreen('how');}; $('bCred').onclick=()=>{sfx('ui');showScreen('credits');}; $('bDonate').onclick=()=>{sfx('ui');window.open('https://sociabuzz.com/nacitwo/tribe','_blank','noopener');};
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{sfx('ui');showScreen('title');});
$('bResume').onclick=()=>setPause(false); $('bMute').onclick=toggleMute; $('bQuit').onclick=toMenu;
$('bMenu1').onclick=toMenu; $('bMenu2').onclick=toMenu;
addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')setPause(true);});
let spT=false, spA=false;
function leaveSplash(){ if(state!=='splash'||!spA)return; ac(); music(); state='title'; titleInit(); showScreen('title'); }
setTimeout(()=>{spT=true;leaveSplash();},3700);
(function splashInit(){
  try{const a=ac();if(a&&a.state==='running')sfx('splash');}catch(e){}
  const nt=$('spTitle');nt.textContent='';let d=0;
  for(const [s,c] of [['Naci',''],['Two','t'],[' games','']])for(const ch of s){const i=document.createElement('i');i.textContent=ch===' '?'\u00a0':ch;if(c)i.className=c;i.style.animationDelay=(.25+d*.07)+'s';d++;nt.appendChild(i);}
  try{$('spRun').style.backgroundImage='url('+ASSETS.sprites.knight.run.src+')';}catch(e){}
  const sp=$('splash');for(let i=0;i<14;i++){const b=document.createElement('b');b.className='em';b.style.left=(Math.random()*100)+'%';b.style.animationDelay=(Math.random()*4)+'s';b.style.animationDuration=(3+Math.random()*3)+'s';b.style.setProperty('--dx',((Math.random()-.5)*80)+'px');sp.appendChild(b);}
})();
$('splash').addEventListener('pointerdown',leaveSplash); addEventListener('keydown',()=>{if(state==='splash')leaveSplash();});

/* ============ main loop ============ */
let last=performance.now();
let lblA='',lblB='';
function refreshLabels(){ if(!P)return; const a=WDEF[P.wpn].name, has=P.pw[P.psel]>0, b=has?PDEF[P.psel].name+' x'+P.pw[P.psel]:'POWER';
  if(a!==lblA){lblA=a;$('tSwap').textContent=a;}
  if(b!==lblB){lblB=b;$('tPowerL').textContent=b;$('tPower').style.borderColor=has?PDEF[P.psel].col:'';}
  $('tPower').style.setProperty('--cd',clamp(P.pcd/.7,0,1)); $('tDash').style.setProperty('--cd',clamp(P.dashCD/.85,0,1)); }
function frame(now){
  let dt=Math.min(.05,(now-last)/1000); last=now; refreshLabels();
  if(L&&P){
    if(fade>0)fade=Math.max(0,fade-dt*1.6);
    if(state==='play'){
      if(hitstop>0){hitstop-=dt;}else update(dt);
      setCam(false); drawWorld(); drawVignette(); drawHUD();
    }else if(state==='title'||state==='splash'){ time+=dt; drawTitleScene(); }
    else if(state==='pause'||state==='over'||state==='win'){ if(state!=='pause'){time+=dt;} drawWorld(); drawVignette(); }
  }
  requestAnimationFrame(frame);
}

// ---- Android (Capacitor): tombol Back & pause saat app ke background ----
try{
  const A=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.App;
  if(A){
    A.addListener('backButton',()=>{
      if(editing){endLayout(true);return;}
      if(state==='play')setPause(true);
      else if(state==='pause')setPause(false);
      else if($('how').classList.contains('on')||$('credits').classList.contains('on'))showScreen('title');
      else if(state==='title'||state==='splash')A.exitApp();
      else toMenu();
    });
    A.addListener('appStateChange',st=>{if(!st.isActive&&state==='play')setPause(true);});
  }
}catch(e){}
try{document.fonts&&document.fonts.load('8px "Press Start 2P"').catch(()=>{});}catch(e){}
window.NACI={get msg(){return msg;},get state(){return state;},get P(){return P;},get L(){return L;},get ents(){return ents;},get floor(){return floor;},start:startGame,
  setFloor(n){floor=n;newFloor();setCam(true);},get pickups(){return pickups;},get chests(){return chests;},get crystals(){return crystals;},get proj(){return projs;},
  kill(){for(const e of ents.slice())killEnemy(e);},give(){for(const w of WLIST)P.own[w]=1;for(const k of PLIST)P.pw[k]=3;},use:usePower,swap:swapWeapon,setW:setWeapon,get pproj(){return pproj;},openLayout,closeLayout,tp(x,y){P.x=x;P.y=y;setCam(true);}};
loadAll().then(()=>{ P=newPlayer(); titleInit(); requestAnimationFrame(frame); spA=true; if(spT)leaveSplash(); });
})();
