import { modelCode, inspectExpression } from './operator-model.js?v=20261014-cs-11';
import { tokenize, matching, cleanCode, bodyOf, execute } from './branching-model.js?v=20261014-cs-11';

const clone=value=>JSON.parse(JSON.stringify(value));
// Models one switch statement: which case the selector matches, which cases run (falling through until break), and the output.
export function switchModel(source) {
  const body=bodyOf(cleanCode(source)),tokens=tokenize(body);
  const first=tokens.findIndex(token=>token.text==='switch');
  const prefix=first<0?body:body.slice(0,tokens[first].start);
  const initial=modelCode(prefix);
  const state={vars:initial.vars,cases:[],selected:-1,selector:undefined,complete:false,output:'',phases:initial.steps};
  if(initial.last?.error){state.error=initial.last.error;return state;}
  if(first<0)return state;
  let cursor=first+1;
  if(tokens[cursor]?.text!=='('){state.hint='Write switch (value) after the word switch.';return state;}
  const closeParen=matching(tokens,cursor,'(',')');
  if(closeParen<0)return state;
  state.selectorCode=body.slice(tokens[cursor].end,tokens[closeParen].start).trim();
  cursor=closeParen+1;
  if(tokens[cursor]?.text!=='{'){state.hint='Open the switch yard with { after the parentheses.';return state;}
  const open=cursor,close=matching(tokens,open,'{','}');
  if(close<0)return state;
  // Split the block into case / default sections at brace depth 1.
  const marks=[];let depth=0;
  for(let i=open+1;i<close;i++){
    const text=tokens[i].text;
    if(text==='{')depth++;else if(text==='}')depth--;
    else if(depth===0&&(text==='case'||text==='default'))marks.push(i);
  }
  for(let m=0;m<marks.length;m++){
    const at=marks[m],isDefault=tokens[at].text==='default';
    let colon=at+1;while(colon<close&&tokens[colon].text!==':')colon++;
    if(colon>=close)return state;
    const end=m+1<marks.length?tokens[marks[m+1]].start:tokens[close].start;
    const raw=body.slice(tokens[colon].end,end);
    state.cases.push({kind:isDefault?'default':'case',label:isDefault?'':body.slice(tokens[at].end,tokens[colon].start).trim(),code:raw.replace(/\bbreak\s*;/g,'').trim(),hasBreak:/\bbreak\s*;/.test(raw),status:'waiting'});
  }
  state.complete=true;state.exitCode=body.slice(tokens[close].end).trim();
  try {
    let vars=clone(state.vars);
    const selector=inspectExpression(state.selectorCode,vars);vars=selector.vars;state.selector=selector.value;
    let start=-1;
    state.cases.forEach((item,index)=>{
      if(item.kind==='default'||start>=0)return;
      const label=inspectExpression(item.label,vars);
      item.result=label.value==state.selector;item.checked=String(label.value);
      if(item.result)start=index;
    });
    if(start<0)start=state.cases.findIndex(item=>item.kind==='default');
    state.selected=start;
    let running=start>=0;
    state.cases.forEach((item,index)=>{
      if(index===start){item.status='entered';}
      else if(index>start&&start>=0&&running){item.status='fell';}
      else if(start>=0&&index>start){item.status='skipped';}
      else item.status='failed';
      if(!running||index<start)return;
      item.ran=true;if(item.hasBreak)running=false;
    });
    state.cases.forEach(item=>{if(item.status==='fell'&&!item.ran)item.status='skipped';});
    let run={vars,output:'',returned:false,locals:new Set()};
    for(const item of state.cases){
      if(!item.ran)continue;
      const result=execute(item.code,run.vars);
      state.output+=result.output;
      run={vars:result.vars,output:'',returned:result.returned,locals:new Set([...run.locals,...result.locals])};
      if(result.returned)break;
    }
    const outer=Object.fromEntries(Object.keys(vars).map(name=>[name,run.vars[name]]));
    const exit=run.returned?{vars:outer,output:''}:execute(state.exitCode,outer);
    state.after=exit.vars;state.output+=exit.output;
  } catch(error){state.error=error.message;state.complete=false;}
  return state;
}
