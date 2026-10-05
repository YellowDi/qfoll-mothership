/**
 * [INPUT]: 依赖 Canvas 2D、React 生命周期、浏览器可见性与减少动态偏好
 * [OUTPUT]: 对外提供 ReactYgbPortBackground，渲染道路退界、堆场、码头吊机、船舶与昼夜港区背景
 * [POS]: React 云柜宝 Hero 的共享背景引擎；正式专题页、首页预览与独立原型共用同一空间模型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
/*
 * 港区场景是一个单一命令式 Canvas 绘制边界。其几何数组与绘制上下文
 * 来自已经验收的原型脚本；对外的 React 生命周期、主题和暂停契约仍保持严格类型。
 */
// @ts-nocheck
import { useEffect, useRef } from "react";
import { useTheme } from "../providers/ThemeProvider";

// Canvas 的几何绘制保持与原型一致；React 组件只负责生命周期、主题和暂停状态。
/* --- 材质：受同一光源约束；日间暖阳、冷色环境光，夜间保留材质而非纯黑 --- */
const palettes={
 day:{land:'#cfd9d8',water:'#759da9',waterDeep:'#517e91',road:'#71878b',curb:'#abbcbf',mark:'#e0e5dd',roof:'#eef0e6',wall:'#c4d3d1',shade:'#92abb3',glass:'#769cac',tree:'#699789',orange:'#d98e5b',cyan:'#74a7af',white:'#dce5db',truck:'#e87f46',cab:'#f0eee1',metal:'#768f99',yard:'#b9c5bd',parking:'#9daaaa',park:'#7da38d',path:'#d9d9c5',tank:'#c6c9b1'},
 night:{land:'#233339',water:'#102831',waterDeep:'#0c1d27',road:'#304048',curb:'#3e545c',mark:'#6c7f85',roof:'#4c5d62',wall:'#334b54',shade:'#243741',glass:'#b0baa0',tree:'#3e6659',orange:'#965e3e',cyan:'#3e717f',white:'#81958f',truck:'#c97e4b',cab:'#a7b8b3',metal:'#587880',yard:'#26383e',parking:'#28383c',park:'#426859',path:'#56665d',tank:'#68706a'}
};
const routes=[
 // 车辆只沿道路中心线循环，路线坐标与下方 streetsX / streetsY 保持同源。
 [[-740,-510],[860,-510],[860,130],[-740,130]],
 [[-100,-830],[1180,-830],[1180,-190],[-100,-190]],
 [[-1380,-190],[540,-190],[540,130],[-1380,130]],
 [[-1700,-1150],[-420,-1150],[-420,-830],[-1700,-830]]
];
function roundedRoute(points,r=31){
 const samples=[];
 for(let i=0;i<points.length;i++){
  const previous=points[(i+points.length-1)%points.length],p=points[i],next=points[(i+1)%points.length];
  const a=Math.hypot(previous[0]-p[0],previous[1]-p[1]),b=Math.hypot(next[0]-p[0],next[1]-p[1]);
  const entry=[p[0]+(previous[0]-p[0])*r/a,p[1]+(previous[1]-p[1])*r/a],exit=[p[0]+(next[0]-p[0])*r/b,p[1]+(next[1]-p[1])*r/b];
  for(let j=0;j<=16;j++){const t=j/16,u=1-t;samples.push({x:u*u*entry[0]+2*u*t*p[0]+t*t*exit[0],y:u*u*entry[1]+2*u*t*p[1]+t*t*exit[1]});}
 }
 let length=0;for(let i=0;i<samples.length;i++){samples[i].distance=length;const n=samples[(i+1)%samples.length];length+=Math.hypot(n.x-samples[i].x,n.y-samples[i].y);}
 return{samples,length};
}
const paths=routes.map(points=>roundedRoute(points));
const serviceRoads=[
 [[-100,-510],[-70,-480],[-70,-440],[-40,-420]],
 [[220,-190],[250,-225]],
 [[540,-190],[575,-220],[590,-245]]
];
function position(route,distance){
 const d=((distance%route.length)+route.length)%route.length,s=route.samples;let i=0;
 while(i<s.length-1&&s[i+1].distance<d)i++;
 const a=s[i],b=s[(i+1)%s.length],t=(d-a.distance)/Math.hypot(b.x-a.x,b.y-a.y);
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)};
}
const fleet=Array.from({length:14},(_,i)=>({route:i%4,offset:i*233+80,speed:22+i%4*3,color:i%3}));
const buildings=[],trees=[],lamps=[],yards=[],parkingLots=[],parks=[],tanks=[];
const streetsX=Array.from({length:12},(_,i)=>-1700+i*320);
const streetsY=Array.from({length:10},(_,i)=>-2750+i*320);
const ROAD_CLEARANCE=23;
function intersectsRoad(x,y,w,d){return streetsX.some(line=>line>x-ROAD_CLEARANCE&&line<x+w+ROAD_CLEARANCE)||streetsY.some(line=>line>y-ROAD_CLEARANCE&&line<y+d+ROAD_CLEARANCE);}
function safeLot(x,y,w,d){return !intersectsRoad(x,y,w,d);}
function building(x,y,w,d,height,type=0){if(intersectsRoad(x,y,w,d))return;buildings.push({x,y,w,d,height,type});}
/* 港区采用“开阔堆场—少量仓库—城市边界”的真实密度，建筑不再铺满每个街区。 */
const warehouseBlocks=[
 [-680,-160,235,180,36],[600,-160,235,180,34],
 [-680,-470,235,180,31],[920,-470,235,180,30]
];
warehouseBlocks.forEach(([x,y,w,d,height])=>building(x,y,w,d,height,0));
const skylineBlocks=[
 [-40,-800,92,84,94],[280,-800,118,106,128],[600,-800,88,96,110],[920,-800,112,92,82],
 [600,-1120,96,88,136],[920,-1120,118,103,108],[1240,-1120,88,90,122]
];
skylineBlocks.forEach(([x,y,w,d,height])=>building(x,y,w,d,height,1));
const serviceBlocks=[[-360,-800,150,110,26]];
serviceBlocks.forEach(([x,y,w,d,height])=>building(x,y,w,d,height,0));
const addYard=(x,y,w,d,rows,cols)=>{
 if(!safeLot(x,y,w,d))return;
 yards.push({x,y,w,d,rows,cols});
};
addYard(-660,-800,210,220,4,4);addYard(-300,-140,170,120,3,4);addYard(250,-470,250,240,4,4);addYard(250,-1120,250,240,4,4);
parkingLots.push(...[
 {x:-40,y:-160,w:235,d:180},{x:280,y:-160,w:235,d:180},{x:-40,y:-470,w:235,d:180},{x:1240,y:-800,w:235,d:180}
].filter(({x,y,w,d})=>safeLot(x,y,w,d)));
parks.push(...[
 {x:-360,y:-470,w:235,d:180,pond:true},{x:600,y:-470,w:235,d:180,pond:false},{x:1240,y:-470,w:235,d:180,pond:true}
].filter(({x,y,w,d})=>safeLot(x,y,w,d)));
parks.forEach(({x,y,w,d})=>{for(let row=0;row<3;row++)for(let col=0;col<4;col++)trees.push([x+28+col*(w-56)/3,y+28+row*(d-56)/2]);});
for(const tank of [{x:330,y:-300,r:48,height:52},{x:475,y:-300,r:36,height:38}])if(safeLot(tank.x-tank.r,tank.y-tank.r,tank.r*2,tank.r*2))tanks.push(tank);
for(const y of streetsY)for(let x=-1910;x<1610;x+=110)lamps.push({x,y:y-23,height:30,kind:'street',direction:1});
for(const x of streetsX)for(let y=-3000;y<150;y+=110)lamps.push({x:x+23,y,height:30,kind:'street',direction:2});
for(let x=-1840;x<1600;x+=220)lamps.push({x,y:247,height:74,kind:'port',direction:0});
const cranes=Array.from({length:8},(_,i)=>({x:-1340+i*330,y:291,travel:18+(i%3)*5,phase:i*.72}));
const ships=[{x:-260,y:360,scale:1.18},{x:-650,y:360,scale:.7}];
const tone=(hex,f)=>{const n=parseInt(hex.slice(1),16);return`rgb(${[16,8,0].map(s=>Math.min(255,Math.round((n>>s&255)*f))).join(',')})`;};

