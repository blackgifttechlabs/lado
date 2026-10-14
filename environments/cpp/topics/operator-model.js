// A small, explicit C++ teaching model. Unsupported statements are never executed.
const precedence = {'||':1,'&&':2,'|':3,'^':4,'&':5,'==':6,'!=':6,'<':7,'>':7,'<=':7,'>=':7,'<<':8,'>>':8,'+':9,'-':9,'*':10,'/':10,'%':10};
const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
const numeric = value => typeof value !== 'string';
export function expressionTree(source) {
  const tokens=source.match(/"(?:\\.|[^"\\])*"|\d+(?:\.\d+)?[uU]?|[A-Za-z_]\w*|&&|\|\||<<|>>|\+\+|--|==|!=|<=|>=|\S/g)||[];
  let pos=0,group=0;
  if(tokens.length>100) throw new Error('Use a smaller expression for this scene.');
  function atom() {
    const token=tokens[pos++];let node;
    if(token==='(') {group++;node=expr(0);if(tokens[pos++]!==')')throw new Error('Close the parentheses first.');node.group=group--;}
    else if(['!','~','+','-','++','--'].includes(token)) node={op:token,children:[atom()],prefix:true,group};
    else if(/^\d/.test(token||'')) node={value:Number(token.replace(/[uU]$/,'')),type:/u/i.test(token)?'unsigned int':'int',children:[],group};
    else if(token?.startsWith('"')) {try{node={value:JSON.parse(token),type:'string',children:[],group};}catch{throw new Error('Finish the string first.');}}
    else if(token==='true'||token==='false')node={value:token==='true',type:'bool',children:[],group};
    else if(token==='static_cast') {
      if(tokens[pos++]!=='<')throw new Error('Check the cast.');let type='';while(pos<tokens.length&&tokens[pos]!=='>')type+=(type?' ':'')+tokens[pos++];
      if(tokens[pos++]!=='>'||tokens[pos++]!=='(')throw new Error('Check the cast.');node={op:'cast',type,children:[expr(0)],group};if(tokens[pos++]!==')')throw new Error('Close the cast.');
    }
    else if(/^[A-Za-z_]\w*$/.test(token||'')) {
      node={name:token,children:[],group};
      if(tokens[pos]==='(') {pos++;if(tokens[pos++]!==')')throw new Error('This scene supports simple expressions, not function arguments.');node.op='call';}
    } else throw new Error('Finish the expression before the semicolon.');
    if(['++','--'].includes(tokens[pos]))node={op:tokens[pos++],children:[node],prefix:false,group};
    return node;
  }
  function expr(min) {
    let left=atom();
    while(own(precedence,tokens[pos])&&precedence[tokens[pos]]>=min) {const op=tokens[pos++];left={op,children:[left,expr(precedence[op]+1)],group};}
    if(min===0&&tokens[pos]==='?') {pos++;const yes=expr(0);if(tokens[pos++]!==':')throw new Error('Add : and the false result.');left={op:'?:',children:[left,yes,expr(0)],group};}
    return left;
  }
  const root=expr(0);if(pos!==tokens.length)throw new Error('This scene cannot model that expression yet.');return root;
}
function cast(value,type) {
  if(type==='bool')return !!value;
  if(type==='string'||type==='std::string') {if(typeof value!=='string')throw new Error('A string box needs a string value.');return value;}
  if(!numeric(value))throw new Error('A number box cannot hold this string.');
  if(type==='unsigned char')return (Number(value)%256+256)%256;
  if(type==='unsigned int')return Number(value)>>>0;
  return Math.trunc(Number(value));
}
function modified(node) {return [...(node.op==='++'||node.op==='--'?[node.children[0].name]:[]),...node.children.flatMap(modified)];}
function read(node,vars,events) {
  const args=node.children;
  if(!node.op) {
    if(node.name) {if(!own(vars,node.name)||vars[node.name].value===undefined)throw new Error(`Give ${node.name} a value first.`);node.value=vars[node.name].value;node.type=vars[node.name].type;}
    return node.value;
  }
  if(node.op==='call')throw new Error(`The scene cannot run ${node.name}(). Use Run code for function calls.`);
  if(['+','-','*','/','%','&','|','^','<<','>>'].includes(node.op)&&args.length===2) {
    const mods=modified(node);if(new Set(mods).size!==mods.length)throw new Error('Changing the same variable twice here is undefined behavior in C++. Split it into separate statements.');
  }
  if(node.op==='++'||node.op==='--') {
    const target=args[0].name;if(!target||!own(vars,target))throw new Error('Increment or decrement a variable box.');
    const before=read(args[0],vars,events),after=cast(Number(before)+(node.op==='++'?1:-1),vars[target].type);
    vars[target].value=after;node.value=node.prefix?after:before;node.type=vars[target].type;
    events.push({kind:'increment',name:target,before,after,used:node.value,prefix:node.prefix,op:node.op});return node.value;
  }
  if(node.op==='cast') {node.value=cast(read(args[0],vars,events),node.type);return node.value;}
  const left=read(args[0],vars,events);
  if(node.op==='?:') {
    // Inspect types without evaluating branch side effects.
    const typeOf=n=>n.name?vars[n.name]?.type:n.type||(['==','!=','<','>','<=','>=','&&','||','!'].includes(n.op)?'bool':n.children[0]?typeOf(n.children[0]):'int');
    if((typeOf(args[1])==='string')!==(typeOf(args[2])==='string'))throw new Error('Both paths must return compatible types. Use two strings or two numbers.');
    node.selected=left?1:2;args[left?2:1].skipped=true;node.value=read(args[node.selected],vars,events);node.type=args[node.selected].type;return node.value;
  }
  if((node.op==='&&'&&!left)||(node.op==='||'&&left)) {args[1].skipped=true;node.value=!!left;node.type='bool';return node.value;}
  if(args.length===1) {
    node.value=node.op==='!'?!left:node.op==='~'?~Number(left):node.op==='-'?-Number(left):Number(left);node.type=node.op==='!'?'bool':args[0].type;return node.value;
  }
  const right=read(args[1],vars,events),a=Number(left),b=Number(right);
  if(!numeric(left)||!numeric(right))throw new Error('Use numeric or boolean operands in this scene.');
  if((node.op==='/'||node.op==='%')&&b===0)throw new Error('Cannot divide by zero. The destination box stays empty.');
  if(['<<','>>'].includes(node.op)&&(!Number.isInteger(b)||b<0||b>=32||a<0))throw new Error('Use nonnegative values and a shift count from 0 to 31.');
  const operations={'+':()=>a+b,'-':()=>a-b,'*':()=>a*b,'/':()=>Math.trunc(a/b),'%':()=>a%b,'&':()=>a&b,'|':()=>a|b,'^':()=>a^b,'<<':()=>a*2**b,'>>':()=>Math.floor(a/2**b),'&&':()=>!!left&&!!right,'||':()=>!!left||!!right,'==':()=>a===b,'!=':()=>a!==b,'<':()=>a<b,'>':()=>a>b,'<=':()=>a<=b,'>=':()=>a>=b};
  node.value=operations[node.op]();node.type=typeof node.value==='boolean'?'bool':'int';
  if(!Number.isSafeInteger(node.value)&&typeof node.value!=='boolean')throw new Error('Use smaller whole numbers for this scene.');
  return node.value;
}
export function modelCode(source) {
  const clean=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').replace(/^\s*#.*$/gm,'').replace(/using\s+namespace\s+\w+\s*;/g,'').replace(/\breturn\s+0\s*;/g,'').replace(/^[\s\S]*?\bmain\s*\([^)]*\)\s*\{/,'');
  const parts=clean.split(/;(?=(?:[^"\\]*(?:\\.|"(?:[^"\\]*\\.)*[^"\\]*"))*[^"\\]*$)/); // Ignore semicolons inside string literals.
  parts.pop();
  const vars=Object.create(null),steps=[];
  for(const raw of parts) {
    const line=raw.trim().replace(/^[{}\s]+/,'');if(!line||/^return\b|^(?:std::)?cout\b/.test(line))continue;
    const before=JSON.parse(JSON.stringify(vars));let name,type,expression,decl=false;
    const declaration=/^(?:const\s+)?(unsigned\s+(?:int|char)|int|bool|string|std::string|auto)\s+([A-Za-z_]\w*)\s*(?:=\s*([\s\S]*))?$/.exec(line);
    const assignment=/^([A-Za-z_]\w*)\s*(\|=|&=|\^=|<<=|>>=|\+=|-=|=)\s*([\s\S]+)$/.exec(line);
    if(declaration) {[,type,name,expression]=declaration;decl=true;}
    else if(assignment) {name=assignment[1];type=vars[name]?.type;expression=assignment[2]==='='?assignment[3]:`${name} ${assignment[2].slice(0,-1)} (${assignment[3]})`;}
    else expression=line;
    const step={line,name,type,before,events:[],decl};
    try {
      if(decl&&!expression) {vars[name]={type};step.empty=true;}
      else {
        if(name&&!decl&&!type)throw new Error(`Create the ${name} box first.`);
        step.tree=expressionTree(expression);step.expression=expression;
        step.value=read(step.tree,vars,step.events);
        if(name) {if(type==='auto')type=step.tree.type||'int';step.value=cast(step.value,type);vars[name]={type,value:step.value};}
      }
    } catch(error) {Object.keys(vars).forEach(key=>delete vars[key]);Object.assign(vars,before);step.error=error.message;}
    step.after=JSON.parse(JSON.stringify(vars));steps.push(step);
    if(step.error)break;
  }
  return {vars,steps,last:steps.at(-1)};
}

// Shared by the branching scene: evaluates the same bounded expression subset.
export function inspectExpression(expression, variables) {
  const vars=JSON.parse(JSON.stringify(variables)),events=[],tree=expressionTree(expression);
  const value=read(tree,vars,events);
  return {value,tree,vars,events};
}
