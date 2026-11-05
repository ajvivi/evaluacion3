export function inside(p,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes}return yes}
export function area(points){return Math.abs(points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a.x*b.y-b.x*a.y},0))/2}
export function bounds(points){const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}}
export function position(event,rect,width,height){return{x:Math.max(0,Math.min(width,(event.clientX-rect.left)*width/rect.width)),y:Math.max(0,Math.min(height,(event.clientY-rect.top)*height/rect.height))}}
