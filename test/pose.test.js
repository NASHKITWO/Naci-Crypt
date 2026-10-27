const test=require('node:test'),assert=require('node:assert');
const {nextFront,POSE_HOLD}=require('../www/pose.js');
// Aturan lama (sebelum perbaikan): ambang tunggal, tanpa tahan.
const oldFront=(dyp,adx,moving,frz)=>!moving&&!frz&&dyp>adx*1.2;
function run(fn,steps){let sw=0,prev=null;for(const s of steps){const f=fn(s);if(prev!==null&&f!==prev)sw++;prev=f;}return sw;}
// pemain bergerak bolak-balik tepat di sekitar garis batas (dyp = 1,2*adx +- 4%), 60 fps selama 3 detik
const adx=100,steps=[];for(let i=0;i<180;i++)steps.push({t:i/60,dyp:adx*1.2*(1+(i%2?.04:-.04))});
test('tanpa histeresis musuh berkedip di garis batas (aturan lama)',()=>{
  assert.ok(run(s=>oldFront(s.dyp,adx,false,false),steps)>=100);
});
test('dengan histeresis dan tahan, pose tidak berkedip',()=>{
  const e={};assert.ok(run(s=>{nextFront(e,s.dyp,adx,false,false,s.t);return !!e.front;},steps)<=1);
});
test('pose depan bertahan sampai pemain benar-benar pindah ke samping',()=>{
  const e={};let t=0;nextFront(e,150,100,false,false,t);assert.equal(e.front,true);
  t+=1;nextFront(e,100,100,false,false,t);assert.equal(e.front,true,'masih di zona histeresis');
  t+=1;nextFront(e,70,100,false,false,t);assert.equal(e.front,false);
});
test('tidak boleh bolak-balik lebih cepat dari POSE_HOLD',()=>{
  const e={};nextFront(e,150,100,false,false,0);assert.equal(e.front,true);
  nextFront(e,10,100,false,false,.1);assert.equal(e.front,true,'masih ditahan');
  nextFront(e,10,100,false,false,POSE_HOLD+.01);assert.equal(e.front,false);
});
test('berjalan atau beku langsung kembali ke pose samping',()=>{
  const e={};nextFront(e,150,100,false,false,0);assert.equal(e.front,true);
  assert.equal(nextFront(e,150,100,true,false,.05),true);assert.equal(e.front,false);
  const f={};nextFront(f,150,100,false,false,0);nextFront(f,150,100,false,true,.05);assert.equal(f.front,false);
});
