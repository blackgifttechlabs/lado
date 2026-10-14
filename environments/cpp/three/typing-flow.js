import { rigsReady, deposit3D, openBox3D, hover3D } from './physical-scene.js?v=20261015-m-1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const typePattern='(?:const\\s+)?(?:unsigned\\s+)?(?:int|short|long|float|double|char|bool|string|auto)';
function inspect(code){
  const clean=code.replace(/\/\/[^\n]*/g,'').replace(/\breturn\s+0\s*;/g,'').replace(/[}\s]+$/,'');
  const tail=clean.slice(Math.max(clean.lastIndexOf(';'),clean.lastIndexOf('{'))+1).trim();
  const match=new RegExp(`^(${typePattern})(?:\\s+([A-Za-z_]\\w*))?\\s*(=\\s*([\\s\\S]*))?$`).exec(tail);
  if(!match)return null;
  const raw=(match[4]||'').trim();let value=null;
  if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)[fFuUlL]*$/.test(raw))value=raw.replace(/[fFuUlL]+$/,'');
  else if(/^(true|false)$/.test(raw))value=raw;
  else if(/^"(?:\\.|[^"\\])*"$/.test(raw)||/^'(?:\\.|[^'\\])'$/.test(raw))value=raw;
  return {type:match[1],name:match[2]||'',opened:!!match[3],value,raw};
}
function create(stage){
  const node=document.createElement('section');node.className='cpp-typing-three-scene';
  node.innerHTML='<p class="cpp-typing-phase"></p><div class="cpp-typing-value"></div><div class="cpp-flow-boxes"><div class="cpp-flow-box"><div class="cpp-box-cube"><i class="f front"><b class="cpp-box-val"></b></i><i class="f back"></i><i class="f left"></i><i class="f right"></i><i class="f bottom"></i><div class="cpp-lid"><i class="lid-face"></i></div></div><span class="cpp-flow-box-name"></span><small></small></div></div><p class="cpp-flow-caption"></p>';
  stage.appendChild(node);return node;
}
let loaded=false;rigsReady.then(()=>loaded=true);
setInterval(()=>{
  if(!loaded)return;
  document.querySelectorAll('.cpp-visual-stage').forEach(stage=>{
    const lab=stage.closest('.cpp-lab'),editor=lab?.querySelector('[data-role="lab-code"]');if(!editor)return;
    if(lab.dataset.lang==='csharp'&&lab.classList.contains('is-diy')){stage._typing3d?.node?.remove();stage.classList.remove('has-typing-three','has-aside');return;}
    let state=stage._typing3d;if(!state)state=stage._typing3d={code:null,pending:null,node:null,until:0};
    if(state.until){if(performance.now()<state.until)return;state.until=0;state.node?.remove();state.node=null;state.pending=null;stage.classList.remove('has-typing-three','has-aside');}
    if(state.code===window.__ladoCode(editor))return;const oldCode=state.code;state.code=window.__ladoCode(editor);
    const pending=inspect(window.__ladoCode(editor));
    if(pending){
      if(!state.node)state.node=create(stage);
      stage.classList.add('has-typing-three');stage.classList.toggle('has-aside',stage.querySelectorAll('.cpp-box-scene .cpp-box-slot').length>0);
      const node=state.node,host=node.querySelector('.cpp-flow-box'),cube=node.querySelector('.cpp-box-cube');
      node.querySelector('.cpp-flow-box-name').textContent=pending.name||'…';node.querySelector('.cpp-flow-box > small').textContent=pending.type;
      const chip=node.querySelector('.cpp-typing-value');chip.textContent=pending.value??'';chip.style.visibility=pending.value===null?'hidden':'visible';
      node.querySelector('.cpp-typing-phase').textContent=pending.opened?'3 · VALUE WAITS ABOVE THE OPENING':pending.name?'2 · NAME THE BOX':'1 · BUILD THE BOX';
      node.querySelector('.cpp-flow-caption').textContent=pending.opened?'Finish with ; to drop the value inside, then close the lid.':pending.name?'Type = to open the lid.':'Keep typing the variable name.';
      if(pending.opened&&!state.pending?.opened)openBox3D(host,0,1e9);
      if(!pending.opened&&state.pending?.opened)openBox3D(host,-1000,0);
      if(pending.value!==null)hover3D(chip,host);
      state.pending=pending;return;
    }
    if(state.pending&&state.node){
      const item=state.pending;
      const committed=item.name&&item.value!==null&&new RegExp(`\\b${item.name}\\s*=\\s*${item.raw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*;`).test(window.__ladoCode(editor));
      if(committed){
        const host=state.node.querySelector('.cpp-flow-box'),chip=state.node.querySelector('.cpp-typing-value');
        state.node.querySelector('.cpp-typing-phase').textContent='4 · ; — DROP, THEN CLOSE';
        state.node.querySelector('.cpp-flow-caption').textContent='The number passes through the opening and lands on the floor. The lid closes afterward.';
        stage._lastPhysicalCommit={name:item.name,value:item.value};
        openBox3D(host,-1000,1400);deposit3D(chip,host,100,1200);state.until=performance.now()+2350;
      }else {state.node.remove();state.node=null;state.pending=null;stage.classList.remove('has-typing-three','has-aside');}
    }
  });
},60);
