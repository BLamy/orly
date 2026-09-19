/** Architecture dimensions use the common 227px/no-padding teaching convention.
 * The original paper describes a 224px crop; see SOURCES.md for that distinction.
 * Volumes after conv1/2/5 include their following pooling stage.
 */
export const ALEXNET=[
 {name:'Input',shape:[227,227,3],detail:'RGB image • three channels'},
 {name:'Conv 1 + pool',shape:[27,27,96],detail:'11 × 11 filters, stride 4 → 55 × 55 × 96; ReLU, normalization, 3 × 3 pool / 2'},
 {name:'Conv 2 + pool',shape:[13,13,256],detail:'5 × 5 filters, padding 2; two groups; ReLU, normalization, 3 × 3 pool / 2'},
 {name:'Conv 3',shape:[13,13,384],detail:'3 × 3 filters, padding 1; all input channels; ReLU'},
 {name:'Conv 4',shape:[13,13,384],detail:'3 × 3 filters, padding 1; two groups; ReLU'},
 {name:'Conv 5 + pool',shape:[6,6,256],detail:'3 × 3 filters, padding 1; two groups; ReLU, 3 × 3 pool / 2'},
 {name:'Dense 6',shape:[1,1,4096],detail:'9,216 flattened inputs → 4,096 units; ReLU'},
 {name:'Dense 7',shape:[1,1,4096],detail:'4,096 → 4,096 units; ReLU'},
 {name:'Class scores',shape:[1,1,1000],detail:'4,096 → 1,000 logits; softmax follows'},
] as const;
export function softmax(logits:readonly number[]){if(!logits.length||logits.some(v=>!Number.isFinite(v)))throw new Error('Finite logits required');const m=Math.max(...logits),e=logits.map(x=>Math.exp(x-m)),sum=e.reduce((a,b)=>a+b,0);return e.map(x=>x/sum);}
export function convolveValid(input:readonly number[],width:number,height:number,kernel:readonly number[],k:number){
 if(input.length!==width*height||kernel.length!==k*k||k>width||k>height)throw new Error('Convolution dimensions do not match');
 const ow=width-k+1,oh=height-k+1,out:number[]=[];
 for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){let sum=0;for(let ky=0;ky<k;ky++)for(let kx=0;kx<k;kx++)sum+=input[(y+ky)*width+x+kx]*kernel[ky*k+kx];out.push(sum);}
 return {values:out,width:ow,height:oh};
}
export const IMAGE=Array.from({length:64},(_,i)=>{const x=i%8,y=Math.floor(i/8);return x>=3&&x<=5&&y>=1&&y<=6?1:0;});
export const KERNELS=[[1,0,-1,1,0,-1,1,0,-1],[1,1,1,0,0,0,-1,-1,-1],[0,-1,0,-1,4,-1,0,-1,0]];
export const MAPS=KERNELS.map(k=>convolveValid(IMAGE,8,8,k,3));
export const DENSE_INPUT=[.8,.2,.6,.4];
export const DENSE_W1=[[1,-1,.5,.2],[-.4,1,.2,.7],[.3,.3,-.5,1],[1,.2,-.2,-.5],[-.5,.7,1,.1],[.1,-.2,.5,.8]];
export const DENSE_W2=[[.5,-.3,.8,.2,-.4,.1],[-.1,.7,-.2,.3,.5,.4],[.2,.1,.1,-.5,.4,.8]];
export const matvec=(weights:readonly (readonly number[])[],x:readonly number[])=>weights.map(row=>{if(row.length!==x.length)throw new Error('Matrix/input dimension mismatch');return row.reduce((s,w,i)=>s+w*x[i],0);});
export const DENSE_HIDDEN=matvec(DENSE_W1,DENSE_INPUT).map(v=>Math.max(0,v));
export const DENSE_LOGITS=matvec(DENSE_W2,DENSE_HIDDEN);
export const DENSE_PROBS=softmax(DENSE_LOGITS);