/* --- 渲染边界：地面/光照、立体物件、车辆分层；静态对象缓存为局部精灵 --- */
class PortScene{
 constructor(canvas,dark){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.dark=dark;this.time=0;this.frame=0;this.last=0;this.visible=true;this.paused=false;
  this.ground=document.createElement('canvas');this.motion=matchMedia('(prefers-reduced-motion: reduce)');
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  this.intersection=new IntersectionObserver(([entry])=>{this.visible=entry.isIntersecting;this.clock();});this.intersection.observe(canvas);
  this.onVisibility=()=>this.clock();this.onMotion=()=>this.clock();
  document.addEventListener('visibilitychange',this.onVisibility);this.motion.addEventListener('change',this.onMotion);
  this.resize();this.clock();
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  this.w=rect.width;this.h=rect.height;this.dpr=Math.min(devicePixelRatio||1,2);
  for(const canvas of [this.canvas,this.ground]){canvas.width=Math.round(this.w*this.dpr);canvas.height=Math.round(this.h*this.dpr);}
  // 正交镜头固定；自适应画幅但不随车辆或鼠标摇晃。
  this.scale=Math.max(.64,Math.min(1.28,this.w/1250));this.cx=this.w*.55;this.cy=this.h*.54;
  this.rebuild();
 }
 p(x,y,z=0){return{x:this.cx+(x-y)*.74*this.scale,y:this.cy+(x+y)*.365*this.scale-z*this.scale};}
 shape(ctx,points){ctx.beginPath();points.forEach((p,i)=>{const q=this.p(...p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();}
 polygon(ctx,points,fill){this.shape(ctx,points);ctx.fillStyle=fill;ctx.fill();}
 line(ctx,points,color,width=1,dash=[]){ctx.beginPath();points.forEach((p,i)=>{const q=this.p(...p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=width*this.scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dash.map(d=>d*this.scale));ctx.stroke();ctx.setLineDash([]);}
 box(ctx,x,y,w,d,height,top,left,right,z=0){
  this.polygon(ctx,[[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+height],[x,y+d,z+height]],left);
  this.polygon(ctx,[[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+height],[x+w,y,z+height]],right);
  const corners=[[x,y,z+height],[x+w,y,z+height],[x+w,y+d,z+height],[x,y+d,z+height]];
  this.polygon(ctx,corners,top);
  this.line(ctx,[corners[3],corners[0],corners[1]],this.dark?'#b2d1d71a':'#ffffff88',.5);
 }
 ellipse(ctx,x,y,rx,ry,color){const p=this.p(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(p.x,p.y,rx*this.scale,ry*this.scale,0,0,Math.PI*2);ctx.fill();}
 radial(ctx,x,y,r,color,alpha=.24,ratio=.5,z=0){
  const p=this.p(x,y,z);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,ratio);
  const g=ctx.createRadialGradient(0,0,0,0,0,r*this.scale);g.addColorStop(0,`${color}${Math.round(alpha*255).toString(16).padStart(2,'0')}`);g.addColorStop(.36,`${color}${Math.round(alpha*92).toString(16).padStart(2,'0')}`);g.addColorStop(1,`${color}00`);
  ctx.fillStyle=g;ctx.fillRect(-r*this.scale,-r*this.scale,r*this.scale*2,r*this.scale*2);ctx.restore();
 }
 shadow(ctx,b){
  const {x,y,w,d,height}=b;if(this.dark)return;
  // 光从画面左上方入射，高物件产生更长的软影，近地面保留接触阴影。
  const dx=height*.63,dy=height*.42;
  ctx.save();ctx.filter=`blur(${1.8*this.scale}px)`;
  this.polygon(ctx,[[x,y+d],[x+w,y+d],[x+w,y],[x+w+dx,y+dy],[x+w+dx,y+d+dy],[x+dx,y+d+dy]],'#3959673b');ctx.restore();
  this.polygon(ctx,[[x+2,y+2],[x+w+3,y+2],[x+w+3,y+d+4],[x+2,y+d+4]],this.dark?'#050e154d':'#3f5c5930');
 }
 road(ctx,x,y,w,d){const c=this.c;
  this.polygon(ctx,[[x-3,y-3],[x+w+3,y-3],[x+w+3,y+d+3],[x-3,y+d+3]],c.curb);
  this.polygon(ctx,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],c.road);
  if(w>d)this.line(ctx,[[x,y+d/2,.2],[x+w,y+d/2,.2]],c.mark,.65,[7,12]);
  else this.line(ctx,[[x+w/2,y,.2],[x+w/2,y+d,.2]],c.mark,.65,[7,12]);
 }
 routeRoad(ctx,points,width=26){
  const c=this.c;
  this.line(ctx,points,c.curb,width+7);
  this.line(ctx,points,c.road,width);
  this.line(ctx,points,c.mark,.62,[7,12]);
 }
 drawIntersection(ctx,x,y){
  const c=this.c;
  // 路口用短斑马线和转角导流线打破“十字方块”，车辆仍沿原有中心线通过。
  for(const offset of [-13,0,13]){
   this.line(ctx,[[x+offset,y-29,.4],[x+offset,y-21,.4]],c.mark,1.05);
   this.line(ctx,[[x+offset,y+21,.4],[x+offset,y+29,.4]],c.mark,1.05);
   this.line(ctx,[[x-29,y+offset,.4],[x-21,y+offset,.4]],c.mark,1.05);
   this.line(ctx,[[x+21,y+offset,.4],[x+29,y+offset,.4]],c.mark,1.05);
  }
  this.line(ctx,[[x-34,y-34,.4],[x-22,y-42,.4],[x-8,y-42,.4]],this.dark?'#9bb7b75c':'#dce5daaa',.7);
  this.line(ctx,[[x+34,y+34,.4],[x+22,y+42,.4],[x+8,y+42,.4]],this.dark?'#9bb7b75c':'#dce5daaa',.7);
 }
 drawBuilding(ctx,b){
  const {x,y,w,d,height,type}=b,c=this.c;
  let top=c.roof,left=c.wall,right=c.shade;
  if(type>=2){top=[c.orange,c.cyan,c.white][type-2];left=tone(top,.83);right=tone(top,.67);}
  this.box(ctx,x,y,w,d,height,top,left,right);
  if(type===0){
   for(let a=14;a<w;a+=20)this.line(ctx,[[x+a,y+3,height+.1],[x+a,y+d-3,height+.1]],this.dark?'#c2dade10':'#8faaa642',.7);
   for(let a=16;a<w-10;a+=30){this.box(ctx,x+a,y+40,17,26,1.5,c.glass,c.wall,c.shade,height);this.polygon(ctx,[[x+a,y+d+.1,2],[x+a+17,y+d+.1,2],[x+a+17,y+d+.1,19],[x+a,y+d+.1,19]],this.dark?'#182a31':c.glass);}
   this.box(ctx,x+12,y+12,24,15,4,c.wall,c.shade,c.shade,height);
   if(this.dark)for(let a=14;a<w-10;a+=32)this.line(ctx,[[x+a,y+d+.3,24],[x+a+12,y+d+.3,24]],'#f6dda680',1.7);
  }else if(type===1){
   for(let z=9;z<height-6;z+=11)for(let a=7;a<w-5;a+=10){
    const lit=this.dark&&((Math.floor(a)+z+Math.floor(x))%7<4);
    this.polygon(ctx,[[x+a,y+d+.1,z],[x+a+5,y+d+.1,z],[x+a+5,y+d+.1,z+4],[x+a,y+d+.1,z+4]],lit?'#d8c190':this.dark?'#203842':c.glass);
   }
   for(let z=9;z<height-6;z+=11)this.line(ctx,[[x+w+.1,y+5,z],[x+w+.1,y+d-5,z]],this.dark?'#e1d4b16e':c.glass,1.7);
   this.box(ctx,x+10,y+12,w-20,d-28,5,c.wall,c.shade,c.shade,height);
  }else{
   for(let a=5;a<w-2;a+=5)this.line(ctx,[[x+a,y+d+.2,1],[x+a,y+d+.2,height-1]],this.dark?'#ffffff15':'#ffffff55',.55);
   for(let a=5;a<w-2;a+=5)this.line(ctx,[[x+a,y+1,height+.1],[x+a,y+d-1,height+.1]],this.dark?'#ffffff08':'#ffffff22',.35);
  }
 }
 crane(ctx,{x,y,travel=22,phase=0}){
  const c=this.c,metal=c.metal,beam=this.dark?'#946b4b':'#d79b6f';
  const shift=this.craneShift({travel,phase}),baseX=x+shift;
  const trolley=baseX+28+Math.sin(this.time*.72+phase*.8)*9;
  for(const offset of [0,56]){
   this.box(ctx,baseX+offset-6,y-2,17,19,5,c.wall,c.shade,c.shade);
   this.box(ctx,baseX+offset,y,5,14,89,metal,tone(metal,.8),tone(metal,.68));
   this.line(ctx,[[baseX+offset,y,5],[baseX+offset,y+15,81]],metal,1);
  }
  this.box(ctx,baseX-3,y-3,67,16,8,beam,tone(beam,.86),tone(beam,.66),89);
  this.line(ctx,[[trolley,y,97],[trolley,y+129,97]],metal,5);
  this.line(ctx,[[trolley,y,131],[trolley,y+127,97],[trolley,y,91],[trolley,y-31,97],[trolley,y,131]],metal,1.6);
  const loadY=y+36;
  this.line(ctx,[[trolley,loadY,97],[trolley,loadY,27]],this.dark?'#658794':'#556f7a',.75);
  this.box(ctx,trolley-12,loadY-6,24,13,3,beam,metal,metal,25);
  const loadColor=[c.orange,c.cyan,c.white][Math.floor((phase*3)%3)];
  this.box(ctx,trolley-10,loadY-5,20,11,8,loadColor,tone(loadColor,.82),tone(loadColor,.66),17);
  this.box(ctx,baseX+18,y+14,23,20,11,c.roof,c.wall,c.shade,80);
  if(this.dark){for(const offset of [0,56])this.lightHead(ctx,baseX+offset,y+8,97,'#ffe0ac',1.7);this.lightHead(ctx,trolley,y,132,'#fa8a69',1);}
 }
 craneShift({travel=22,phase=0}){return Math.sin(this.time*.48+phase)*travel;}
 tree(ctx,[x,y]){const c=this.c;this.box(ctx,x,y,2,2,11,c.tree,c.shade,c.shade);for(const [dx,dy,z,r] of [[0,0,15,7],[-4,3,14,5],[4,2,17,5]]){const p=this.p(x+dx,y+dy,z);const g=ctx.createRadialGradient(p.x-r*this.scale*.3,p.y-r*this.scale*.5,0,p.x,p.y,r*this.scale);g.addColorStop(0,this.dark?'#527969':'#85b29a');g.addColorStop(1,c.tree);ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r*this.scale,0,Math.PI*2);ctx.fill();}}
 lightHead(ctx,x,y,z,color,size=1.1){const p=this.p(x,y,z);this.radial(ctx,x,y,12,color,.19,1,z);ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,size*this.scale,0,Math.PI*2);ctx.fill();}
 lamp(ctx,lamp){
  const {x,y,height,kind,direction}=lamp,c=this.c;
  this.ellipse(ctx,x,y,3,1.8,this.dark?'#0e1f2880':'#6a7a6d35');
  this.line(ctx,[[x,y,0],[x,y,height]],this.dark?'#88a1a2':'#7b9193',kind==='port'?1.8:1.2);
  if(kind==='street'){
   const dx=direction===1?0:-13,dy=direction===1?13:0;
   this.line(ctx,[[x,y,height],[x+dx,y+dy,height+1]],c.metal,1.2);
   this.box(ctx,x+dx-2,y+dy-3,4,6,1.2,this.dark?'#d9c9a6':'#c5d0c9',c.metal,c.metal,height);
   if(this.dark)this.lightHead(ctx,x+dx,y+dy,height,'#ffdea4',1);
  }else{
   this.line(ctx,[[x-12,y,height],[x+12,y,height]],c.metal,2);
   for(const offset of [-10,0,10]){this.box(ctx,x+offset-2,y-2,4,5,3,c.roof,c.metal,c.shade,height);if(this.dark)this.lightHead(ctx,x+offset,y,height,'#fff1d0',1.4);}
  }
 }
 yard(ctx,{x,y,w,d,rows=3,cols=4}){
  const c=this.c;
  this.polygon(ctx,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],c.yard);
  this.line(ctx,[[x,y],[x+w,y],[x+w,y+d],[x,y+d],[x,y]],this.dark?'#b1c3bd42':'#788e8e70',1);
  for(let offset=32;offset<w;offset+=75)this.line(ctx,[[x+offset,y+12],[x+offset,y+d-12]],this.dark?'#66818a38':'#eef0df70',.7,[5,7]);
  for(let offset=30;offset<d;offset+=74)this.line(ctx,[[x+12,y+offset],[x+w-12,y+offset]],this.dark?'#66818a28':'#eef0df55',.7,[8,8]);
  this.line(ctx,[[x+13,y+d-28],[x+w-13,y+d-28]],c.orange,1.4,[4,5]);
  for(let offset=18;offset<w-10;offset+=42){
   this.box(ctx,x+offset,y-2,2,3,4,c.metal,tone(c.metal,.82),tone(c.metal,.68),1);
   this.box(ctx,x+offset,y+d-1,2,3,4,c.metal,tone(c.metal,.82),tone(c.metal,.68),1);
  }
  // 集装箱只在堆场内生成，留出四周安全退界，不会落到道路或建筑屋顶。
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const stackX=x+24+col*((w-48)/cols),stackY=y+24+row*((d-48)/rows);
   const stackW=Math.max(30,(w-78)/cols),stackD=Math.max(12,(d-72)/rows*.62),height=12+(col+row)%3*8;
   const color=[c.orange,c.cyan,c.white][(col+2*row)%3];
   this.box(ctx,stackX,stackY,stackW,stackD,height,color,tone(color,.83),tone(color,.68),1);
  }
 }
 parking(ctx,{x,y,w,d}){
  const c=this.c;
  this.polygon(ctx,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],c.parking);
  this.line(ctx,[[x,y],[x+w,y],[x+w,y+d],[x,y+d],[x,y]],this.dark?'#c6d1c145':'#7c8d8d62',1);
  for(let offset=18;offset<w-12;offset+=27)this.line(ctx,[[x+offset,y+14],[x+offset,y+d-14]],this.dark?'#d3c99d7a':'#fbf3d8e5',1.15);
  for(let row=0;row<2;row++)for(let col=0;col<Math.floor(w/55);col++){
   const px=x+20+col*55,py=y+25+row*(d-55);
   this.box(ctx,px,py,22,9,3,row%2?c.cyan:c.orange,tone(row%2?c.cyan:c.orange,.82),tone(row%2?c.cyan:c.orange,.67),1);
  }
 }
 park(ctx,{x,y,w,d,pond}){
  const c=this.c;
  this.polygon(ctx,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],c.park);
  this.line(ctx,[[x,y],[x+w,y],[x+w,y+d],[x,y+d],[x,y]],this.dark?'#bad4bd30':'#5e8b7355',1);
  this.line(ctx,[[x+w*.16,y+d*.82],[x+w*.5,y+d*.18],[x+w*.86,y+d*.72]],c.path,8);
  this.line(ctx,[[x+w*.1,y+d*.38],[x+w*.45,y+d*.72],[x+w*.88,y+d*.28]],c.path,5);
  if(pond){
   this.polygon(ctx,[[x+w*.55,y+d*.24],[x+w*.79,y+d*.29],[x+w*.86,y+d*.51],[x+w*.69,y+d*.65],[x+w*.49,y+d*.54]],this.dark?'#28556a':'#75aab1');
   this.line(ctx,[[x+w*.56,y+d*.35],[x+w*.78,y+d*.4]],this.dark?'#9fd3d565':'#d8f0ea80',1);
  }
 }
 tank(ctx,{x,y,r,height}){
  const c=this.c,segments=24,base=[],top=[];
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;base.push([x+Math.cos(a)*r,y+Math.sin(a)*r,0]);top.push([x+Math.cos(a)*r,y+Math.sin(a)*r,height]);}
  for(let i=0;i<segments;i++){
   const next=(i+1)%segments, shade=i<segments/2?tone(c.tank,.82):tone(c.tank,.67);
   this.polygon(ctx,[base[i],base[next],top[next],top[i]],shade);
  }
  this.polygon(ctx,top,c.tank);this.line(ctx,[top[0],top[6],top[12],top[18],top[0]],this.dark?'#dfd2a742':'#ffffff85',.9);
  this.line(ctx,[[x,y,height],[x,y,height+13]],c.metal,1.2);
  this.box(ctx,x-6,y-5,12,10,2,c.metal,tone(c.metal,.82),tone(c.metal,.65),height+3);
  if(this.dark){this.lightHead(ctx,x,y,height+15,'#ffe5ae',1.2);this.radial(ctx,x,y,32,'#ffe0a0',.18,.45,height+1);}
 }
 ship(ctx,{x,y,scale=1}){const c=this.c;
  const deckHeight=24;
  const outline=[[-58,-42],[232,-42],[284,-28],[326,0],[284,28],[232,42],[-58,42],[-84,18],[-84,-18]].map(([dx,dy,z])=>[x+dx*scale,y+dy*scale,z+deckHeight]);
  const base=outline.map(([px,py])=>[px,py,4]);
  this.polygon(ctx,base,this.dark?'#071419':'#385965');
  this.polygon(ctx,[outline[0],outline[1],outline[2],outline[3],base[3],base[2],base[1],base[0]],this.dark?'#102a35':'#5b777d');
  this.polygon(ctx,[outline[3],outline[4],outline[5],outline[6],outline[7],outline[8],base[8],base[7],base[6],base[5],base[4],base[3]],this.dark?'#1d4350':'#76949a');
  this.polygon(ctx,outline,this.dark?'#5b706d':'#b9c4b5');
  this.line(ctx,[outline[0],outline[1],outline[2],outline[3],outline[4],outline[5],outline[6]],this.dark?'#d4d5b538':'#ffffffb5',.8);
  this.line(ctx,[[x-77*scale,y+22*scale,7],[x+235*scale,y+22*scale,7],[x+286*scale,y+7*scale,7]],this.dark?'#e09b624d':'#e9e6cb',1.5);
  for(let col=0;col<7;col++)for(let row=0;row<2;row++){
   const cx=x+(-36+col*39)*scale,cy=y+(-24+row*25)*scale,height=16+(col+row)%3*5;
   const color=[c.orange,c.cyan,c.white][(col+row)%3];this.box(ctx,cx,cy,31*scale,18*scale,height,color,tone(color,.82),tone(color,.66),deckHeight);
  }
  this.box(ctx,x+205*scale,y-21*scale,45*scale,40*scale,37,c.roof,c.wall,c.shade,deckHeight);
  this.box(ctx,x+213*scale,y-14*scale,25*scale,19*scale,12,c.glass,c.wall,c.shade,deckHeight+37);
  this.line(ctx,[[x+227*scale,y-8*scale,deckHeight+50],[x+227*scale,y-8*scale,deckHeight+75]],c.metal,1.1);
  this.line(ctx,[[x+227*scale,y-8*scale,deckHeight+74],[x+244*scale,y-8*scale,deckHeight+74]],c.metal,.8);
  if(this.dark){
   this.lightHead(ctx,x+287*scale,y,deckHeight+4,'#d5e6c0',1.2);this.lightHead(ctx,x+225*scale,y-17*scale,deckHeight+43,'#ffdea4',1.4);
   for(const offset of [18,104,188])this.lightHead(ctx,x+offset*scale,y-31*scale,deckHeight+7,'#ffe1a2',.8);
  }
 }
 rebuild(){
  if(!this.w)return;this.c=palettes[this.dark?'night':'day'];const c=this.c,ctx=this.ground.getContext('2d');ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.w,this.h);
  // 全画幅先铺地面和海面，画面边界不会露出空白或独立底座。
  const land=ctx.createLinearGradient(0,0,this.w,this.h);land.addColorStop(0,this.dark?'#1c2b31':'#e1e5da');land.addColorStop(1,c.land);ctx.fillStyle=land;ctx.fillRect(0,0,this.w,this.h);
  const sea=ctx.createLinearGradient(0,0,this.w,this.h);sea.addColorStop(0,c.water);sea.addColorStop(1,c.waterDeep);this.polygon(ctx,[[-7000,322],[7000,322],[7000,8000],[-7000,8000]],sea);
  for(const yard of yards)this.yard(ctx,yard);
  for(const lot of parkingLots)this.parking(ctx,lot);
  for(const park of parks)this.park(ctx,park);
  this.box(ctx,-7000,290,14000,33,11,c.land,c.curb,c.shade,-11);
  for(const y of streetsY)this.road(ctx,-2400,y-18,4700,36);
  for(const x of streetsX)this.road(ctx,x-18,-3350,36,3560);
  for(const y of streetsY)for(const x of streetsX)this.polygon(ctx,[[x-18,y-18],[x+18,y-18],[x+18,y+18],[x-18,y+18]],c.road);
  for(const y of streetsY)for(const x of streetsX)if(this.isVisible(x,y,0,520))this.drawIntersection(ctx,x,y);
  for(const path of serviceRoads)this.routeRoad(ctx,path,15);
  this.road(ctx,-2400,246,4700,29);
  for(let x=-2300;x<2100;x+=24)this.polygon(ctx,[[x,312],[x+11,312],[x+15,319],[x+4,319]],c.orange);
  for(let x=-2300;x<2100;x+=85){this.box(ctx,x,320,6,7,4,c.metal,c.shade,c.shade);this.line(ctx,[[x,299],[x+29,299]],this.dark?'#77897c':'#efe5b7',.7);}
  for(let y=356;y<1900;y+=24)for(let x=-2100;x<1900;x+=86)this.line(ctx,[[x,y],[x+21+(x%11),y]],this.dark?'#68858b11':'#d8ecdf24',.65);
  // 岸桥两条轨道固定在码头内侧，吊机只沿轨道做小幅横移。
  for(const crane of cranes){
   this.line(ctx,[[crane.x-92,crane.y+16,1],[crane.x+150,crane.y+16,1]],this.dark?'#9bb6b852':'#607b8268',1.15);
   this.line(ctx,[[crane.x-92,crane.y+34,1],[crane.x+150,crane.y+34,1]],this.dark?'#9bb6b852':'#607b8268',1.15);
  }
  // 太阳投影先于建筑绘制；灯池也在地面层，避免穿透屋顶。
  this.visibleBuildings=buildings.filter(b=>this.isVisible(b.x+b.w/2,b.y+b.d/2,b.height,210));
  for(const b of this.visibleBuildings)this.shadow(ctx,b);
  this.visibleLamps=lamps.filter(l=>this.isVisible(l.x,l.y,l.height,100));
  if(this.dark){
   ctx.save();ctx.globalCompositeOperation='screen';
   for(const l of this.visibleLamps){
    const port=l.kind==='port';this.radial(ctx,l.x+(port?0:l.direction===2?-10:0),l.y+(port?-30:l.direction===1?10:0),port?99:38,port?'#fff0cf':'#ffd292',port?.32:.44,.5);
   }
   for(const b of this.visibleBuildings)if(b.type===0)for(let x=b.x+24;x<b.x+b.w-10;x+=44)this.radial(ctx,x,b.y+b.d+8,22,'#ffde9a',.12,.5);
   ctx.restore();
  }
  this.visibleCranes=cranes.filter(v=>this.isVisible(v.x,v.y,132,130));
  this.objects=[...this.visibleBuildings.map(b=>({depth:b.x+b.y+(b.w+b.d)/2,x:b.x,y:b.y,kind:'building',value:b})),...trees.filter(([x,y])=>this.isVisible(x,y,20,20)).map(v=>({depth:v[0]+v[1],x:v[0],y:v[1],kind:'tree',value:v})),...this.visibleLamps.map(v=>({depth:v.x+v.y,x:v.x,y:v.y,kind:'lamp',value:v})),...tanks.filter(v=>this.isVisible(v.x,v.y,v.height,130)).map(v=>({depth:v.x+v.y+v.r,x:v.x,y:v.y,kind:'tank',value:v})),...ships.filter(v=>this.isVisible(v.x,v.y,42,280)).map(v=>({depth:v.x+v.y+120,x:v.x,y:v.y,kind:'ship',value:v}))];
  this.sprites=this.objects.map(object=>this.sprite(object));this.draw();
 }
 isVisible(x,y,z=0,margin=80){const p=this.p(x,y,z);return p.x>-margin&&p.x<this.w+margin&&p.y>-margin&&p.y<this.h+margin;}
 sprite(object){
  // 精灵围住物件投影，画布只存局部像素；车辆与静态物件按深度交织，保持遮挡。
  const margin=object.kind==='building'?240:object.kind==='ship'?340:object.kind==='tank'?150:170;
  const p=this.p(object.x,object.y);const left=Math.floor(p.x-margin*this.scale),top=Math.floor(p.y-margin*this.scale);
  const sprite=document.createElement('canvas');sprite.width=Math.ceil(margin*this.scale*2*this.dpr);sprite.height=sprite.width;
  const ctx=sprite.getContext('2d');ctx.setTransform(this.dpr,0,0,this.dpr,-left*this.dpr,-top*this.dpr);
  if(object.kind==='building')this.drawBuilding(ctx,object.value);else if(object.kind==='tree')this.tree(ctx,object.value);else if(object.kind==='lamp')this.lamp(ctx,object.value);else if(object.kind==='tank')this.tank(ctx,object.value);else if(object.kind==='crane')this.crane(ctx,object.value);else this.ship(ctx,object.value);
  return{canvas:sprite,left,top,size:sprite.width/this.dpr,depth:object.depth};
 }
 truck(ctx,truck){
  const p=position(paths[truck.route],truck.offset+this.time*truck.speed),cos=Math.cos(p.angle),sin=Math.sin(p.angle);
  const local=(x,y,z=0)=>[p.x+x*cos-y*sin,p.y+x*sin+y*cos,z];const poly=(points,fill)=>this.polygon(ctx,points.map(point=>local(...point)),fill);
  const box=(x,y,w,d,height,top,side,end,z=0)=>{poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+height],[x,y+d,z+height]],side);poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+height],[x+w,y,z+height]],end);poly([[x,y,z+height],[x+w,y,z+height],[x+w,y+d,z+height],[x,y+d,z+height]],top);};
  poly([[-18,-6],[18,-6],[22,9],[-15,9]],this.dark?'#04111985':'#2d484943');
  if(this.dark){
   ctx.save();ctx.globalCompositeOperation='screen';
   for(const y of [-3.3,3.3]){const start=this.p(...local(17,y,1)),end=this.p(...local(60,y*3,1)),g=ctx.createLinearGradient(start.x,start.y,end.x,end.y);g.addColorStop(0,'#fff1c26a');g.addColorStop(.4,'#fff1c222');g.addColorStop(1,'#fff1c200');poly([[17,y-1,1],[63,y-11,1],[68,y+11,1],[17,y+1,1]],g);}
   ctx.restore();
  }
  box(-17,-5,31,10,2,'#3e555d','#263d46','#172b35',2);
  for(const x of [-14,-7,12])for(const y of [-6,4.5])box(x,y,3,1.5,4,'#364650','#1a2b34','#122430');
  const color=[this.c.truck,this.c.cyan,this.c.white][truck.color];box(-17,-5,23,10,10,color,tone(color,.82),tone(color,.66),5);
  for(let x=-14;x<5;x+=3)this.line(ctx,[local(x,5.1,6),local(x,5.1,14)],this.dark?'#ffffff25':'#ffffff60',.5);
  box(7,-5,10,10,8,this.c.cab,tone(this.c.cab,.85),tone(this.c.cab,.72),4);
  poly([[12,-4,12.1],[16,-4,12.1],[16,4,12.1],[12,4,12.1]],this.c.glass);
  poly([[17.1,-4,9],[17.1,4,9],[17.1,4,11],[17.1,-4,11]],this.c.glass);
  for(const y of [-3.4,2.4]){box(17,y,1,1.2,1,this.dark?'#ffe9b0':'#f5f4e6','#eee7b9','#eee7b9',5);if(this.dark){const point=local(17,y,5);this.lightHead(ctx,...point,'#ffe9ba',.7);}}
  for(const y of [-3.5,3.5]){const q=this.p(...local(-17,y,5));ctx.fillStyle=this.dark?'#f27550':'#b94f35';ctx.fillRect(q.x-.7*this.scale,q.y-.5*this.scale,1.4*this.scale,this.scale);}
 }
 waterReflections(ctx){
  if(!this.dark)return;ctx.save();ctx.globalCompositeOperation='screen';
  // 灯下的反光被水面切成细碎亮带，且不越过岸线。
  this.shape(ctx,[[-7000,324],[7000,324],[7000,6000],[-7000,6000]]);ctx.clip();
  for(const lamp of this.visibleLamps.filter(l=>l.kind==='port'))for(let i=0;i<20;i++){
   const y=337+i*7,x=lamp.x+Math.sin(i*2.31+this.time*.52)*9,fade=(1-i/20)*.24;
   this.line(ctx,[[x-4-i*.35,y],[x+8+i*.35,y]],`rgba(242,211,147,${fade})`,.7);
  }
  ctx.restore();
 }
 draw(){
  if(!this.w)return;const ctx=this.ctx;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.w,this.h);ctx.drawImage(this.ground,0,0,this.w,this.h);
  this.waterReflections(ctx);
  // 地图保留物流路线，但不添加新的浮层、数字、文案或卡片。
  const route=paths[0].samples.map(p=>[p.x,p.y,.3]);route.push(route[0]);this.line(ctx,route,this.dark?'#f6a56545':'#dc874440',1.2);
  const flow=position(paths[0],this.time*32);this.radial(ctx,flow.x,flow.y,7,this.dark?'#eaaa64':'#df9257',.35,1);
  const traffic=fleet.map(truck=>{const p=position(paths[truck.route],truck.offset+this.time*truck.speed);return{truck,depth:p.x+p.y};});
  const craneItems=this.visibleCranes.map(crane=>({crane,depth:crane.x+crane.y+48+this.craneShift(crane)}));
  const order=[...this.sprites.map(sprite=>({sprite,depth:sprite.depth})),...craneItems,...traffic].sort((a,b)=>a.depth-b.depth);
  for(const item of order){
   if(item.sprite){const s=item.sprite;ctx.drawImage(s.canvas,s.left,s.top,s.size,s.size);}
   else if(item.crane)this.crane(ctx,item.crane);
   else this.truck(ctx,item.truck);
  }
  // 统一的环境光和空气透视位于场景内，正文保护仍由原 Hero 蒙层负责。
  const ambience=ctx.createLinearGradient(0,0,this.w,this.h);
  if(this.dark){ambience.addColorStop(0,'#9acde00b');ambience.addColorStop(1,'#020c161d');}else{ambience.addColorStop(0,'#fff8da25');ambience.addColorStop(.55,'#fff9e30a');ambience.addColorStop(1,'#567c9812');}
  ctx.fillStyle=ambience;ctx.fillRect(0,0,this.w,this.h);
 }
 setTheme(dark){if(this.dark===dark)return;this.dark=dark;this.rebuild();}
 setPaused(paused){this.paused=paused;this.clock();}
 clock(){
  cancelAnimationFrame(this.frame);this.frame=0;this.last=0;this.draw();
  if(this.paused||this.motion.matches||document.hidden||!this.visible)return;
  const tick=now=>{if(this.last)this.time+=Math.min((now-this.last)/1000,.05);this.last=now;this.draw();this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
 }
 dispose(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.intersection.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);this.motion.removeEventListener('change',this.onMotion);this.sprites=[];}
}

export interface ReactYgbPortBackgroundProps {
  isDark?: boolean;
  paused?: boolean;
  className?: string;
}

export function ReactYgbPortBackground({ isDark, paused = false, className = "block h-full w-full" }: ReactYgbPortBackgroundProps) {
  const theme = useTheme();
  const dark = isDark ?? theme.isDark;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PortScene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new PortScene(canvasRef.current, dark);
    sceneRef.current = scene;
    scene.setPaused(paused);
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);
  useEffect(() => sceneRef.current?.setTheme(dark), [dark]);
  useEffect(() => sceneRef.current?.setPaused(paused), [paused]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
