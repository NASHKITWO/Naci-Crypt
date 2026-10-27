const test=require('node:test'),assert=require('node:assert');
const {CTRL,defLayout,findOverlaps,separate,estSafe,snapPx,groupDeltaLimits,ctlRect}=require('../www/layout.js');
const Z={t:0,r:0,b:0,l:0};
const sizes=[[640,360],[800,360],[740,344],[896,414],[960,540],[1280,720]];

test('bawaan landscape tanpa poni tidak bertumpuk',()=>{
  for(const [W,H] of sizes)assert.equal(findOverlaps(defLayout(W,H,Z),W,H,Z).size,0,W+'x'+H);
});
test('bawaan landscape dengan poni di kiri-kanan tidak bertumpuk bila dihitung dengan area aman yang benar',()=>{
  for(const [W,H] of sizes){const s={t:0,r:48,b:21,l:48};assert.equal(findOverlaps(defLayout(W,H,s),W,H,s).size,0,W+'x'+H);}
});
test('bug lama: tata letak dihitung tanpa poni lalu diberi poni -> bertumpuk',()=>{
  const W=640,H=360,s={t:0,r:48,b:21,l:48};
  assert.ok(findOverlaps(defLayout(W,H,Z),W,H,s).size>0);
});
test('bawaan portrait dengan poni di atas tidak bertumpuk',()=>{
  for(const [W,H] of [[360,640],[360,740],[390,844],[412,915]]){const s={t:48,r:0,b:34,l:0};assert.equal(findOverlaps(defLayout(W,H,s),W,H,s).size,0,W+'x'+H);}
});
test('estSafe: poni kiri-kanan di landscape menjadi poni atas di portrait',()=>{
  const p=estSafe({t:0,r:48,b:21,l:48},'land','port');
  assert.equal(p.t,48);assert.equal(p.l,0);assert.equal(p.r,0);
  const l=estSafe({t:48,r:0,b:34,l:0},'port','land');
  assert.equal(l.l,48);assert.equal(l.r,48);assert.equal(l.t,0);
});
test('estSafe: tanpa poni tetap nol',()=>{
  assert.deepEqual(estSafe({t:0,r:0,b:0,l:0},'land','port'),{t:0,r:0,b:0,l:0});
});
test('separate merapikan tombol yang ditumpuk',()=>{
  const W=640,H=360,s={t:0,r:48,b:21,l:48},lay=defLayout(W,H,s);
  lay.tDash=Object.assign({},lay.tAtk);lay.tPower=Object.assign({},lay.tAtk);
  assert.ok(findOverlaps(lay,W,H,s).size>0);
  assert.equal(separate(lay,W,H,s),true);
  assert.equal(findOverlaps(lay,W,H,s).size,0);
  for(const id in CTRL){const r=ctlRect(id,lay[id],W,H,s);
    assert.ok(r.cx-r.hx>=s.l-.01&&r.cx+r.hx<=W-s.r+.01&&r.cy-r.hy>=s.t-.01&&r.cy+r.hy<=H-s.b+.01,id+' di dalam area aman');}
});
test('snapPx',()=>{assert.equal(snapPx(13,true),16);assert.equal(snapPx(13,false),13);assert.equal(snapPx(11,true),8);});
test('groupDeltaLimits menjaga semua tombol di dalam layar',()=>{
  const W=640,H=360,s={t:0,r:48,b:21,l:48},lay=defLayout(W,H,s),lim=groupDeltaLimits(lay,W,H,s);
  assert.ok(lim.x0<=0&&lim.x1>=0&&lim.y0<=0&&lim.y1>=0);
  for(const id in lay){lay[id].x+=lim.x1/W;}
  for(const id in CTRL){const r=ctlRect(id,lay[id],W,H,s);assert.ok(r.cx+r.hx<=W-s.r+.01,id);}
});
