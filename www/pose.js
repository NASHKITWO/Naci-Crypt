/* Pose musuh: sprite depan (idle) atau samping (run). Fungsi murni supaya bisa dites di Node (test/pose.test.js).
   st = objek musuh ({front, frontHold} disimpan di sana). dyp = P.y - e.y, adx = |P.x - e.x|.
   - Histeresis: masuk pose depan butuh dyp > 1,2*adx, tetap di sana sampai dyp <= 0,8*adx.
   - Setelah berganti, pose bertahan minimal 0,4 detik (kecuali musuh mulai berjalan atau beku: langsung pose samping).
   Mengembalikan true bila pose berganti pada pemanggilan ini. */
const POSE_HOLD=.4;
function nextFront(st,dyp,adx,moving,frz,time){
  const want=!moving&&!frz&&(st.front?dyp>adx*.8:dyp>adx*1.2);
  if(want!==!!st.front&&(moving||frz||time>=(st.frontHold||0))){st.front=want;st.frontHold=time+POSE_HOLD;return true;}
  return false;
}
if(typeof module!=='undefined'&&module.exports)module.exports={POSE_HOLD,nextFront};
