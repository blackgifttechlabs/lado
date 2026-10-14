const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bit=(value,index)=>(Number(value) >>> (7-index))&1;
export function logicalScene(step,{token,result}) {
  const root=step.tree,unary=root.op==='!',skipped=root.children[1]?.skipped;
  const question=unary?'Flip true ↔ false':root.op==='&&'?'Are both true?':'Is at least one true?';
  const answer=unary?`${root.children[0].value} becomes ${step.value}`:skipped?`${root.children[0].value} decides it — skip the right side.`:`${step.value?'Yes':'No'} → ${step.value}`;
  return `<div class="cpp-logic-work ${unary?'is-not':''}"><div class="cpp-logic-operands">${unary?`<strong class="cpp-logic-sign">!</strong>${token(root.children[0])}`:`${token(root.children[0])}<strong class="cpp-logic-sign">${esc(root.op)}</strong>${token(root.children[1])}`}</div><p class="cpp-logic-question">${question}</p><p class="cpp-logic-answer">${esc(answer)}</p></div>${result(step)}`;
}
export function bitwiseScene(step,{label,result}) {
  let root=step.tree;if(root.op==='cast')root=root.children[0];
  const shift=['<<','>>'].includes(root.op);
  const rules={'&':'Both bits must be 1.','|':'At least one bit must be 1.','^':'Different bits give 1.','~':'Flip each bit: 0 ↔ 1.','<<':'Move left; fill the right with 0.','>>':'Move right; fill the left with 0.'};
  const row=(name,value,source,answer=false)=>`<div class="cpp-bit-line ${answer?'is-answer':''}"><span>${esc(name)}</span><div class="cpp-bit-cells" ${source?`data-bit-source="${esc(source)}"`:''}>${Array.from({length:8},(_,i)=>`<i data-bit="${i}" class="${bit(value,i)?'is-on':''}">${bit(value,i)}</i>`).join('')}</div><b>${value}</b></div>`;
  return `<div class="cpp-bit-work" data-bit-op="${esc(root.op)}"><p class="cpp-bit-rule"><strong>${esc(root.op)}</strong> ${rules[root.op]||'Apply the operator to each bit.'}</p><div class="cpp-bit-table"><div class="cpp-bit-line is-label"><span>bit</span><div class="cpp-bit-cells">${Array.from({length:8},(_,i)=>`<small>${7-i}</small>`).join('')}</div><b>value</b></div>${root.children.filter((_,i)=>!shift||i===0).map(n=>row(label(n),n.value,n.name)).join('')}${row('result',Number(step.value)&255,'',true)}</div>
    <div class="cpp-bit-checks">${shift?`<span data-check="0">${root.children[1].value} place${root.children[1].value===1?'':'s'} ${root.op==='<<'?'←':'→'} · fill with 0</span>`:Array.from({length:8},(_,i)=>`<span data-check="${i}">Bit ${7-i}: ${root.op==='~'?`flip ${bit(root.children[0].value,i)}`:root.children.map(n=>bit(n.value,i)).join(` ${esc(root.op)} `)} → ${bit(step.value,i)}</span>`).join('')}</div><small class="cpp-bit-conversion">${(Number(step.value)&255).toString(2).padStart(8,'0')} = ${Number(step.value)&255}${Number(step.value)!==(Number(step.value)&255)?' (low 8 bits)':''}</small></div>${result(step)}`;
}
export function bitwiseDuration(step) {let root=step.tree;if(root.op==='cast')root=root.children[0];return ['<<','>>'].includes(root.op)?5100:7200;}
export function animateBitwise(scene,step,helpers) {
  const {animate,hinge,fade,lift,drop}=helpers;
  const work=scene.querySelector('.cpp-bit-work'),boxes=Array.from(scene.querySelectorAll('[data-box]'));
  let root=step.tree;if(root.op==='cast')root=root.children[0];
  const shift=['<<','>>'].includes(root.op),store=bitwiseDuration(step)-700;
  const sources=new Set();
  work.querySelectorAll('[data-bit-source]').forEach(row=>{
    const box=boxes.find(box=>box.dataset.box===row.dataset.bitSource);
    if(box){hinge(box,300,store+80);lift(row,box,800);sources.add(box);}else fade(row,800,true);
  });
  // Literal operands also arrive on the table after the destination box has been built.
  work.querySelectorAll('.cpp-bit-line:not(.is-answer):not(.is-label) .cpp-bit-cells:not([data-bit-source])').forEach(row=>fade(row,800,true));
  const answer=work.querySelector('.is-answer .cpp-bit-cells');
  if(shift) {
    const source=work.querySelector('.cpp-bit-line:not(.is-label):not(.is-answer) .cpp-bit-cells');
    const base=work.getBoundingClientRect(),to=answer.getBoundingClientRect();
    const distance=Math.min(Number(root.children[1].value),8),direction=root.op==='<<'?-1:1;
    const width=answer.children[1].getBoundingClientRect().x-answer.children[0].getBoundingClientRect().x;
    source.querySelectorAll('i').forEach((cell,i)=>{
      const rect=cell.getBoundingClientRect(),chip=cell.cloneNode(true);chip.className+=' cpp-bit-moving';chip.removeAttribute('data-bit');
      Object.assign(chip.style,{left:`${rect.x-base.x}px`,top:`${rect.y-base.y}px`,width:`${rect.width}px`,height:`${rect.height}px`});work.appendChild(chip);
      const stays=i+direction*distance>=0&&i+direction*distance<8;
      animate(chip,[{opacity:0,transform:'none',offset:0},{opacity:1,transform:'none',offset:.1},{opacity:stays?1:0,transform:`translate(${direction*distance*width}px,${to.y-rect.y}px)`,offset:.85},{opacity:0,transform:`translate(${direction*distance*width}px,${to.y-rect.y}px)`,offset:1}],1200,1750);
    });
    answer.querySelectorAll('i').forEach(cell=>fade(cell,2800,true));
    fade(work.querySelector('[data-check]'),1750,true);
  } else {
    for(let i=0;i<8;i++) {
      const start=1800+i*430;
      work.querySelectorAll(`[data-bit="${i}"]`).forEach(cell=>{
        const current=cell.classList.contains('is-on')?'rgb(156, 255, 193)':'rgb(22, 71, 114)';
        animate(cell,[{backgroundColor:current,boxShadow:'none'},{backgroundColor:'#ffdc7a',boxShadow:'0 0 0 2px #fff2b0'},{backgroundColor:current,boxShadow:'none'}],430,start);
      });
      fade(answer.children[i],start+220,true);
      const check=work.querySelector(`[data-check="${i}"]`);fade(check,start,true);if(i<7)fade(check,start+400,false);
    }
  }
  const resolved=shift?3050:5350;
  fade(work.querySelector('.cpp-bit-conversion'),resolved,true);
  fade(work.querySelector('.is-answer > b'),resolved,true);
  const chip=scene.querySelector('.cpp-flow-delivery > span'),target=scene.querySelector('.is-destination');
  if(chip&&target){hinge(target,sources.has(target)?300:store-1450,store+80);fade(chip,store-1200,true);drop(chip,target,store-850);target.querySelector('.is-after').style.animation='none';fade(target.querySelector('.is-after'),store-60,true);}
}
export function animateLogic(scene,step,{animate,hinge,fade,lift,drop}) {
  const root=step.tree,boxes=Array.from(scene.querySelectorAll('[data-box]'));
  const operands=scene.querySelectorAll('.cpp-logic-operands .cpp-flow-token');
  operands.forEach((token,i)=>{
    if(token.classList.contains('is-skipped')) {fade(token,1800,true);return;}
    const box=boxes.find(box=>box.dataset.box===token.dataset.source);
    if(box){hinge(box,350+i*650,3950);lift(token,box,850+i*650);}else fade(token,850+i*650,true);
  });
  fade(scene.querySelector('.cpp-logic-question'),1900,true);fade(scene.querySelector('.cpp-logic-answer'),2550,true);
  if(root.op==='!')animate(operands[0],[{transform:'rotateY(0)',opacity:1},{transform:'rotateY(90deg)',opacity:0}],450,2100,'forwards');
  const chip=scene.querySelector('.cpp-flow-delivery > span'),target=scene.querySelector('.is-destination');
  if(chip&&target){hinge(target,2600,4050);fade(chip,2750,true);drop(chip,target,3150);target.querySelector('.is-after').style.animation='none';fade(target.querySelector('.is-after'),3940,true);}
}
