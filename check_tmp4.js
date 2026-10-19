
const R_PER_CM=0.2;
let V=6,L=60,power=true,mode='free';
const $=id=>document.getElementById(id);
const sV=$('sV'),sL=$('sL'),nV=$('nV'),nL=$('nL');
let rows1=[],rows2=[];
let lawOpen=false;
let quizScore={1:null,2:null,3:null};
let qcScore={1:null,2:null};
let predictResult='(미실시)';
function R(){return +(L*R_PER_CM).toFixed(1);}
function I(){if(!power)return 0;const r=R();return r>0?V/r:0;}
function setMode(m){mode=m;['mFree','mV','mR'].forEach(id=>$(id).classList.remove('on'));
$(m==='free'?'mFree':m==='v'?'mV':'mR').classList.add('on');
if(m==='v'){L=60;sync();$('missionText').textContent='미션①: 길이를 60cm에 고정! 전압만 2→4→6→8V로 바꾸며 [표1에 기록]하세요.';}
else if(m==='r'){V=6;sync();$('missionText').textContent='미션②: 전압을 6V에 고정! 길이를 20→40→60→80cm로 바꾸며 [표2에 기록]하세요.';}
else{$('missionText').textContent='전원 스위치를 켜고, 전압 다이얼과 니크롬선 집게 위치를 바꿔 보세요. 집게를 직접 드래그해도 됩니다.';}}
function preset(v,l){V=v;L=l;sync();}
function togglePower(){power=!power;const b=$('swBtn');b.textContent=power?'● ON':'○ OFF';b.className=power?'onbtn':'offbtn';update();}
function sync(){sV.value=V;nV.value=V;sL.value=L;nL.value=L;update();}
sV.oninput=e=>{V=+e.target.value;sync();};
sL.oninput=e=>{L=+e.target.value;sync();};
nV.onchange=e=>{V=Math.max(0,Math.min(10,+e.target.value||0));sync();};
nL.onchange=e=>{L=Math.max(10,Math.min(100,Math.round(+e.target.value||10)));sync();};
// 자 눈금
(function(){const g=$('ticks');let h='';for(let c=0;c<=100;c+=10){const x=80+c*3;h+=`<line x1="${x}" y1="38" x2="${x}" y2="46" stroke="#64748b" stroke-width="2"/><text x="${x}" y="36" text-anchor="middle" font-size="8" fill="#64748b">${c}</text>`;}g.innerHTML=h;})();
// 집게 드래그
(function(){const clip=$('clipB'),svg=$('circuit');let drag=false;
function xToL(clientX){const r=svg.getBoundingClientRect();const x=(clientX-r.left)/r.width*460;let l=Math.round((x-80)/3);return Math.max(10,Math.min(100,l));}
clip.addEventListener('pointerdown',e=>{drag=true;clip.setPointerCapture(e.pointerId);e.preventDefault();});
clip.addEventListener('pointermove',e=>{if(!drag)return;L=xToL(e.clientX);sync();});
window.addEventListener('pointerup',()=>drag=false);})();
function update(){
const r=R(),i=I(),p=V*i;
$('oV').textContent=V.toFixed(1)+' V';$('oL').textContent=L+'cm · '+r+'Ω';
$('mV').textContent=(power?V:0).toFixed(1)+' V';$('mR').textContent=L+'cm·'+r+'Ω';
$('mI').textContent=i.toFixed(2)+' A';$('mP').textContent=p.toFixed(2)+' W';
$('calcLine').textContent='전압센서 '+(power?V:0).toFixed(1)+'V · 니크롬선 '+L+'cm(저항 '+r+'Ω) · 전류센서 '+i.toFixed(2)+'A'+(power?'':' (전원 OFF)');
$('voltLabel').textContent='ⓥ '+(power?V:0).toFixed(1)+'V';
$('ampLabel').textContent=i.toFixed(2)+'A';
$('psuLabel').textContent=V.toFixed(1)+'V';
$('psuLamp').setAttribute('fill',power?'#22c55e':'#475569');
$('warnBox').style.display=i>1.5?'block':'none';
// 니크롬선 길이 반영 — 집게B 위치가 바뀌면 실제 전류 경로(귀환선)도 함께 바뀜
const x2=80+L*3;
const n=$('nichrome');n.setAttribute('x2',x2);
$('clipB').querySelector('#clipPoly').setAttribute('points',`${x2},48 ${x2+10},60 ${x2},72`);
const cr=$('clipB').querySelector('rect');cr.setAttribute('x',x2-12);
const cl=$('clipLab');cl.setAttribute('x',x2);cl.textContent=L+'cm';
$('leadB').setAttribute('x1',x2);
$('leadB').setAttribute('x2',130+((x2-80)/300)*100);
// 귀환선: 집게B → (x2,110) → (420,110) — 전류는 이 선으로 돌아감
$('returnWire').setAttribute('points',`${x2},60 ${x2},110 420,110`);
$('jointC').setAttribute('cx',x2);
// 미사용 구간: 집게B → 380, 회색 점선 (연결 안 됨)
const dw=$('deadWire');dw.setAttribute('x1',x2);dw.setAttribute('x2',380);
const dl=$('deadLab');const deadLen=380-x2;
if(deadLen>70){dl.style.display='block';dl.setAttribute('x',(x2+380)/2);}else{dl.style.display='none';}
$('heatGlow').setAttribute('cx',(80+x2)/2);
$('heatGlow').setAttribute('opacity',power?Math.min(0.9,0.08+p/8).toFixed(2):0.05);
n.setAttribute('stroke',p>6&&power?'#b91c1c':p>2&&power?'#ef4444':'#f87171');
$('gRohm').textContent=R();$('gL').textContent=L;$('gVv').textContent=V.toFixed(1);
drawV(i);drawR(i);
}
// 전자 애니메이션 — 실제 전류 경로를 따라 이동 (미사용 구간에는 전자가 가지 않음)
// 경로: (40,240)→(40,60)→(80,60)→집게B(x2,60)→(x2,110)→(420,110)→(420,240)→복귀
const eG=$('electrons');const N=24;let pos=[];for(let k=0;k<N;k++)pos.push(k/N);
function effPoints(){const cx=80+L*3;return[[40,240],[40,60],[80,60],[cx,60],[cx,110],[420,110],[420,240]];}
function pathPoint(t){
const pts=effPoints();const segs=[];let total=0;
for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length];const len=Math.hypot(b[0]-a[0],b[1]-a[1]);segs.push(len);total+=len;}
let d=t*total;
for(let k=0;k<pts.length;k++){if(d<=segs[k]||k===pts.length-1){const a=pts[k],b=pts[(k+1)%pts.length];const f=segs[k]?d/segs[k]:0;return{x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f};}d-=segs[k];}
return{x:pts[0][0],y:pts[0][1]};}
(function(){for(let k=0;k<N;k++){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r','5.5');c.setAttribute('fill','#2563eb');c.setAttribute('stroke','#fff');c.setAttribute('stroke-width','2');eG.appendChild(c);}})();
let last=performance.now();
function tick(now){const dt=Math.min(0.05,(now-last)/1000);last=now;const i=I();
pos=pos.map(t=>(t+dt*0.22*(i/1.8))%1);
const d=eG.children;
for(let k=0;k<N;k++){const q=pathPoint(pos[k]);d[k].setAttribute('cx',q.x);d[k].setAttribute('cy',q.y);d[k].setAttribute('opacity',i<0.005?0.12:1);}
requestAnimationFrame(tick);}
requestAnimationFrame(tick);
function axes(ctx,W,H,xMin,xMax,yMax,xLab,yLab){
ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
const Lm=54,Rm=14,T=14,B=34,pw=W-Lm-Rm,ph=H-T-B;
ctx.strokeStyle='#0f172a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(Lm,T);ctx.lineTo(Lm,T+ph);ctx.lineTo(Lm+pw,T+ph);ctx.stroke();
ctx.fillStyle='#0f172a';ctx.font='12px sans-serif';
for(let g=0;g<=4;g++){const yv=yMax*g/4,y=T+ph-ph*g/4;ctx.strokeStyle='#e2e8f0';ctx.beginPath();ctx.moveTo(Lm,y);ctx.lineTo(Lm+pw,y);ctx.stroke();ctx.fillText(yv.toFixed(1),26,y+4);}
for(let g=0;g<=4;g++){const xv=xMin+(xMax-xMin)*g/4,x=Lm+pw*g/4;ctx.fillText(Math.round(xv),x-10,T+ph+18);}
ctx.fillText(xLab,Lm+pw-44,T+ph+30);
ctx.save();ctx.font='bold 13px sans-serif';ctx.translate(13,T+ph/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillText(yLab,0,0);ctx.restore();ctx.textAlign='left';
return{Lm,T,pw,ph};
}
function paintStrokes(ctx,strokes){ctx.save();ctx.strokeStyle='#dc2626';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
strokes.forEach(s=>{if(s.length<2)return;ctx.beginPath();s.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();});ctx.restore();}
function drawV(cur){const c=$('gV'),ctx=c.getContext('2d'),W=c.width,H=c.height;
const yMax=2.5;const{Lm,T,pw,ph}=axes(ctx,W,H,0,10,yMax,'전압(V)','전류(A)');
rows1.forEach(o=>{const x=Lm+pw*o.v/10,y=T+ph-ph*Math.min(1,o.i/yMax);ctx.fillStyle='#94a3b8';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();});
paintStrokes(ctx,strokesV);
const x=Lm+pw*V/10,y=T+ph-ph*Math.min(1,cur/yMax);
ctx.fillStyle='#facc15';ctx.strokeStyle='#0f172a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.fill();ctx.stroke();}
function drawR(cur){const c=$('gL2'),ctx=c.getContext('2d'),W=c.width,H=c.height;
const yMax=2.5,rMin=2,rMax=20;const{Lm,T,pw,ph}=axes(ctx,W,H,rMin,rMax,yMax,'저항(Ω)','전류(A)');
rows2.forEach(o=>{const x=Lm+pw*(o.r-rMin)/(rMax-rMin),y=T+ph-ph*Math.min(1,o.i/yMax);ctx.fillStyle='#94a3b8';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();});
paintStrokes(ctx,strokesR);
const x=Lm+pw*(R()-rMin)/(rMax-rMin),y=T+ph-ph*Math.min(1,cur/yMax);
ctx.fillStyle='#facc15';ctx.strokeStyle='#0f172a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.fill();ctx.stroke();}
// 학생 추세선 직접 그리기 (마우스·터치)
let drawModeV=false,drawModeR=false;
let strokesV=[],strokesR=[];
function toggleDraw(w){
if(w==='V'){drawModeV=!drawModeV;$('drawBtnV').textContent=drawModeV?'✏️ 추세선 그리기 끄기':'✏️ 추세선 그리기 켜기';$('gV').classList.toggle('drawing',drawModeV);}
else{drawModeR=!drawModeR;$('drawBtnR').textContent=drawModeR?'✏️ 추세선 그리기 끄기':'✏️ 추세선 그리기 켜기';$('gL2').classList.toggle('drawing',drawModeR);}}
function clearDraw(w){if(w==='V')strokesV=[];else strokesR=[];update();}
function toCanvas(cv,e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*cv.width,y:(e.clientY-r.top)/r.height*cv.height};}
function bindDraw(cv,which){
let cur=null;
cv.addEventListener('pointerdown',e=>{const on=which==='V'?drawModeV:drawModeR;if(!on)return;e.preventDefault();cv.setPointerCapture(e.pointerId);cur=[toCanvas(cv,e)];(which==='V'?strokesV:strokesR).push(cur);});
cv.addEventListener('pointermove',e=>{if(!cur)return;e.preventDefault();cur.push(toCanvas(cv,e));update();});
const end=()=>{cur=null;};
cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);}
// 기록
function addRecord(t){const r=R(),i=I();
const o={v:+V.toFixed(1),l:L,r:+r.toFixed(1),i:+i.toFixed(3),c:+(V/r).toFixed(3)};
if(t===1)rows1.push(o);else rows2.push(o);
renderRows();}
function rowHTML(o,k,t){const cShow=lawOpen?o.c:'?';const ok=lawOpen?(Math.abs(o.i-o.c)<0.02?'⭕':'❌'):'－';
return `<tr><td>${k+1}</td><td>${o.v}</td><td>${o.l}</td><td>${o.r}</td><td>${o.i}</td><td>${cShow}</td><td class="no-print"><button class="btn" onclick="delRow(${t},${k})">삭제</button></td></tr>`;}
function renderRows(){
const t1=$('tbody1'),t2=$('tbody2');
t1.innerHTML=rows1.length?rows1.map((o,k)=>rowHTML(o,k,1)).join(''):'<tr><td colspan="7" style="color:#64748b">기록 없음</td></tr>';
t2.innerHTML=rows2.length?rows2.map((o,k)=>rowHTML(o,k,2)).join(''):'<tr><td colspan="7" style="color:#64748b">기록 없음</td></tr>';
let msg='';
if(rows1.length>=2){const sameL=rows1.every(o=>o.l===rows1[0].l);msg+=`표1 ${rows1.length}개 ${sameL?'· 길이 고정 잘 됨! 전압↑→전류↑ 비례(직선) 확인.':'· 길이를 고정하고 다시 기록하면 비례가 더 잘 보여요.'} `;}
if(rows2.length>=2){const sameV=rows2.every(o=>o.v===rows2[0].v);msg+=`표2 ${rows2.length}개 ${sameV?'· 전압 고정 잘 됨! 길이↑(저항↑)→전류↓ 반비례(곡선) 확인.':'· 전압을 고정하고 다시 기록하면 반비례가 더 잘 보여요.'}`;}
if(msg)$('conclusion').textContent=msg;
update();
}
function delRow(t,k){if(t===1)rows1.splice(k,1);else rows2.splice(k,1);renderRows();}
function clearRecords(t){if(t===1)rows1=[];else rows2=[];renderRows();}
function openLaw(){
if(!rows1.length&&!rows2.length){$('lawResult').textContent='먼저 ④에서 표1·표2에 기록을 1개 이상씩 추가하세요.';return;}
lawOpen=true;renderRows();
let n=0,hit=0;rows1.concat(rows2).forEach(o=>{n++;if(Math.abs(o.i-o.c)<0.02)hit++;});
$('lawResult').innerHTML=`전체 ${n}개 중 <b>${hit}개 일치</b>! 전압÷저항이 전류센서 값과 같다는 식 <b>I = V ÷ R</b>이 자료로 확인됐어요. 이제 ⑦ 결론을 써 봅시다.`;
$('lawBtn').textContent='🔓 식 확인됨 — V÷R 칸 공개됨';}
function qc(n,ans){const ok=(n===1&&ans==='up')||(n===2&&ans==='down');qcScore[n]=ok;
const el=$('qcA'+n);
el.textContent=ok?(n===1?'⭕ 맞아요! 전압을 올리면 전류가 커져요.':'⭕ 맞아요! 길이가 길어지면(저항이 커지면) 전류가 작아져요.'):(n===1?'❌ 회로(③)에서 길이는 그대로 두고 전압만 올려보세요.':'❌ 회로(③)에서 전압은 그대로 두고 길이만 늘려보세요.');
el.style.color=ok?'green':'red';}
function checkPredict(){
const v=parseFloat($('pV').value),l=parseFloat($('pL').value),pi=parseFloat($('pI').value);
if(isNaN(v)||isNaN(l)||isNaN(pi)){$('pRes').textContent='세 칸을 모두 숫자로 입력하세요.';$('pRes').style.color='red';return;}
const r=+(l*R_PER_CM).toFixed(1),actual=+(v/r).toFixed(2);
$('pR').textContent=r;
const ok=Math.abs(pi-actual)<0.015;
predictResult=`조건 ${v}V·${l}cm(저항 ${r}Ω): 예측 ${pi}A → 실제 ${actual}A (${ok?'일치 ⭕':'불일치 ❌'})`;
$('pRes').textContent=(ok?'⭕ 정답! 식이 맞았어요. ':'❌ 아쉬워요. ⑥ 식으로 다시 계산해 보세요. ')+predictResult;
$('pRes').style.color=ok?'green':'red';}
function downloadCSV(){
if(!rows1.length&&!rows2.length){alert('먼저 기록을 추가하세요!');return;}
let s='구분,회차,전압(V),길이(cm),저항(Ω),전류(A),계산(V/R)\n';
rows1.forEach((o,k)=>s+=`탐구1,${k+1},${o.v},${o.l},${o.r},${o.i},${o.c}\n`);
rows2.forEach((o,k)=>s+=`탐구2,${k+1},${o.v},${o.l},${o.r},${o.i},${o.c}\n`);
const b=new Blob(['\ufeff'+s],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='옴의법칙_니크롬선_실험기록.csv';a.click();
}
function check(n,exp){
if(n===1){const v=parseFloat($('q1').value);const ok=Math.abs(v-exp)<0.01;quizScore[1]=ok;$('a1').textContent=ok?'⭕ 정답! 6÷12=0.5A':'❌ 다시 계산: 6÷12=?';$('a1').style.color=ok?'green':'red';}
if(n===2){const ok=exp==='half';quizScore[2]=ok;$('a2').textContent=ok?'⭕ 정답! 길이 2배=저항 2배 → 전류 절반':'❌ 땡! 길이가 길어지면(저항↑) 전류는 작아져요.';$('a2').style.color=ok?'green':'red';}
if(n===3){const ok=exp===1;quizScore[3]=ok;$('a3').textContent=ok?'⭕ 정답! 8÷8=1.0A, 8×1=8W':'❌ 8÷8을 다시 계산해 보세요.';$('a3').style.color=ok?'green':'red';}
}
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function tbl(arr){if(!arr.length)return '<p>기록 없음</p>';
return '<table><tr><th>회차</th><th>전압(V)</th><th>길이(cm)</th><th>저항(Ω)</th><th>전류(A)</th><th>V÷R</th></tr>'+arr.map((o,k)=>`<tr><td>${k+1}</td><td>${o.v}</td><td>${o.l}</td><td>${o.r}</td><td>${o.i}</td><td>${lawOpen?o.c:'?'}</td></tr>`).join('')+'</table>';}
function buildReport(doPrint){
const info=`${esc($('stuG').value)}학년 ${esc($('stuC').value)}반 ${esc($('stuN').value)}번 이름 ${esc($('stuName').value)} (${esc($('stuTeam').value)}) / ${esc($('stuDate').value||new Date().toLocaleDateString())}`;
const qTxt=`Q1(6V·60cm/12Ω→0.5A): ${quizScore[1]===null?'미응시':quizScore[1]?'정답':'오답'} / Q2(30→60cm→절반): ${quizScore[2]===null?'미응시':quizScore[2]?'정답':'오답'} / Q3(8V·40cm→1A·8W): ${quizScore[3]===null?'미응시':quizScore[3]?'정답':'오답'}`;
let gVimg='',gLimg='';
try{gVimg=$('gV').toDataURL();gLimg=$('gL2').toDataURL();}catch(e){}
const html=`<h1>옴의 법칙 실험 보고서 — 전원공급장치·센서·니크롬선</h1>
<p><b>제출자:</b> ${info}</p>
<h2>1. 실험 장치</h2>
<p>전원공급장치(0~10V) — 전류센서(직렬) — 니크롬선(10~100cm, R=0.2×L) — 전압센서(병렬). 현재 설정: ${V.toFixed(1)}V · ${L}cm(${R()}Ω) · ${I().toFixed(2)}A</p>
<h2>2. 가설 (실험 전에 작성)</h2><p><b>가설1(전압-전류 관계):</b> ${esc($('ansHyp1').value)||'(미작성)'}</p><p><b>가설2(저항-전류 관계):</b> ${esc($('ansHyp2').value)||'(미작성)'}</p>
<p><b>정성 관찰:</b> 관찰1(전압↑→전류?) ${qcScore[1]===null?'미응시':qcScore[1]?'정답':'오답'} / 관찰2(길이↑→전류?) ${qcScore[2]===null?'미응시':qcScore[2]?'정답':'오답'}</p>
<h2>3. 탐구1 — 길이 고정, 전압-전류 관계 (비례)</h2>${tbl(rows1)}
<p><b>관찰1:</b> ${esc($('ansObs1').value)||'(미작성)'}</p>
<h2>4. 탐구2 — 전압 고정, 저항-전류 관계 (길이를 바꾸어 저항을 바꿈, 반비례)</h2>${tbl(rows2)}
<p><b>관찰2:</b> ${esc($('ansObs2').value)||'(미작성)'}</p>
<h2>5. 그래프 (학생이 직접 그린 추세선 포함)</h2><p>${gVimg?`<img src="${gVimg}">`:''} ${gLimg?`<img src="${gLimg}">`:''}</p>
<h2>6. 식 만들기 (규칙1+규칙2 → I = V ÷ R)</h2><p>${lawOpen?'기록 전체 검증 완료 — V÷R 칸 공개됨':'식 미확인'}</p>
<h2>7. 결론</h2><p>${esc($('ansCon').value)||'(미작성)'}</p>
<h2>8. 적용 (새 조건 예측-확인)</h2><p>${esc(predictResult)}</p>
<h2>9. 확인 문제</h2><p>${qTxt}</p>
<p style="margin-top:16px">본인 서명: __________ &nbsp;&nbsp; 교사 평가: □매우잘함 □잘함 □보통 □노력요함 &nbsp; 의견: __________</p>`;
$('printReport').innerHTML=html;
$('screenPreview').innerHTML=html.replace(/<img[^>]*>/g,'[그래프 이미지 - 인쇄/PDF에 포함]');
if(doPrint){setTimeout(()=>window.print(),100);}
}
if(!$('stuDate').value)$('stuDate').value=new Date().toISOString().slice(0,10);
bindDraw($('gV'),'V');bindDraw($('gL2'),'R');
sync();renderRows();
