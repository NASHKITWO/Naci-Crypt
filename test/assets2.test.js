const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','www','assets2.js'),'utf8');
const A=new Function(src+';return ASSETS2;')();
test('assets2 berisi semua sheet',()=>{for(const k of ['dd','mini','crys','rpg'])assert.match(A.images[k],/^data:image\/png;base64,/);});
test('atlas RPG punya skin 5 level per senjata, orb, dan buku',()=>{
  for(const w of ['sword','spear','axe','staff'])for(let i=1;i<=5;i++)assert.ok(A.rpg.names.includes(w+i),w+i);
  for(const n of ['nova','petir','perisai','beku','book'])assert.ok(A.rpg.names.includes(n),n);
});
