import { modelCode, inspectExpression } from './operator-model.js?v=20260930-branches-2';

const tokenPattern=/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_]\w*|\d+|>=|<=|==|!=|&&|\|\||<<|>>|\+\+|--|\S/g;
const tokenize=source=>Array.from(source.matchAll(tokenPattern),m=>({text:m[0],start:m.index,end:m.index+m[0].length}));
function matching(tokens,start,open,close) {
  let depth=0;
  for(let i=start;i<tokens.length;i++){if(tokens[i].text===open)depth++;if(tokens[i].text===close&&--depth===0)return i;}
  return -1;
}
function cleanCode(source) {
  return source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,text=>text.startsWith('//')||text.startsWith('/*')?' ':text)
    .replace(/^\s*#.*$/gm,'').replace(/\busing\s+namespace\s+\w+\s*;/g,'');
}
function bodyOf(source) {
  const match=/\bmain\s*\([^)]*\)\s*\{/.exec(source);
  if(!match)return source;
  const start=match.index+match[0].length,tokens=tokenize(source.slice(start-1));
  const end=matching(tokens,0,'{','}');
  return end>=0?source.slice(start,start-1+tokens[end].start):source.slice(start);
}
function declarations(vars) {
  return Object.entries(vars).map(([name,item])=>`${item.type} ${name}${item.value===undefined?'':` = ${typeof item.value==='string'?JSON.stringify(item.value):item.value}`};`).join('\n');
}
function execute(source,variables) {
  const initial=JSON.parse(JSON.stringify(variables));let vars=initial,output='',executed=[];const locals=new Set();
  const tokens=tokenize(source);let start=0;
  for(let i=0;i<tokens.length;i++) {
    if(tokens[i].text==='{'||tokens[i].text==='}')throw new Error('This scene currently shows one if / else if / else chain. Keep nested blocks for the nested lesson.');
    if(tokens[i].text!==';')continue;
    const statement=source.slice(start,tokens[i].start).trim();start=tokens[i].end;
    if(!statement)continue;
    if(/^return\b/.test(statement)) {
      if(!/^return\s+0$/.test(statement))throw new Error('Use return 0 in this introductory scene.');
      return {vars,output,executed,locals,returned:true};
    }
    if(/^(?:std::)?cout\s*<</.test(statement)) {
      const parts=tokenize(statement);let piece='';
      const flush=()=>{
        if(!piece.trim())return;
        if(/^(?:std::)?endl$/.test(piece.trim()))output+='\n';
        else {const result=inspectExpression(piece,vars);vars=result.vars;output+=typeof result.value==='boolean'?Number(result.value):String(result.value);}
        piece='';
      };
      let started=false;
      for(const token of parts){if(token.text==='<<'){if(started)flush();started=true;}else if(started)piece+=(piece?' ':'')+token.text;}
      flush();executed.push(statement+';');continue;
    }
    const declaration=/^(?:unsigned\s+)?(?:int|char|bool|string|auto)\s+([A-Za-z_]\w*)/.exec(statement);
    if(declaration)locals.add(declaration[1]);
    const state=modelCode(declarations(vars)+'\n'+statement+';');
    if(state.last?.error)throw new Error(state.last.error);
    vars=state.vars;executed.push(statement+';');
  }
  return {vars,output,executed,locals,returned:false};
}
export function branchingModel(source) {
  const body=bodyOf(cleanCode(source)),tokens=tokenize(body);
  const first=tokens.findIndex(token=>token.text==='if');
  const prefix=first<0?body:body.slice(0,tokens[first].start);
  const initial=modelCode(prefix);
  const state={vars:initial.vars,branches:[],selected:-1,complete:false,output:'',branchOutput:'',exitOutput:'',exitCode:'',prefix,phases:initial.steps};
  if(initial.last?.error){state.error=initial.last.error;return state;}
  if(first<0)return state;
  let cursor=first,chainEnd=tokens[first].start;
  while(cursor<tokens.length) {
    const isElse=tokens[cursor].text==='else';if(isElse)cursor++;
    const conditioned=tokens[cursor]?.text==='if';
    const branch={kind:isElse?(conditioned?'else if':'else'):'if',condition:null,code:'',complete:false,status:'waiting'};
    state.branches.push(branch);
    if(conditioned) {
      cursor++;if(tokens[cursor]?.text!=='(')return state;
      const end=matching(tokens,cursor,'(',')');
      if(end<0){branch.condition=body.slice(tokens[cursor].end).trim();return state;}
      branch.condition=body.slice(tokens[cursor].end,tokens[end].start).trim();cursor=end+1;
    }
    if(tokens[cursor]?.text!== '{') {state.hint='Use { and } to mark the room belonging to this door.';return state;}
    const end=matching(tokens,cursor,'{','}');
    if(end<0){branch.code=body.slice(tokens[cursor].end).trim();return state;}
    branch.code=body.slice(tokens[cursor].end,tokens[end].start).trim();branch.complete=true;chainEnd=tokens[end].end;cursor=end+1;
    if(tokens[cursor]?.text!=='else')break;
  }
  state.complete=true;state.exitCode=body.slice(chainEnd).trim();
  let vars=JSON.parse(JSON.stringify(state.vars));
  try {
    state.branches.forEach((branch,index)=>{
      if(state.selected>=0){branch.status='skipped';return;}
      if(branch.condition===null){branch.result=true;branch.status='entered';state.selected=index;return;}
      const before=JSON.parse(JSON.stringify(vars)),inspection=inspectExpression(branch.condition,vars);
      vars=inspection.vars;branch.result=!!inspection.value;branch.status=branch.result?'entered':'failed';
      branch.inspection=tokenize(branch.condition).map(token=>Object.prototype.hasOwnProperty.call(before,token.text)?String(before[token.text].value):token.text).join(' ');
      if(branch.result)state.selected=index;
    });
    let branchRun={vars,output:'',executed:[],locals:new Set(),returned:false};
    if(state.selected>=0)branchRun=execute(state.branches[state.selected].code,vars);
    state.branchOutput=branchRun.output;state.executed=branchRun.executed;state.returned=branchRun.returned;
    // Block-local declarations disappear when the guard leaves the selected room.
    const outer=Object.fromEntries(Object.keys(vars).map(name=>[name,branchRun.locals.has(name)?vars[name]:branchRun.vars[name]]));
    const exit=branchRun.returned?{vars:outer,output:''}:execute(state.exitCode,outer);
    state.after=exit.vars;state.exitOutput=exit.output;state.output=state.branchOutput+state.exitOutput;
  } catch(error){state.error=error.message;state.complete=false;}
  return state;
}
export {tokenize,matching,cleanCode,bodyOf,execute};
