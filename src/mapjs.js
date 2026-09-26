// Map (Leaflet, ไม่มี tile พื้นหลัง ใช้ขอบเขตเขต/อำเภอจริง)
const BKK_ZONE = {
  "กทม. เหนือ":["บางเขน","สายไหม","ดอนเมือง","หลักสี่","จตุจักร"],
  "กทม. ตะวันออก":["หนองจอก","ลาดกระบัง","คันนายาว","สวนหลวง","บางกะปิ","คลองสามวา","มีนบุรี"],
  "กทม. ฝั่งธนบุรี":["ตลิ่งชัน","บางแค","ภาษีเจริญ","ธนบุรี","ทวีวัฒนา","หนองแขม","บางบอน","บางขุนเทียน","จอมทอง","ราษฎร์บูรณะ","ทุ่งครุ","บางกอกน้อย","บางกอกใหญ่","บางพลัด","คลองสาน"]
};
const DECLARED = ["หนองจอก","สวนหลวง","คันนายาว"];
const zoneByName = n => ZONES.find(z=>z.name===n);
function zoneOf(pr){
  if(pr.pc!=="10") return zoneByName(pr.p);
  for(const [z,list] of Object.entries(BKK_ZONE)) if(list.includes(pr.a)) return zoneByName(z);
  return zoneByName("กทม. ชั้นใน-ใต้");
}
const SC = {crit:["--crit","--critSoft"],high:["--high","--highSoft"],watch:["--watch","--watchSoft"],ok:["--ok","--okSoft"]};
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const lvHex = p => css(p>100?"--crit":p>=70?"--high":"--ok");

// พิกัดจุดถนนโดยประมาณ (ลำดับตรงกับ ROADS_A / ROADS_B)
const ROADS_A_LL = [[13.7263,100.5857],[13.8558,100.5530],[13.8262,100.5628],[13.7556,100.6186],[13.7244,100.7282],[13.8375,100.5796],[13.8830,100.5660]];
const ROADS_B_LL = [[13.8456,100.5700],[13.8150,100.6210],[13.6683,100.6130],[13.9170,100.6480],[13.8890,100.6180],[13.9050,100.6600],[13.8729,100.5968],[13.8560,100.5410],[13.9110,100.5460],[13.9130,100.4240]];
const ROADS_ALL = [
  ...ROADS_A.map(([r,w],i)=>({r,w,d:"รถเล็กห้ามผ่าน",c:"c",ll:ROADS_A_LL[i],src:"ศูนย์ป้องกันน้ำท่วม กทม. 26 ก.ย."})),
  ...ROADS_B.map(([r,w,d,c],i)=>({r,w,d,c,ll:ROADS_B_LL[i],src:"รายงานสื่อ 25 ก.ย. เย็น"}))
];
const RC = {c:"--crit",h:"--high",w:"--watch"};

let map, distLayer, wlLayer, rainLayer, roadLayer;
const distByKey = {};

