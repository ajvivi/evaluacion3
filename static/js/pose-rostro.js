import * as THREE from 'three';
// Proyección ortográfica en píxeles. MediaPipe z es relativo, no profundidad métrica.
export function headPose(points, width, height, modelWidth, modelTop, settings) {
  const p=i=>new THREE.Vector3((points[i].x-.5)*width,(.5-points[i].y)*height,-points[i].z*width);
  const left=p(234),right=p(454),top=p(10),bottom=p(152);
  const x=right.clone().sub(left),faceWidth=x.length();
  if(!Number.isFinite(faceWidth)||faceWidth<25||modelWidth<=0)return null;
  x.normalize();
  const y=top.clone().sub(bottom);y.addScaledVector(x,-y.dot(x));
  if(y.length()<10)return null;
  y.normalize();const z=new THREE.Vector3().crossVectors(x,y).normalize();
  // Evitar inestabilidad en perfiles extremos o detecciones invertidas.
  if(z.z<.25)return null;
  const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
  const scale=faceWidth*settings.size/modelWidth;
  const position=top.clone().addScaledVector(y,faceWidth*settings.height-modelTop*scale)
    .addScaledVector(z,faceWidth*settings.depth);
  return {position,rotation,scale};
}
