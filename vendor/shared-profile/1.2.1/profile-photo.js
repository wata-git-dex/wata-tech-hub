// Local-only cropper: no image leaves the browser until the profile is saved.
export function cropBounds(width, height, zoom=1, x=.5, y=.5) {
  const size=Math.min(width,height)/Math.max(1,zoom);
  return {sx:(width-size)*Math.max(0,Math.min(1,x)),sy:(height-size)*Math.max(0,Math.min(1,y)),size};
}
export async function cropProfilePhoto(root,file,{signal}={}) {
  const url=URL.createObjectURL(file), image=new Image();
  try {
    image.src=url;
    await image.decode();
    if(signal?.aborted)return null;
    return await new Promise(resolve=>{
      const dialog=document.createElement('dialog');
      dialog.className='photo-crop';
      dialog.setAttribute('aria-label','Crop profile photo');
      dialog.innerHTML='<h2>Frame your photo</h2><canvas width="512" height="512" aria-label="Cropped photo preview"></canvas><label>Zoom<input data-crop="zoom" type="range" min="1" max="4" step=".01" value="1"></label><label>Horizontal position<input data-crop="x" type="range" min="0" max="1" step=".01" value=".5"></label><label>Vertical position<input data-crop="y" type="range" min="0" max="1" step=".01" value=".5"></label><div class="actions"><button type="button" data-crop-cancel>Cancel</button><button type="button" class="primary" data-crop-use>Use photo</button></div>';
      root.append(dialog);
      const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d');
      const draw=()=>{const value=k=>Number(dialog.querySelector(`[data-crop="${k}"]`).value);const {sx,sy,size}=cropBounds(image.naturalWidth,image.naturalHeight,value('zoom'),value('x'),value('y'));ctx.clearRect(0,0,512,512);ctx.drawImage(image,sx,sy,size,size,0,0,512,512);};
      const abort=()=>done(null);
      const done=result=>{signal?.removeEventListener('abort',abort);dialog.close();dialog.remove();resolve(result);};
      signal?.addEventListener('abort',abort,{once:true});
      dialog.addEventListener('input',draw);
      dialog.addEventListener('cancel',e=>{e.preventDefault();done(null);});
      dialog.querySelector('[data-crop-cancel]').onclick=()=>done(null);
      dialog.querySelector('[data-crop-use]').onclick=()=>canvas.toBlob(blob=>done(blob?new File([blob],'profile-photo.jpg',{type:'image/jpeg'}):null),'image/jpeg',.85);
      draw();dialog.showModal();
    });
  } finally { URL.revokeObjectURL(url); }
}