function distPopup(pr){
  const z=zoneOf(pr);
  const rains=DATA.rain.filter(r=>r.a===pr.a && r.p===pr.p);
  const wls=DATA.wl.filter(w=>w.a===pr.a && w.p===pr.p);
  const roads=ROADS_ALL.filter(r=>r.w.includes(pr.a));
  const maxR=rains.length?Math.max(...rains.map(r=>r.r24||0)):null;
  const pre = pr.pc==="10" ? "เขต" : "อ.";
  let h=`<div class="pp"><h4>${pre}${esc(pr.a)}</h4><div class="sub">${esc(pr.p)} · กลุ่มพื้นที่ ${esc(z.name)}</div>`;
  h+=`<span class="pill s-${z.s}">${SLABEL[z.s]}</span>`;
  if(DECLARED.includes(pr.a)) h+=` <span class="pill s-crit">ประกาศเขตภัยพิบัติแล้ว 25 ก.ย.</span>`;
  if(maxR!=null) h+=`<div class="row"><span>ฝน 24 ชม. สูงสุด</span><b>${maxR} มม.</b></div>`;
  wls.forEach(w=>h+=`<div class="row"><span>${esc(w.n)}</span><b style="color:${lvHex(w.pct)}">${w.pct.toFixed(0)}%</b></div>`);
  roads.forEach(r=>h+=`<div class="row"><span>${esc(r.r)}</span><b style="color:${css(RC[r.c])}">${esc(r.d)}</b></div>`);
  if(maxR==null && !wls.length && !roads.length) h+=`<div class="row"><span class="muted">ไม่มีสถานีตรวจวัดในพื้นที่นี้</span></div>`;
  h+=`<div class="sub" style="margin:8px 0 0">ภาพรวมกลุ่มพื้นที่</div><ul>${z.pts.map(p=>`<li>${p}</li>`).join("")}</ul></div>`;
  return h;
}
function wlPopup(w){
  const d=w.prev!=null?w.wl-w.prev:0;
  const tr=Math.abs(d)<0.005?"คงที่":d>0?`▲ ขึ้น ${(d*100).toFixed(0)} ซม.`:`▼ ลง ${(-d*100).toFixed(0)} ซม.`;
  const st=w.pct>100?"ล้นตลิ่ง":w.pct>=70?"น้ำมาก":"ปกติ";
  const sc=w.pct>100?"crit":w.pct>=70?"high":"ok";
  return `<div class="pp"><h4>${esc(w.n)}</h4><div class="sub">สถานีวัดระดับน้ำ ${esc(w.code||"")} · ${esc(w.a)}, ${esc(shortProv(w.p))}</div>
    <span class="pill s-${sc}">${st} ${w.pct.toFixed(0)}%</span>
    <div class="meter"><i style="width:${Math.min(w.pct,130)/1.3}%;background:${lvHex(w.pct)}"></i></div>
    <div class="sub" style="margin:0 0 4px">เส้นดำ = ระดับตลิ่ง</div>
    <div class="row"><span>ระดับน้ำ</span><b>${w.wl.toFixed(2)} ม.รทก.</b></div>
    <div class="row"><span>ระดับตลิ่ง</span><b>${w.bank} ม.รทก.</b></div>
    <div class="row"><span>แนวโน้ม</span><b>${tr}</b></div>
    <div class="row"><span>เวลาวัด</span><b>${w.t.slice(8,10)}/${w.t.slice(5,7)} ${w.t.slice(11)} น.</b></div>
    ${!w.t.startsWith("2026-09-26")?`<div class="stale">ข้อมูลไม่อัปเดตตั้งแต่ ${w.t.slice(5,16)}</div>`:""}</div>`;
}
function rainPopup(r){
  const cls=r.r24>90?["crit","ฝนหนักมาก"]:r.r24>35?["high","ฝนหนัก"]:r.r24>10?["watch","ฝนปานกลาง"]:["ok","ฝนเล็กน้อย"];
  return `<div class="pp"><h4>${esc(r.n)}</h4><div class="sub">สถานีวัดฝน · ${esc(r.a)}, ${esc(shortProv(r.p))}</div>
    <span class="pill s-${cls[0]}">${cls[1]}</span>
    <div class="row"><span>ฝนสะสม 24 ชม.</span><b>${r.r24} มม.</b></div>
    ${r.r1!=null?`<div class="row"><span>ฝน 1 ชม. ล่าสุด</span><b>${r.r1} มม.</b></div>`:""}
    <div class="row"><span>เวลาวัด</span><b>${r.t.slice(11)} น.</b></div></div>`;
}
function roadPopup(r){
  return `<div class="pp"><h4>${esc(r.r)}</h4><div class="sub">${esc(r.w)} · ${esc(r.src)}</div>
    <span class="pill s-${{c:"crit",h:"high",w:"watch"}[r.c]}">${esc(r.d)}</span>
    <div class="sub" style="margin:6px 0 0">ตำแหน่งหมุดเป็นค่าประมาณ</div></div>`;
}

function distStyle(f){
  const z=zoneOf(f.properties), on=inProv(f.properties);
  const [s,soft]=SC[z.s];
  return {color:on?css(s):css("--line"),weight:on?1:0.6,opacity:on?.55:.8,fillColor:on?css(soft):css("--land"),fillOpacity:on?.9:1};
}

