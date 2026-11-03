// Estimaciones sobre articulaciones, no segmentación del contorno de la uña.
export function nailPoses(hand,w,h,{size=1,offset=0}={}) {
 if(!hand||hand.length!==21||!hand.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return [];
 const palm=Math.hypot((hand[5].x-hand[17].x)*w,(hand[5].y-hand[17].y)*h);
 return [4,8,12,16,20].map((i,finger)=>{
  const tip=hand[i],dip=hand[i-1],pip=hand[i-2];
  const dx=(tip.x-dip.x)*w,dy=(tip.y-dip.y)*h,len=Math.hypot(dx,dy);
  const px=(dip.x-pip.x)*w,py=(dip.y-pip.y)*h,previous=Math.hypot(px,py);
  if(len<4||palm<18||tip.x<0||tip.x>1||tip.y<0||tip.y>1)return null;
  // Omitir segmentos muy plegados en la imagen. No distingue palma y dorso.
  if(previous>1&&(dx*px+dy*py)/(len*previous)<.1)return null;
  return {finger,x:tip.x*w-dx*(.32+offset),y:tip.y*h-dy*(.32+offset),angle:Math.atan2(dy,dx)+Math.PI/2,
   width:Math.min(len*(finger===0?.75:.65),palm*.18)*size,length:Math.min(len*1.05,palm*.3)*size};
 }).filter(Boolean);
}
export function smoothPoses(poses,previous=[],amount=.65){
 return poses.map(p=>{
  const old=previous.find(q=>q.finger===p.finger);
  if(!old||Math.hypot(p.x-old.x,p.y-old.y)>Math.max(40,p.length*2))return {...p};
  const blend=(a,b)=>a+(b-a)*amount;
  const angle=old.angle+Math.atan2(Math.sin(p.angle-old.angle),Math.cos(p.angle-old.angle))*amount;
  return {...p,x:blend(old.x,p.x),y:blend(old.y,p.y),width:blend(old.width,p.width),length:blend(old.length,p.length),angle};
 });
}
export function adjustPose(p,adjust){
 const c=adjust[p.finger];if(!c||!c.visible)return null;
 const lateral=c.side*p.width,axial=c.shift*p.length;
 return {...p,x:p.x+Math.cos(p.angle)*lateral-Math.sin(p.angle)*axial,
 y:p.y+Math.sin(p.angle)*lateral+Math.cos(p.angle)*axial,
 width:p.width*c.width,length:p.length*c.length,angle:p.angle+c.rotation*Math.PI/180};
}
export function handBounds(hands,w,h){const pts=hands.flat();if(!pts.length)return null;const xs=pts.map(p=>p.x*w),ys=pts.map(p=>p.y*h);const pad=Math.max(30,(Math.max(...xs)-Math.min(...xs))*.15);const x=Math.max(0,Math.min(...xs)-pad),y=Math.max(0,Math.min(...ys)-pad);return {x,y,w:Math.min(w,Math.max(...xs)+pad)-x,h:Math.min(h,Math.max(...ys)+pad)-y};}