function buildMap(){
  map=L.map("map",{zoomSnap:0.25,attributionControl:true,scrollWheelZoom:false,minZoom:8,maxZoom:15});
  map.attributionControl.setPrefix(false).addAttribution("ขอบเขตปกครอง: OpenGISData-Thailand · ข้อมูลน้ำ: ThaiWater");
  map.on("focus",()=>map.scrollWheelZoom.enable());
  map.on("blur",()=>map.scrollWheelZoom.disable());
  distLayer=L.geoJSON(DIST,{style:distStyle,onEachFeature:(f,l)=>{
    const pr=f.properties; distByKey[pr.p+"|"+pr.a]=l;
    l.bindTooltip((pr.pc==="10"?"เขต":"อ.")+pr.a,{sticky:true,className:"dname",direction:"top"});
    l.bindPopup(()=>distPopup(pr),{maxWidth:300});
    l.on("mouseover",()=>l.setStyle({weight:2.5,opacity:1}));
    l.on("mouseout",()=>distLayer.resetStyle(l));
  }}).addTo(map);
  rainLayer=L.layerGroup().addTo(map);
  wlLayer=L.layerGroup().addTo(map);
  roadLayer=L.layerGroup().addTo(map);
  map.fitBounds(distLayer.getBounds(),{padding:[10,10]});
  [["#lyrWl",wlLayer],["#lyrRain",rainLayer],["#lyrRoad",roadLayer]].forEach(([id,lyr])=>{
    $(id).addEventListener("change",e=>e.target.checked?lyr.addTo(map):map.removeLayer(lyr));
  });
}

function renderMap(){
  if(!window.L){ $("#map").innerHTML='<p style="padding:20px">โหลดแผนที่ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p>'; return; }
  if(!map) buildMap();
  distLayer.setStyle(distStyle);
  rainLayer.clearLayers(); wlLayer.clearLayers(); roadLayer.clearLayers();
  const rc=css("--water");
  DATA.rain.filter(inProv).forEach(r=>{
    L.circleMarker([r.lat,r.lon],{radius:3+Math.sqrt(r.r24||0)*1.25,color:rc,weight:1,opacity:.6,fillColor:rc,fillOpacity:.14})
      .bindPopup(()=>rainPopup(r)).bindTooltip(`ฝน ${r.r24} มม.`,{className:"dname",direction:"top"}).addTo(rainLayer);
  });
  DATA.wl.filter(inProv).forEach(w=>{
    L.circleMarker([w.lat,w.lon],{radius:7,color:"#fff",weight:2,fillColor:lvHex(w.pct),fillOpacity:1})
      .bindPopup(()=>wlPopup(w)).bindTooltip(`${w.n} · ${w.pct.toFixed(0)}%`,{className:"dname",direction:"top"}).addTo(wlLayer);
  });
  ROADS_ALL.filter(r=>prov==="ทั้งหมด"||prov===(r.w==="นนทบุรี"?"นนทบุรี":"กรุงเทพมหานคร")).forEach(r=>{
    const icon=L.divIcon({className:"",html:`<div class="roadpin" style="background:${css(RC[r.c])}"></div>`,iconSize:[14,14],iconAnchor:[7,7]});
    L.marker(r.ll,{icon,keyboard:true,title:r.r}).bindPopup(()=>roadPopup(r)).addTo(roadLayer);
  });
  if(prov==="ทั้งหมด") map.fitBounds(distLayer.getBounds(),{padding:[10,10]});
  else{
    const ls=distLayer.getLayers().filter(l=>l.feature.properties.p===prov);
    if(ls.length) map.fitBounds(L.featureGroup(ls).getBounds(),{padding:[16,16]});
  }
}

// ปุ่ม "ดูบนแผนที่" ในการ์ดพื้นที่
function focusZone(name){
  if(!map) return;
  const ls=distLayer.getLayers().filter(l=>zoneOf(l.feature.properties).name===name);
  if(!ls.length) return;
  $("#mapSec").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  map.fitBounds(L.featureGroup(ls).getBounds(),{padding:[20,20]});
}
$("#zones").addEventListener("click",e=>{
  const b=e.target.closest("button[data-zone]"); if(b) focusZone(b.dataset.zone);
});
