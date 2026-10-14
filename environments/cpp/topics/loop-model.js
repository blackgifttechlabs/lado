import { cleanCode, bodyOf } from './branching-model.js?v=20261015-m-1';

// A bounded C++ teaching interpreter for loop lessons. It records a frame for every loop step so a scene can replay them.
const MAX_LAPS=200,TYPES=new Set(['int','double','float','char','bool','string','std::string','auto','unsigned','long','short','size_t','void','ostream','istream','ifstream','ofstream','fstream','stringstream','istringstream','ostringstream']);
const STREAMS=new Set(['ifstream','ofstream','fstream','stringstream','istringstream','ostringstream']);
const TOKEN=/\s*(?:("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])')|(\d+(?:\.\d+)?)|([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)|(<<=|>>=|->|\+\+|--|\+=|-=|\*=|\/=|%=|==|!=|<=|>=|&&|\|\||<<|>>|[-+*\/%<>=!?:;,(){}\[\].&|^~]))/y;
function lex(source) {
  const out=[];let m;TOKEN.lastIndex=0;
  while(TOKEN.lastIndex<source.length) {
    const from=TOKEN.lastIndex;m=TOKEN.exec(source);
    if(!m){if(/^\s*$/.test(source.slice(from)))break;throw new Error(`Unexpected "${source.slice(from,from+8).trim()}".`);}
    if(m[1]!==undefined){let v;try{v=JSON.parse(m[1]);}catch{v=m[1].slice(1,-1);}out.push({t:'str',v});}
    else if(m[2]!==undefined)out.push({t:'chr',v:m[2].slice(1,-1)});
    else if(m[3]!==undefined)out.push({t:'num',v:Number(m[3]),f:m[3].includes('.')});
    else if(m[4]!==undefined)out.push({t:'id',v:m[4].replace(/^std::/,'')});
    else out.push({t:'op',v:m[5]});
  }
  return out;
}
const join=ts=>ts.map(t=>t.t==='str'?JSON.stringify(t.v):t.t==='chr'?`'${t.v}'`:String(t.v)).join(' ').replace(/ ([;,)\]])/g,'$1').replace(/([(\[]) /g,'$1').replace(/ (\+\+|--)/g,'$1');
const prec={'||':1,'&&':2,'|':2.5,'==':3,'!=':3,'<':4,'>':4,'<=':4,'>=':4,'<<':4.5,'>>':4.5,'+':5,'-':5,'*':6,'/':6,'%':6};
const assignOps=new Set(['=','+=','-=','*=','/=','%=']);

function parse(tokens) {
  let p=0;const userTypes=new Set();
  const peek=(o=0)=>tokens[p+o],isOp=(v,o=0)=>peek(o)?.t==='op'&&peek(o).v===v,isId=(v,o=0)=>peek(o)?.t==='id'&&peek(o).v===v;
  const fail=what=>{throw new Error(peek()?`${what}, but found "${peek().v}".`:`${what}.`);};
  const eat=v=>{if(!isOp(v))fail(`Expected "${v}"`);return tokens[p++];};
  const ident=()=>{if(peek()?.t!=='id')fail('Expected a name');return tokens[p++].v;};

  function primary() {
    const t=peek();
    if(!t)fail('The expression is unfinished');
    if(t.t==='num'){p++;return {k:'num',v:t.v,f:t.f};}
    if(t.t==='str'){p++;return {k:'str',v:t.v};}
    if(t.t==='chr'){p++;return {k:'chr',v:t.v};}
    if(t.t==='id') {
      p++;
      if(t.v==='true'||t.v==='false')return {k:'bool',v:t.v==='true'};
      if(t.v==='this')return {k:'this'};
      if(t.v==='nullptr'||t.v==='NULL')return {k:'null'};
      if(t.v==='sizeof'&&isOp('(')){
        p++;const save=p,ty=typeName();
        if(ty){while(isOp('*'))p++;if(isOp(')')){p++;return {k:'sizeof',type:ty};}}
        p=save;const e=expr();eat(')');return {k:'sizeof',e};
      }
      if(t.v==='static_cast'&&isOp('<')){p++;const type=typeName();eat('>');eat('(');const e=expr();eat(')');return {k:'cast',type,e};}
      if(isOp('(')){
        const at=p;p++;const args=[];
        while(!isOp(')')){args.push(assign());if(isOp(','))p++;else break;}
        eat(')');return {k:'call',name:t.v,args,at};
      }
      return {k:'var',name:t.v};
    }
    if(isOp('(')&&peek(1)?.t==='id'&&(TYPES.has(peek(1).v)||userTypes.has(peek(1).v))&&(isOp('*',2)||isOp(')',2))){
      const save=p;p++;const ty=typeName();let stars=0;while(isOp('*')){p++;stars++;}
      if(ty&&isOp(')')){p++;return {k:'cast2',type:ty,ptr:stars,e:unary()};}
      p=save;
    }
    if(isOp('['))return lambda();
    if(isOp('(')){p++;const e=expr();eat(')');return e;}
    return fail('Expected a value');
  }
  function lambda() {
    eat('[');const caps={def:null,named:[]};
    while(!isOp(']')) {
      if(isOp('=')){p++;caps.def='=';}
      else if(isOp('&')){p++;if(peek()?.t==='id')caps.named.push({name:tokens[p++].v,ref:true});else caps.def='&';}
      else if(peek()?.t==='id')caps.named.push({name:tokens[p++].v,ref:false});
      else fail('Expected a capture such as =, & or a name');
      if(isOp(','))p++;
    }
    eat(']');
    let params=[];if(isOp('(')){p++;params=paramList();eat(')');}
    let mutable=false;if(isId('mutable')){p++;mutable=true;}
    if(isOp('->')){p++;typeName();}
    const body=statement();
    return {k:'lambda',caps,params,body,mutable};
  }
  function paramList() {
    const params=[];let seenDefault=false;
    if(isId('void')&&isOp(')',1)){p++;return params;}
    while(!isOp(')')) {
      const isConst=isId('const'),type=typeName();if(!type)fail('Expected a parameter type');
      const prm={type,name:'',byRef:false,ptr:false,arr:false,def:null,isConst};
      if(isOp('(')&&isOp('*',1)){p+=2;prm.name=ident();eat(')');eat('(');let depth=1;while(depth){if(!peek())fail('Close the function pointer type');if(isOp('('))depth++;else if(isOp(')'))depth--;p++;}prm.type='fn';}
      else {
        while(isOp('&')||isOp('*')){if(isOp('&'))prm.byRef=true;else prm.ptr=true;p++;}
        if(peek()?.t==='id')prm.name=tokens[p++].v;
        if(isOp('[')){p++;if(!isOp(']'))expr();eat(']');prm.arr=true;}
      }
      if(isOp('=')){p++;prm.def=assign();seenDefault=true;}
      else if(seenDefault)throw new Error(`${prm.name||'This parameter'} has no default value but comes after one that has. Put the parameters with defaults last.`);
      params.push(prm);
      if(isOp(','))p++;else break;
    }
    return params;
  }
  function postfix() {
    let e=primary();
    for(;;) {
      if(isOp('[')){p++;const i=expr();eat(']');e={k:'idx',a:e,i};}
      else if(isOp('.')||isOp('->')){
        const arrow=tokens[p++].v==='->',name=ident();
        if(isOp('(')){p++;const args=[];while(!isOp(')')){args.push(assign());if(isOp(','))p++;else break;}eat(')');e={k:'method',obj:e,name,args,arrow};}
        else e={k:'field',obj:e,name,arrow};
      }
      else if(isOp('++')||isOp('--')){e={k:'inc',op:tokens[p++].v,prefix:false,target:e};}
      else return e;
    }
  }
  function unary() {
    if(isOp('!')||isOp('-')||isOp('+')){const op=tokens[p++].v;return {k:'un',op,e:unary()};}
    if(isId('new')){
      p++;const type=typeName();if(!type)fail('Expected a type after new');
      const args=[];if(isOp('(')){p++;while(!isOp(')')){args.push(assign());if(isOp(','))p++;else break;}eat(')');}
      else if(isOp('{')){const l=list();args.push(...l.items);}
      return {k:'new',type,args};
    }
    if(isOp('&')){p++;return {k:'addr',e:unary()};}
    if(isOp('*')){p++;return {k:'deref',e:unary()};}
    if(isOp('++')||isOp('--')){const op=tokens[p++].v;return {k:'inc',op,prefix:true,target:unary()};}
    return postfix();
  }
  function binary(min) {
    let left=unary();
    while(peek()?.t==='op'&&prec[peek().v]>=min){const op=tokens[p++].v;left={k:'bin',op,l:left,r:binary(prec[op]+1)};}
    return left;
  }
  function ternary() {
    const c=binary(1);
    if(!isOp('?'))return c;
    p++;const a=assign();eat(':');return {k:'cond',c,a,b:assign()};
  }
  function assign() {
    const left=ternary();
    if(peek()?.t==='op'&&assignOps.has(peek().v)){
      if(left.k!=='var'&&left.k!=='idx'&&left.k!=='deref'&&left.k!=='field')fail('The left side of = must be a variable');
      const op=tokens[p++].v;return {k:'assign',op,target:left,e:assign()};
    }
    return left;
  }
  const expr=assign;
  function list() {
    eat('{');const items=[];
    while(!isOp('}')){items.push(isOp('{')?list():assign());if(isOp(','))p++;else break;}
    eat('}');return {k:'list',items};
  }
  let pendingSize=null;
  function typeName() {
    if(isId('const'))p++;
    const t=peek();
    if((t?.v==='array'||t?.v==='std::array')&&isOp('<',1)){
      p+=2;const elem=typeName();if(!elem)fail('Expected the item type');eat(',');pendingSize=primary();eat('>');return `array:${elem}`;
    }
    if(t?.t!=='id'||!(TYPES.has(t.v)||userTypes.has(t.v)))return null;
    p++;let name=t.v;
    if((name==='unsigned'||name==='long'||name==='short')&&peek()?.t==='id'&&TYPES.has(peek().v)){name=tokens[p++].v==='char'?'char':name;}
    return name;
  }
  function isDecl() {
    const save=p,type=typeName();let yes=false;
    if(type){
      if(isOp('(')&&isOp('*',1)&&peek(2)?.t==='id')yes=true;
      else{while(isOp('*')||isOp('&'))p++;yes=peek()?.t==='id'&&(!isOp('(',1)||userTypes.has(type)||STREAMS.has(type));}
    }
    p=save;return yes;
  }
  function decl() {
    const type=typeName(),std=type.startsWith('array:'),stdSize=pendingSize,items=[];pendingSize=null;
    for(;;) {
      let ptr=false,ref=false,fnptr=false,name;
      while(isOp('*')||isOp('&')){if(isOp('*'))ptr=true;else ref=true;p++;}
      if(isOp('(')&&isOp('*',1)){p+=2;name=ident();eat(')');eat('(');let depth=1;while(depth){if(!peek())fail('Close the function pointer type');if(isOp('('))depth++;else if(isOp(')'))depth--;p++;}fnptr=true;}
      else name=ident();
      let arr=std,dims=std?[stdSize]:[],init=null;
      while(isOp('[')){p++;arr=true;dims.push(isOp(']')?null:expr());eat(']');}
      let ctorArgs=null;
      if(isOp('=')){p++;init=isOp('{')?list():expr();}
      else if(isOp('{'))init=list();
      else if(isOp('(')&&(userTypes.has(type)||STREAMS.has(type))){p++;ctorArgs=[];while(!isOp(')')){ctorArgs.push(assign());if(isOp(','))p++;else break;}eat(')');}
      items.push({k:'decl',type:std?type.slice(6):type,std,name,arr,dims,init,ptr,ref,fnptr,ctorArgs});
      if(isOp(',')){p++;continue;}
      break;
    }
    return {k:'decls',items};
  }
  function statement() {
    const from=p,node=statement0();
    if(['decls','expr','cout'].includes(node.k))node.text=join(tokens.slice(from,p));
    return node;
  }
  function statement0() {
    if(isOp('{')){
      p++;const body=[];while(!isOp('}')){if(!peek())return {k:'block',body};body.push(statement());}
      p++;return {k:'block',body};
    }
    if(isOp(';')){p++;return {k:'empty'};}
    const t=peek();
    if(t.t==='id') {
      if(t.v==='if'){p++;eat('(');const c=expr();eat(')');const then=statement();let other=null;if(isId('else')){p++;other=statement();}return {k:'if',c,then,other};}
      if(t.v==='while'){p++;eat('(');const a=p,c=expr(),text=tokens.slice(a,p);eat(')');return {k:'while',c,text,body:statement()};}
      if(t.v==='do'){p++;const body=statement();if(!isId('while'))fail('Expected while after the do body');p++;eat('(');const a=p,c=expr(),text=tokens.slice(a,p);eat(')');eat(';');return {k:'do',c,text,body};}
      if(t.v==='for')return forLoop();
      if(t.v==='break'){p++;eat(';');return {k:'break'};}
      if(t.v==='continue'){p++;eat(';');return {k:'continue'};}
      if(t.v==='return'){p++;let e=null;if(!isOp(';'))e=expr();eat(';');return {k:'return',e};}
      if(t.v==='cout'||(isOp('<<',1)&&!userTypes.has(t.v))){
        p++;const items=[];
        while(isOp('<<')){p++;items.push(binary(5));}
        eat(';');return {k:'cout',target:t.v,items};
      }
      if(t.v==='delete'){p++;if(isOp('[')){p++;eat(']');}const e=unary();eat(';');return {k:'delete',e};}
      if(t.v==='switch') {
        p++;eat('(');const c=expr();eat(')');eat('{');const items=[];
        while(!isOp('}')) {
          if(!peek())fail('Close the switch with }');
          if(isId('case')){p++;const label=binary(1);eat(':');items.push({label,body:[]});}
          else if(isId('default')){p++;eat(':');items.push({label:null,body:[]});}
          else{if(!items.length)fail('Start with case or default');items.at(-1).body.push(statement());}
        }
        p++;return {k:'switch',c,items};
      }
      if(t.v==='cin'||t.v==='std::cin')throw new Error(`${t.v} is not used in this loop scene.`);
      if(isDecl()){const d=decl();eat(';');return d;}
    }
    const e=expr();eat(';');return {k:'expr',e};
  }
  function forLoop() {
    p++;eat('(');
    let depth=0,ranged=false;
    for(let i=p;i<tokens.length;i++){
      const v=tokens[i].t==='op'?tokens[i].v:'';
      if(v==='(')depth++;else if(v===')'){if(depth===0)break;depth--;}
      else if(depth===0&&v===';')break;else if(depth===0&&v===':'){ranged=true;break;}
    }
    if(ranged) {
      const type=typeName();if(!type)fail('Expected a type before the loop variable');
      let byRef=false;if(isOp('&')){p++;byRef=true;}
      const name=ident();eat(':');
      const source=isOp('{')?list():expr();eat(')');
      return {k:'range',type,byRef,name,source,body:statement()};
    }
    let init=null,cond=null,update=null,initText='',condTokens=[],updateText='';
    if(!isOp(';')){const a=p;init=isDecl()?decl():{k:'expr',e:expr()};initText=join(tokens.slice(a,p));}
    eat(';');
    if(!isOp(';')){const a=p;cond=expr();condTokens=tokens.slice(a,p);}
    eat(';');
    if(!isOp(')')){const a=p;update=expr();updateText=join(tokens.slice(a,p));}
    eat(')');
    return {k:'for',init,cond,update,initText,text:condTokens,updateText,body:statement()};
  }
  const STAT_KW=['virtual','static','inline','explicit','friend','constexpr'];
  function typeDef() {
    const kind=tokens[p++].v,name=ident();userTypes.add(name);
    const d={kind,name,base:null,members:[],methods:[],at:p};
    if(isOp(':')){p++;while(isId('public')||isId('private')||isId('protected'))p++;d.base=ident();}
    eat('{');let access=kind==='class'?'private':'public';
    while(!isOp('}')) {
      if(!peek())fail('Close the type with }');
      if((isId('public')||isId('private')||isId('protected'))&&isOp(':',1)){access=tokens[p].v;p+=2;continue;}
      classMember(d,access);
    }
    p++;eat(';');return d;
  }
  function classMember(d,access) {
    let virt=false,stat=false;
    while(STAT_KW.some(k=>isId(k))){if(isId('virtual'))virt=true;if(isId('static'))stat=true;p++;}
    if(isOp('~')) {
      p++;ident();eat('(');eat(')');let body=null;if(isId('override'))p++;
      if(isOp('{'))body=statement();else{if(isOp('='))p+=2;eat(';');}
      d.methods.push({name:'~'+d.name,dtor:true,params:[],body,virt,access,owner:d.name});return;
    }
    if(peek()?.t==='id'&&peek().v===d.name&&isOp('(',1)) {
      p++;eat('(');const params=paramList();eat(')');const inits=[];
      if(isOp(':')){p++;for(;;){const n=ident();eat('(');const args=[];while(!isOp(')')){args.push(assign());if(isOp(','))p++;else break;}eat(')');inits.push({name:n,args});if(isOp(','))p++;else break;}}
      let body=null;if(isOp('{'))body=statement();else{if(isOp('='))p+=2;eat(';');}
      d.methods.push({name:d.name,ctor:true,params,inits,body,access,owner:d.name});return;
    }
    const ret=typeName();if(!ret)fail(`Expected a type for a member of ${d.name}. If it is your own struct, define it above ${d.name}`);
    let retRef=false,retPtr=false;while(isOp('*')||isOp('&')){if(isOp('&'))retRef=true;else retPtr=true;p++;}
    let name;
    if(isId('operator')){p++;name='operator'+tokens[p++].v;if(name==='operator('){eat(')');name='operator()';}}
    else name=ident();
    if(isOp('(')) {
      p++;const params=paramList();eat(')');if(isId('const'))p++;if(isId('override')||isId('final'))p++;
      let body=null,abstract=false;
      if(isOp('{'))body=statement();
      else{if(isOp('=')){p++;if(peek()?.t==='num'&&peek().v===0)abstract=true;p++;}eat(';');}
      d.methods.push({name,ret,retRef,retPtr,params,body,virt,stat,abstract,access,owner:d.name,proto:!body&&!abstract});return;
    }
    for(;;) {
      const dims=[];while(isOp('[')){p++;dims.push(isOp(']')?null:expr());eat(']');}
      let init=null;if(isOp('=')){p++;init=isOp('{')?list():expr();}else if(isOp('{'))init=list();
      d.members.push({name,type:ret,dims,init,static:stat,access,ptr:retPtr});
      if(isOp(',')){p++;while(isOp('*')||isOp('&'))p++;name=ident();continue;}
      break;
    }
    eat(';');
  }
  function enumDef() {
    p++;let scoped=false;if(isId('class')||isId('struct')){scoped=true;p++;}
    const name=ident();userTypes.add(name);if(isOp(':')){p++;typeName();}
    eat('{');const items=[];
    while(!isOp('}')){const n=ident();let init=null;if(isOp('=')){p++;init=assign();}items.push({name:n,init});if(isOp(','))p++;else break;}
    eat('}');eat(';');return {kind:'enum',name,scoped,items,members:[],methods:[],at:p};
  }
  function fnStart() {
    const save=p;let ok=false;
    while(isId('inline')||isId('static'))p++;
    const ret=typeName();
    if(ret){while(isOp('*')||isOp('&'))p++;ok=peek()?.t==='id'&&(isOp('(',1)||(peek().v==='operator'&&isOp('(',2)));}
    p=save;return ok;
  }
  const funcs=[],globals=[],typeDefs=[];let main=null;
  while(p<tokens.length) {
    if(isId('struct')||isId('class')||isId('union')){typeDefs.push(typeDef());continue;}
    if(isId('enum')){typeDefs.push(enumDef());continue;}
    if(fnStart()) {
      const start=p;let inline=false;
      while(isId('inline')||isId('static')){if(isId('inline'))inline=true;p++;}
      const ret=typeName();let retRef=false,retPtr=false;while(isOp('*')||isOp('&')){if(isOp('&'))retRef=true;else retPtr=true;p++;}
      let name;if(isId('operator')){p++;name='operator'+tokens[p++].v;}else name=ident();
      eat('(');const params=paramList();eat(')');if(isId('const'))p++;
      if(isOp(';')){p++;funcs.push({name,ret,retRef,retPtr,params,inline,proto:true,at:start});continue;}
      const body=statement();
      if(name==='main')main=body;else funcs.push({name,ret,retRef,retPtr,params,inline,proto:false,body,at:start});
      continue;
    }
    globals.push(statement());
  }
  return {funcs,globals,main,types:typeDefs};
}

const isD=v=>!!v&&typeof v==='object'&&'d' in v,isC=v=>!!v&&typeof v==='object'&&'c' in v;
const isFn=v=>!!v&&typeof v==='object'&&'fn' in v,isPtr=v=>!!v&&typeof v==='object'&&'ptr' in v;
const isObj=v=>!!v&&typeof v==='object'&&'o' in v,isEn=v=>!!v&&typeof v==='object'&&'en' in v,isStream=v=>!!v&&typeof v==='object'&&'st' in v;
let USER=null;
const norm=v=>typeof v==='boolean'?+v:isD(v)?v.d:isC(v)?v.c.charCodeAt(0):isEn(v)?v.en.value:v;
const NPOS=4294967295;
const showObj=v=>`${v.o.cls}{${[...v.o.fields].map(([n,r])=>r.arr?show(r.arr):show(r.value)).join(', ')}}`;
const show=v=>v===undefined?'?':isFn(v)?(v.fn.lambda?'λ':v.fn.name):isPtr(v)?(v.ptr?'&'+v.name:'nullptr'):isObj(v)?showObj(v):isEn(v)?v.en.name:isStream(v)?'stream':typeof v==='boolean'?String(v):typeof v==='string'?JSON.stringify(v):isC(v)?(v.c==='\0'?"'\\0'":`'${v.c}'`):isD(v)?String(v.d):v===NPOS?'npos':Array.isArray(v)?`{${v.map(show).join(', ')}}`:String(v);
const text=v=>{
  if(isEn(v)){if(v.en.scoped)throw new Error(`${v.en.type} is an enum class, so cout cannot print it directly. Print static_cast<int>(value) instead.`);return String(v.en.value);}
  if(isObj(v))throw new Error(`cout does not know how to print a ${v.o.cls}. Print its members one by one, or write operator<< for it.`);
  if(isFn(v)||isPtr(v))throw new Error('A function or a pointer cannot be printed. Call the function, or use * to read the value.');
  if(Array.isArray(v)){if(v.length&&!v.every(isC))throw new Error('Print an array one item at a time with a loop.');let out='';for(const x of v){if(x.c==='\0')break;out+=x.c;}return out;}
  return typeof v==='boolean'?(v?'1':'0'):isC(v)?v.c:isD(v)?String(v.d):String(v);
};
const zero=type=>type==='string'||type==='std::string'?'':type==='char'?{c:'\0'}:type==='double'||type==='float'?{d:0}:type==='bool'?false:0;
const inferType=v=>isObj(v)?v.o.cls:isEn(v)?v.en.type:isFn(v)?'fn':isPtr(v)?'ptr':typeof v==='boolean'?'bool':typeof v==='string'?'string':isC(v)?'char':isD(v)?'double':'int';
function coerce(type,v) {
  if(USER&&USER.handles(type))return USER.coerce(type,v);
  if(isFn(v)||isPtr(v))return v;
  if(isObj(v))throw new Error(`A ${v.o.cls} cannot be stored in ${type}.`);
  if(type==='string'||type==='std::string'){if(typeof v!=='string')throw new Error('A string box needs text in quotes.');return v;}
  if(typeof v==='string')throw new Error(`A ${type} box cannot hold text.`);
  const n=norm(v);
  if(type==='double'||type==='float')return {d:Number(n)};
  if(type==='bool')return !!n;
  if(type==='char')return isC(v)?v:{c:String.fromCharCode(n)};
  return Math.trunc(n);
}
function binop(op,l,r) {
  if((isEn(l)&&l.en.scoped||isEn(r)&&r.en.scoped)&&!['==','!=','<','>','<=','>='].includes(op))throw new Error(`${(isEn(l)?l:r).en.type} is an enum class, so it does not turn into a number by itself. Use static_cast<int>(...).`);
  if(op==='+'&&(typeof l==='string'||typeof r==='string'))return text(l)+text(r);
  if(typeof l==='string'&&typeof r==='string'&&['==','!=','<','>','<=','>='].includes(op))return {'==':l===r,'!=':l!==r,'<':l<r,'>':l>r,'<=':l<=r,'>=':l>=r}[op];
  const a=norm(l),b=norm(r),d=isD(l)||isD(r);
  if(typeof a==='string'||typeof b==='string')throw new Error('Cannot mix text and numbers here.');
  const num=x=>d?{d:x}:x;
  switch(op) {
    case '+':return num(a+b);case '-':return num(a-b);case '*':return num(a*b);
    case '/':if(b===0)throw new Error('Cannot divide by zero.');return d?{d:a/b}:Math.trunc(a/b);
    case '%':if(b===0)throw new Error('Cannot take a remainder by zero.');return a%b;
    case '<<':return a*Math.pow(2,b);case '>>':return Math.floor(a/Math.pow(2,b));case '|':return a|b;
    case '==':return a===b;case '!=':return a!==b;case '<':return a<b;case '>':return a>b;case '<=':return a<=b;case '>=':return a>=b;
  }
  throw new Error(`The operator ${op} is not supported here.`);
}

function run(program,O={}) {
  let scopes=[new Map()];
  const mainScopes=scopes,frames=[],ctx=[],events=[],callStack=[],fns=new Map();let out='',laps=0,loopCount=0,callDepth=0,calls=0,uid=0,retVal;
  const MAX_DEPTH=40,MAX_CALLS=4000;
  program.funcs.forEach(f=>{if(!fns.has(f.name))fns.set(f.name,[]);fns.get(f.name).push(f);});
  const types=new Map(),statics=new Map(),enums=new Map(),heap=new Set();let curObj=null,curCls=null,objId=0,aborting=false;
  const CONSOLE={st:{console:true,kind:'ostream'}};
  mainScopes[0].set('cout',{type:'ostream',value:CONSOLE,hidden:true});
  const LIMIT=Symbol('limit');
  const find=name=>{const r=lookup(name);if(r)return r;throw new Error(`${name} has not been declared yet.`);};
  const dimsOf=arr=>{const d=[];let x=arr;while(Array.isArray(x)){d.push(x.length);x=x[0];}return d;};
  const dataOf=arr=>arr.map(x=>Array.isArray(x)?dataOf(x):show(x));
  const snap=(sc=mainScopes)=>{
    const seen=new Map();sc.forEach(scope=>scope.forEach((rec,name)=>{
      if(rec.hidden)return;
      if(rec.arr){const dims=dimsOf(rec.arr);seen.set(name,{name,kind:'array',type:rec.std?`array<${rec.type},${dims[0]}>`:`${rec.type}${dims.map(d=>`[${d}]`).join('')}`,show:show(rec.arr),data:dataOf(rec.arr),dims,elem:rec.type,std:!!rec.std,objs:rec.arr.some(isObj)?rec.arr.map(x=>isObj(x)?objSnap(x.o):null):undefined});}
      else seen.set(name,{name,kind:isObj(rec.value)?'object':isEn(rec.value)?'enum':isStream(rec.value)?'stream':isFn(rec.value)?'fn':isPtr(rec.value)?'ptr':typeof rec.value==='string'?'string':'scalar',type:rec.type,show:show(rec.value),str:typeof rec.value==='string'?rec.value:undefined,target:isPtr(rec.value)?rec.value.name:undefined,fn:isFn(rec.value)?(rec.value.fn.lambda?'λ':rec.value.fn.name):undefined,obj:isObj(rec.value)?objSnap(rec.value.o):undefined,en:isEn(rec.value)?{type:rec.value.en.type,name:rec.value.en.name,value:rec.value.en.value,names:(types.get(rec.value.en.type)?.items||[]).map(i=>i.name)}:undefined,stream:isStream(rec.value)?streamSnap(rec.value.st):undefined,ptrObj:isPtr(rec.value)&&rec.value.ptr&&isObj(rec.value.ptr.value)?objSnap(rec.value.ptr.value.o):undefined});
    }));
    return [...seen.values()];
  };
  const frame=(kind,label,extra={})=>{if(!O.statements)events.length=0;frames.push({kind,label,vars:snap(),heap:heap.size?snapHeap():undefined,files:fsSnap?fsSnap():undefined,locals:scopes===mainScopes?undefined:snap(scopes),stack:callStack.map(c=>({name:c.name,args:c.args,id:c.id})),callDepth,out,depth:ctx.length,iters:ctx.map(c=>c.n),loops:ctx.map(c=>c.id),...extra});};
  const subst=tokens=>join(tokens.map(t=>{
    if(t.t!=='id')return t;
    try{const rec=find(t.v);return rec.arr||rec.value===undefined?t:{t:'op',v:show(rec.value)};}catch{return t;}
  }));
  const ctrlOf=tokens=>{for(const t of tokens)if(t.t==='id'){try{if(!find(t.v).arr)return t.v;}catch{/* not a variable */}}return '';};
  const truthy=v=>isStream(v)?!v.st.fail&&!v.st.bad:isPtr(v)?!!v.ptr:typeof v==='string'||!!norm(v);

  const lookup=name=>{
    for(let i=scopes.length-1;i>=0;i--)if(scopes[i].has(name))return scopes[i].get(name);
    if(curObj){const r=curObj.fields.get(name);if(r){if(r.access&&r.access!=='public')checkAccess(r,name,curObj);return r;}}
    return staticRec(name);
  };
  const fnValue=name=>{const defs=fns.get(name);if(!defs)return null;return {fn:defs.find(d=>!d.proto)||defs[0]};};
  const sigOf=f=>`${f.ret||'void'} ${f.name}(${f.params.map(q=>`${q.type}${q.ptr?'*':''}${q.byRef?'&':''} ${q.name}`.trim()).join(', ')})`;
  const copyRec=rec=>{
    const dup=x=>Array.isArray(x)?x.map(dup):(x&&typeof x==='object'&&!isFn(x)&&!isPtr(x)?{...x}:x);
    return rec.arr?{...rec,arr:dup(rec.arr)}:{...rec};
  };
  function makeLambda(n) {
    const visible=new Map(),cap=new Map();
    scopes.forEach(sc=>sc.forEach((rec,name)=>visible.set(name,rec)));
    const byCopy=rec=>{const c=copyRec(rec);c.captured=!n.mutable;return c;};
    if(n.caps.def==='=')visible.forEach((rec,name)=>cap.set(name,byCopy(rec)));
    if(n.caps.def==='&')visible.forEach((rec,name)=>cap.set(name,rec));
    n.caps.named.forEach(c=>{
      const rec=visible.get(c.name);
      if(!rec)throw new Error(`${c.name} is not declared yet, so it cannot be captured.`);
      cap.set(c.name,c.ref?rec:byCopy(rec));
    });
    const refs=n.caps.def==='&'?[...cap.keys()]:n.caps.named.filter(c=>c.ref).map(c=>c.name);
    events.push({t:'lambda',caps:[...cap.keys()],refs,params:n.params.map(q=>({type:q.type,name:q.name,byRef:q.byRef,ptr:q.ptr,def:!!q.def}))});
    return {fn:{lambda:true,name:'λ',params:n.params,body:n.body,capScopes:[cap],caps:[...cap.keys()],refs,ret:'auto'}};
  }
  function score(prm,val) {
    const at=inferType(val);
    if(prm.arr)return Array.isArray(val)?3:-1;
    if(prm.ptr)return isPtr(val)||Array.isArray(val)?3:-1;
    if(prm.type==='fn')return isFn(val)?3:-1;
    if(prm.type==='auto')return 1;
    const isStr=t=>t==='string'||t==='std::string',pt=prm.type;
    if(isStr(pt)||at==='string')return isStr(pt)&&at==='string'?3:-1;
    if(pt===at||(pt==='long'&&at==='int')||(pt==='float'&&at==='double')&&false)return 3;
    if(pt==='double'&&at==='float')return 3;
    return 1;
  }
  function callNode(n) {
    const special=callSpecial(n);if(special!==NOCALL)return special;
    const local=lookup(n.name);let f=null,defs=null;
    if(local){
      if(isFn(local.value))f=local.value.fn;
      else if(local.value===undefined)throw new Error(`${n.name} points to no function yet. Point it at one first, for example ${n.name} = add;`);
      else throw new Error(`${n.name} is not a function.`);
    }
    else if(fns.has(n.name))defs=fns.get(n.name);
    else throw new Error(`${n.name} has not been declared yet.`);
    const vals=n.args.map(a=>ev(a));
    let overload=null;
    if(defs) {
      if(Math.min(...defs.map(d=>d.at))>n.at){events.push({t:'undeclared',fn:n.name});throw new Error(`${n.name} is used before it is declared. Write its prototype above main, or define it before main.`);}
      const bodies=defs.filter(d=>!d.proto);
      if(!bodies.length)throw new Error(`${n.name} is declared but never defined. Give it a body.`);
      const fit=bodies.map((d,index)=>{
        const need=d.params.filter(q=>!q.def).length;
        if(vals.length>d.params.length||vals.length<need)return {d,index,score:-1};
        let total=0;for(let i=0;i<vals.length;i++){const sc=score(d.params[i],vals[i]);if(sc<0){total=-1;break;}total+=sc;}
        return {d,index,score:total};
      });
      const ok=fit.filter(x=>x.score>=0);
      if(!ok.length){
        events.push({t:'nomatch',fn:n.name});
        if(bodies.length===1){const d=bodies[0],need=d.params.filter(q=>!q.def).length;
          if(vals.length<need||vals.length>d.params.length)throw new Error(`${n.name} needs ${need===d.params.length?need:`${need} to ${d.params.length}`} value${d.params.length===1?'':'s'} but got ${vals.length}.`);
          throw new Error(`The values given to ${n.name} do not fit its parameters.`);}
        throw new Error(`No version of ${n.name} matches these values.`);
      }
      const best=Math.max(...ok.map(x=>x.score)),top=ok.filter(x=>x.score===best);
      if(top.length>1){events.push({t:'nomatch',fn:n.name,ambiguous:true});throw new Error(`The call ${n.name}(...) is ambiguous: more than one version fits equally well.`);}
      f=top[0].d;overload={index:top[0].index,total:bodies.length};
    }
    return invoke(f,n,vals,overload,local?n.name:f.name);
  }
  function invoke(f,n,vals,overload,label,thisObj=null,cls=null) {
    if(++calls>MAX_CALLS)throw LIMIT;
    if(callDepth>=MAX_DEPTH){events.push({t:'overflow',fn:label,depth:callDepth});throw new Error(`${label} keeps calling itself and never stops (stack overflow). A recursive function needs a base case that stops the calls.`);}
    const scope=new Map(),info=[];
    f.params.forEach((q,i)=>{
      const given=i<vals.length,node=n.args[i];let value=given?vals[i]:ev(q.def);
      if(q.arr||(q.ptr&&Array.isArray(value))){
        if(!Array.isArray(value))throw new Error(`${q.name} needs an array.`);
        scope.set(q.name,{type:q.type,arr:value});info.push({name:q.name,value:show(value),from:node?.k==='var'?node.name:null,array:true});return;
      }
      if(q.ptr){scope.set(q.name,{type:q.type+'*',value,isPtr:true});info.push({name:q.name,value:show(value),ptr:true,from:node?.k==='var'?node.name:null,target:isPtr(value)?value.name:null});return;}
      if(q.byRef){
        if(given&&node?.k==='var'){const rec=find(node.name);scope.set(q.name,aliasFor(rec,q));info.push({name:q.name,value:show(rec.value),byRef:true,from:node.name});return;}
        if(given&&(!node||isObj(value)||isStream(value))){scope.set(q.name,{type:q.type,value,tempRef:true,readOnly:!!q.isConst});info.push({name:q.name,value:show(value),byRef:true,from:null});return;}
        throw new Error(`${q.name} is a reference, so give ${label} a variable, not a plain value.`);
      }
      const type=q.type==='auto'?inferType(value):q.type;
      const cv=type==='fn'?value:coerce(type,value);scope.set(q.name,{type,value:cv,ownsObj:isObj(cv),scope});
      info.push({name:q.name,value:show(value),from:given&&node?.k==='var'?node.name:null,def:!given});
    });
    const id=++uid;
    if(!f.ctor&&!f.dtor)events.push({t:'call',id,fn:label,cls,obj:thisObj?objName(thisObj):null,target:f.name,lambda:!!f.lambda,inline:!!f.inline,args:info,depth:callDepth,overload,caps:f.caps||[],refs:f.refs||[],ret:f.ret||'auto'});
    const saved=scopes,savedRet=retVal,savedObj=curObj,savedCls=curCls;let result;
    if(!f.lambda){curObj=thisObj;curCls=cls;}
    scopes=f.lambda?[...f.capScopes,scope]:[scope];
    callStack.push({name:label,args:info.map(a=>a.value),id});callDepth++;
    try {
      if(f.ctor)ctorPrologue(f,thisObj,cls);
      const r=f.body?exec(f.body):undefined;
      result=r==='return'?retVal:undefined;
      if(r!=='return'&&f.ret&&f.ret!=='void'&&!f.lambda)throw new Error(`${f.name} must give back ${/^[aeiou]/.test(f.ret)?'an':'a'} ${f.ret} value. Add a return line.`);
    } catch(e){aborting=true;throw e;}
    finally {if(!aborting)destroyScope(scope);scopes=saved;callDepth--;callStack.pop();retVal=savedRet;curObj=savedObj;curCls=savedCls;}
    if(f.ret==='void')result=undefined;
    else if(f.ret&&f.ret!=='auto'&&!f.lambda&&result!==undefined&&!f.retRef)result=coerce(f.ret,result);
    if(!f.ctor&&!f.dtor)events.push({t:'return',id,fn:label,value:result===undefined?'':show(result),depth:callDepth});
    return result;
  }

  // ===================== user-defined types =====================
  const NOCALL=Symbol('nocall');
  const SIZES={int:4,unsigned:4,float:4,double:8,char:1,bool:1,long:8,short:2,size_t:8,string:32,auto:4};
  const IOS={'ios::in':1,'ios::out':2,'ios::app':4,'ios::trunc':8,'ios::binary':16,'ios::ate':32};
  let fsSnap=null;
  const objName=o=>o.name||'(temp)';
  const chainOf=cls=>{const out=[];let c=cls;while(c&&types.has(c)){out.unshift(c);c=types.get(c).base;}return out;};
  const derivedFrom=(c,anc)=>chainOf(c).includes(anc);
  const allMembers=cls=>chainOf(cls).flatMap(c=>types.get(c).members.map(m=>({...m,owner:c})));
  function alignOf(type){
    if(type.endsWith('*'))return 8;
    if(types.has(type)){const d=types.get(type);if(d.kind==='enum')return 4;return Math.max(1,...allMembers(type).filter(m=>!m.static).map(m=>m.ptr?8:alignOf(m.type)));}
    return Math.min(8,SIZES[type]||8);
  }
  function sizeOfType(type){
    if(type.endsWith('*'))return 8;
    if(!types.has(type))return SIZES[type]||4;
    const d=types.get(type);if(d.kind==='enum')return 4;
    const mems=allMembers(type).filter(m=>!m.static),count=m=>m.dims.length?m.dims.reduce((a,x)=>a*(x?norm(ev(x)):1),1):1;
    const sz=m=>(m.ptr?8:sizeOfType(m.type))*count(m);
    if(d.kind==='union'){const al=alignOf(type);return Math.ceil(Math.max(...mems.map(sz))/al)*al;}
    let off=0,al=1;for(const m of mems){const a=m.ptr?8:alignOf(m.type);al=Math.max(al,a);off=Math.ceil(off/a)*a+sz(m);}
    return Math.ceil(off/al)*al||1;
  }
  function sizeOfValue(v){
    if(Array.isArray(v))return v.length*(v.length?sizeOfValue(v[0]):4);
    if(isObj(v))return sizeOfType(v.o.cls);
    if(isD(v))return 8;if(isC(v))return 1;if(typeof v==='boolean')return 1;if(typeof v==='string')return 32;if(isPtr(v))return 8;return 4;
  }
  function registerTypes() {
    for(const d of program.types){if(types.has(d.name))throw new Error(`${d.name} is defined twice.`);types.set(d.name,d);}
    for(const d of program.types) {
      if(d.base&&!types.has(d.base))throw new Error(`${d.name} inherits from ${d.base}, but ${d.base} is not defined above it.`);
      if(d.kind==='enum') {
        let v=0;d.enumerators=d.items.map(it=>{if(it.init)v=norm(ev(it.init));const val={en:{type:d.name,name:it.name,value:v,scoped:d.scoped}};v++;enums.set(`${d.name}::${it.name}`,val);if(!d.scoped)enums.set(it.name,val);return val;});
      } else d.members.filter(m=>m.static).forEach(m=>{
        const rec={type:m.type,value:undefined,static:true,defined:false,owner:d.name,access:m.access};
        if(m.init){rec.value=coerce(m.type,ev(m.init));rec.defined=true;}
        statics.set(`${d.name}::${m.name}`,rec);
      });
    }
    program.funcs.filter(f=>f.name.includes('::')).forEach(f=>{
      const [c,mn]=f.name.split('::'),d=types.get(c);if(!d)return;
      const m=d.methods.find(x=>x.name===mn&&x.proto&&x.params.length===f.params.length);if(m){m.body=f.body;m.proto=false;m.params=f.params;}
    });
    USER={handles:t=>types.has(t),coerce:userCoerce};
  }
  function userCoerce(type,v) {
    const d=types.get(type);
    if(d.kind==='enum') {
      if(v===undefined)return v;
      if(isEn(v)){if(v.en.type===type)return v;throw new Error(`${type} cannot hold a ${v.en.type} value.`);}
      if(isObj(v)||typeof v==='string')throw new Error(`${type} cannot hold that value.`);
      const num=norm(v);
      if(d.scoped)throw new Error(`${type} is an enum class, so use a name like ${type}::${d.items[0].name}, not a plain number.`);
      return d.enumerators.find(e=>e.en.value===num)||{en:{type,name:String(num),value:num,scoped:false}};
    }
    if(v===undefined)return v;
    if(isObj(v)){
      if(v.o.cls===type)return {o:cloneObj(v.o)};
      if(derivedFrom(v.o.cls,type)){events.push({t:'slice',from:v.o.cls,to:type});return {o:cloneObj(v.o,type)};}
      throw new Error(`A ${v.o.cls} cannot be stored in a ${type}.`);
    }
    throw new Error(`${type} needs an object, for example ${type} value = {...};`);
  }
  function abstractMethods(cls) {
    const table=new Map();
    for(const c of chainOf(cls))for(const m of types.get(c).methods){if(m.ctor||m.dtor)continue;table.set(`${m.name}/${m.params.length}`,m);}
    return [...table.values()].filter(m=>m.abstract).map(m=>m.name);
  }
  function memberRec(m,owner) {
    const rec={type:m.type,owner,access:m.access};
    if(m.dims.length){const dims=m.dims.map(x=>x?norm(ev(x)):0);rec.arr=build(undefined,dims,m.type);return rec;}
    if(m.ptr){rec.type=m.type+'*';rec.isPtr=true;rec.value=undefined;return rec;}
    const d=types.get(m.type);
    if(d&&d.kind!=='enum')rec.value={o:makeObj(m.type,null)};
    else if(d)rec.value=m.init?coerce(m.type,ev(m.init)):undefined;
    else rec.value=m.init?coerce(m.type,ev(m.init)):(m.type==='string'?'':undefined);
    return rec;
  }
  function makeObj(cls,name) {
    const bad=abstractMethods(cls);
    if(bad.length)throw new Error(`${cls} is abstract: ${bad[0]} has no body yet. Make a child class that writes it, then create that one.`);
    const obj={cls,fields:new Map(),id:++objId,name:name||null};
    if(types.get(cls).kind==='union')obj.u={last:null};
    for(const c of chainOf(cls))for(const m of types.get(c).members){if(m.static)continue;obj.fields.set(m.name,memberRec(m,c));}
    return obj;
  }
  const cloneVal=v=>isObj(v)?{o:cloneObj(v.o)}:v;
  function cloneRec(rec) {
    const c={...rec};
    if(rec.arr)c.arr=rec.arr.map(function dup(x){return Array.isArray(x)?x.map(dup):cloneVal(x);});else c.value=cloneVal(rec.value);
    delete c.ownsObj;delete c.scope;return c;
  }
  function cloneObj(obj,asCls) {
    const keep=asCls?new Set(chainOf(asCls)):null;
    const o={cls:asCls||obj.cls,fields:new Map(),id:++objId,name:null};
    if(obj.u)o.u={last:obj.u.last?{...obj.u.last}:null};
    obj.fields.forEach((rec,name)=>{if(!keep||keep.has(rec.owner))o.fields.set(name,cloneRec(rec));});
    return o;
  }
  function aliasFor(rec,q) {
    const declared=q.type;
    if(!(q.isConst||(types.has(declared)&&rec.type!==declared&&isObj(rec.value))))return rec;
    return {get type(){return declared;},get value(){return rec.value;},set value(v){rec.value=v;},get arr(){return rec.arr;},readOnly:!!q.isConst,target:rec,isAlias:true};
  }
  // ---- static members ----
  function staticChecked(r,full) {
    if(!r.defined&&r.value===undefined)throw new Error(`${full} is declared inside the class but never defined. Add this line below the class:  ${r.type} ${full} = 0;`);
    return r;
  }
  function staticRec(name) {
    const r=statics.get(name);if(r)return staticChecked(r,name);
    if(curCls)for(const c of chainOf(curCls).reverse()){const sr=statics.get(`${c}::${name}`);if(sr)return staticChecked(sr,`${c}::${name}`);}
    return null;
  }
  function specialName(name) {
    if(enums.has(name))return enums.get(name);
    if(name in IOS)return IOS[name];
    return undefined;
  }
  // ---- access control ----
  function checkAccess(rec,name,obj) {
    const acc=rec.access||'public';if(acc==='public')return;
    const owner=rec.owner||obj.cls;
    if(curCls&&(curCls===owner||(acc==='protected'&&derivedFrom(curCls,owner))))return;
    events.push({t:'denied',obj:objName(obj),name,access:acc,owner});
    throw new Error(`${name} is ${acc}${acc==='protected'?', so only the class and its children can use it':', so only the class itself can use it'}. Make it public, or add a getter.`);
  }
  function checkMethodAccess(m,owner,name) {
    const acc=m.access||'public';if(acc==='public')return;
    if(curCls&&(curCls===owner||(acc==='protected'&&derivedFrom(curCls,owner))))return;
    events.push({t:'denied',obj:'',name,access:acc,owner});
    throw new Error(`${name}() is ${acc}, so it cannot be called from here. Make it public.`);
  }
  // ---- member access ----
  function targetObj(n) {
    const base=ev(n.obj);
    if(n.arrow) {
      if(!isPtr(base))throw new Error('-> works on a pointer. Use . on a normal object.');
      if(!base.ptr)throw new Error('This pointer is null: it points to nothing.');
      if(base.ptr.freed)throw new Error('This memory was already deleted. Using it now is a bug.');
      if(!isObj(base.ptr.value))throw new Error('This pointer does not point to an object.');
      return base.ptr.value.o;
    }
    if(isPtr(base))throw new Error('This is a pointer. Use -> instead of .');
    if(!isObj(base))throw new Error(`${show(base)} has no members.`);
    return base.o;
  }
  function fieldRecOf(obj,name) {
    const rec=obj.fields.get(name);if(rec)return rec;
    for(const c of chainOf(obj.cls).reverse()){const sr=statics.get(`${c}::${name}`);if(sr)return staticChecked(sr,`${c}::${name}`);}
    throw new Error(`${obj.cls} has no member called ${name}.`);
  }
  function readField(n) {
    const obj=targetObj(n),rec=fieldRecOf(obj,n.name);
    checkAccess(rec,n.name,obj);
    if(obj.u&&!rec.static)return unionRead(obj,n.name,rec);
    if(!isObj(rec.value))events.push({t:'get',obj:rootName(n),name:n.name,path:pathOf(n),cls:obj.cls,value:rec.arr?show(rec.arr):show(rec.value)});
    if(rec.arr)return rec.arr;
    if(rec.value===undefined)throw new Error(`${n.name} has no value yet. Give it one first.`);
    return rec.value;
  }
  function rootRecOf(t){let x=t;while(x&&(x.k==='field'||x.k==='idx'))x=x.k==='field'?x.obj:x.a;return x&&x.k==='var'?lookup(x.name):null;}
  function assignField(n,t,value) {
    const obj=targetObj(t),rec=fieldRecOf(obj,t.name);
    checkAccess(rec,t.name,obj);
    const rr=rootRecOf(t);if(rr&&rr.readOnly)throw new Error(`${rootName(t)} is const here, so ${t.name} cannot change. Take it by reference without const to change it.`);
    if(rec.arr)throw new Error(`Assign to one item, such as ${t.name}[0].`);
    const old=rec.value,nv=n.op==='='?value:binop(n.op.slice(0,-1),old,value);
    if(obj.u&&!rec.static)return unionWrite(obj,t.name,rec,nv,t);
    rec.value=coerce(rec.type,nv);
    events.push({t:'wset',obj:rootName(t),path:pathOf(t),name:t.name,cls:obj.cls,old:show(old),value:show(rec.value),static:!!rec.static});
    return rec.value;
  }
  function incField(n) {
    const t=n.target,obj=targetObj(t),rec=fieldRecOf(obj,t.name);
    checkAccess(rec,t.name,obj);
    const old=rec.value;rec.value=coerce(rec.type,binop(n.op==='++'?'+':'-',old,1));
    events.push({t:'wset',obj:rootName(t),path:pathOf(t),name:t.name,cls:obj.cls,old:show(old),value:show(rec.value),static:!!rec.static});
    return n.prefix?rec.value:old;
  }
  function assignIdxOnField(n,t,value) {
    const container=ev(t.a),fobj=targetObj(t.a),frec=fieldRecOf(fobj,t.a.name),i=norm(ev(t.i));t.last=i;
    if(!Array.isArray(container))throw new Error(`${t.a.name} is not an array.`);
    if(!Number.isInteger(i)||i<0||i>=container.length){events.push({t:'oob',name:rootName(t),index:i,size:container.length,via:'[]',path:pathOf(t.a)});throw new Error(`Index ${i} is outside the ${container.length} items (valid: 0 to ${container.length-1}).`);}
    const old=container[i];container[i]=coerce(frec.type,n.op==='='?value:binop(n.op.slice(0,-1),old,value));
    events.push({t:'wset',obj:rootName(t),path:pathOf(t),name:t.a.name,cls:fobj.cls,old:show(old),value:show(container[i]),index:i});
    return container[i];
  }
  // ---- unions: one shared box of bytes ----
  function toBytes(type,v) {
    const b=new DataView(new ArrayBuffer(16)),n=norm(v);
    switch(type){case 'float':b.setFloat32(0,n,true);break;case 'double':b.setFloat64(0,n,true);break;case 'char':b.setInt8(0,n);break;case 'bool':b.setInt8(0,+n);break;case 'long':b.setBigInt64(0,BigInt(Math.trunc(n)),true);break;case 'short':b.setInt16(0,n,true);break;default:b.setInt32(0,Math.trunc(n),true);}
    return b;
  }
  function fromBytes(type,view) {
    switch(type){case 'float':return {d:Math.fround(view.getFloat32(0,true))};case 'double':return {d:view.getFloat64(0,true)};case 'char':return {c:String.fromCharCode(view.getUint8(0))};case 'bool':return view.getUint8(0)!==0;case 'long':return Number(view.getBigInt64(0,true));case 'short':return view.getInt16(0,true);default:return view.getInt32(0,true);}
  }
  function unionBytes(obj) {
    const last=obj.u.last;if(!last)return [];const view=toBytes(last.type,last.value),size=sizeOfType(obj.cls);
    return Array.from({length:size},(_,i)=>i<16?view.getUint8(i):0);
  }
  function unionWrite(obj,name,rec,nv,t) {
    rec.value=coerce(rec.type,nv);obj.u.last={name,type:rec.type,value:rec.value};
    events.push({t:'union',op:'write',obj:t?rootName(t):'',name,as:rec.type,value:show(rec.value),bytes:unionBytes(obj)});return rec.value;
  }
  function unionRead(obj,name,rec) {
    const last=obj.u.last;if(!last)throw new Error(`${name} has no value yet: nothing was stored in the union.`);
    const re=last.name!==name,v=re?fromBytes(rec.type,toBytes(last.type,last.value)):rec.value;
    events.push({t:'union',op:'read',name,as:rec.type,from:last.name,value:show(v),bytes:unionBytes(obj),reinterpret:re});return v;
  }
  // ---- snapshots for the scenes ----
  function objSnap(obj,depth=0) {
    const fields=[];
    obj.fields.forEach((rec,name)=>{
      let v=rec.value;
      if(obj.u&&obj.u.last&&obj.u.last.name!==name&&!rec.arr){try{v=fromBytes(rec.type,toBytes(obj.u.last.type,obj.u.last.value));}catch{/* keep */}}
      const f={name,type:rec.arr?`${rec.type}[${rec.arr.length}]`:rec.type,access:rec.access||'public',owner:rec.owner,show:rec.arr?show(rec.arr):show(v),kind:rec.arr?'array':isObj(v)?'object':isEn(v)?'enum':isPtr(v)?'ptr':typeof v==='string'?'string':'scalar'};
      if(isObj(v)&&depth<3)f.obj=objSnap(v.o,depth+1);
      if(rec.arr)f.data=dataOf(rec.arr);
      fields.push(f);
    });
    const stat=[];
    for(const c of chainOf(obj.cls))for(const m of types.get(c).members.filter(x=>x.static)){const r=statics.get(`${c}::${m.name}`);stat.push({name:m.name,type:m.type,owner:c,access:m.access,show:r&&(r.defined||r.value!==undefined)?show(r.value):'?'});}
    return {cls:obj.cls,id:obj.id,name:obj.name,base:types.get(obj.cls).base,union:!!obj.u,last:obj.u?.last?.name,fields,statics:stat,chain:chainOf(obj.cls),destroyed:!!obj.destroyed};
  }
  function snapHeap(){return [...heap].map(r=>({id:r.id,type:r.type,freed:!!r.freed,obj:isObj(r.value)?objSnap(r.value.o):undefined,show:show(r.value)}));}
  function streamSnap(st){return st?{kind:st.kind,path:st.path||null,mode:st.mode||0,open:!!st.open,fail:!!st.fail,eof:!!st.eof,pos:st.pos||0,buf:st.buf||'',str:st.str||'',bytes:st.bbuf?.length||0,console:!!st.console}:null;}
  // ---- declarations of objects ----
  function userDeclare(d,scope) {
    if(d.name.includes('::')) {
      const i=d.name.lastIndexOf('::'),c=d.name.slice(0,i),m=d.name.slice(i+2),rec=statics.get(d.name);
      if(!rec)throw new Error(`${c} has no static member ${m}. Declare it inside the class with the word static.`);
      rec.value=d.init?coerce(rec.type,ev(d.init)):zero(rec.type);rec.defined=true;
      events.push({t:'static-define',cls:c,name:m,value:show(rec.value)});return true;
    }
    const desc=types.get(d.type);
    if(!desc||d.ptr||d.ref||d.fnptr||desc.kind==='enum')return false;
    if(d.arr) {
      const dims=d.dims.map(x=>x?norm(ev(x)):null),items=d.init?.k==='list'?d.init.items:[];
      const size=dims[0]??items.length;
      const arr=Array.from({length:size},(_,i)=>{
        const node=items[i],nm=`${d.name}[${i}]`;
        const obj=node?(node.k==='list'?aggregateInit(d.type,node,nm):(()=>{const v=ev(node);if(!isObj(v))throw new Error(`${d.name} holds ${d.type} objects.`);const c=cloneObj(v.o);c.name=nm;return c;})()):constructObj(d.type,[],nm);
        return {o:obj};
      });
      scope.set(d.name,{type:d.type,arr});events.push({t:'declare',name:d.name,kind:'array',dims:[size],cls:d.type});return true;
    }
    let obj;
    if(d.init&&d.init.k==='list')obj=aggregateInit(d.type,d.init,d.name);
    else if(d.ctorArgs)obj=constructObj(d.type,d.ctorArgs,d.name);
    else if(d.init&&d.init.k==='call'&&d.init.name===d.type)obj=constructObj(d.type,d.init.args,d.name);
    else if(d.init){
      const v=ev(d.init);if(!isObj(v))throw new Error(`${d.name} needs an object of type ${d.type}.`);
      obj=v.o.cls===d.type?cloneObj(v.o):cloneObj(v.o,d.type);obj.name=d.name;events.push({t:'copy',obj:d.name,cls:d.type,from:v.o.name});
    } else obj=constructObj(d.type,[],d.name);
    scope.set(d.name,{type:d.type,value:{o:obj},ownsObj:true,scope});events.push({t:'declare',name:d.name,kind:'object',cls:d.type});
    return true;
  }
  function aggregateInit(type,list,name) {
    const d=types.get(type);
    if(d.methods.some(m=>m.ctor))return constructObj(type,list.items,name);
    const obj=makeObj(type,name),fields=[...obj.fields.entries()].filter(([,r])=>!r.static),shown=[];
    if(list.items.length>fields.length)throw new Error(`Too many values: ${type} has only ${fields.length} member${fields.length===1?'':'s'}.`);
    list.items.forEach((item,i)=>{
      const [fname,rec]=fields[i];
      if(item.k==='list'){
        if(rec.arr){const vals=item.items.map(ev);vals.forEach((x,k)=>{if(k>=rec.arr.length)throw new Error(`${fname} holds only ${rec.arr.length} items.`);rec.arr[k]=coerce(rec.type,x);});shown.push(show(rec.arr));}
        else if(isObj(rec.value)){const sub=aggregateInit(rec.type,item,null);rec.value={o:sub};shown.push(show(rec.value));}
        else throw new Error(`${fname} cannot take a list.`);
      } else {
        const v=ev(item);
        if(obj.u){rec.value=coerce(rec.type,v);obj.u.last={name:fname,type:rec.type,value:rec.value};}
        else rec.value=coerce(rec.type,v);
        shown.push(show(rec.value));
      }
    });
    events.push({t:'construct',cls:type,obj:name?name:'(temp)',args:shown,aggregate:true,id:++uid});
    return obj;
  }
  // ---- constructors and destructors ----
  function constructObj(type,argNodes,name) {
    const obj=makeObj(type,name),vals=argNodes.map(a=>ev(a));
    runCtor(type,obj,vals,{args:argNodes});return obj;
  }
  function pickCtor(cls,ctors,vals) {
    const fit=ctors.map(c=>{
      const need=c.params.filter(q=>!q.def).length;if(vals.length>c.params.length||vals.length<need)return {c,score:-1};
      let t=0;for(let k=0;k<vals.length;k++){const sc=score(c.params[k],vals[k]);if(sc<0){t=-1;break;}t+=sc;}
      return {c,score:t};
    }).filter(x=>x.score>=0);
    if(!fit.length)throw new Error(`No ${cls} constructor fits ${vals.length} value${vals.length===1?'':'s'}. Check the constructor's parameters.`);
    const best=Math.max(...fit.map(x=>x.score)),top=fit.filter(x=>x.score===best);
    if(top.length>1)throw new Error(`The ${cls} constructor call is ambiguous.`);
    return top[0].c;
  }
  function runCtor(cls,obj,vals,n) {
    const d=types.get(cls),ctors=d.methods.filter(m=>m.ctor);
    if(!ctors.length) {
      if(vals.length)throw new Error(`${cls} has no constructor that takes ${vals.length} value${vals.length===1?'':'s'}. Write one, or use curly braces for a plain struct.`);
      if(d.base)runCtor(d.base,obj,[],{args:[]});
      events.push({t:'construct',cls,obj:objName(obj),args:[],implicit:true,id:++uid});return;
    }
    const c=pickCtor(cls,ctors,vals);
    events.push({t:'construct',cls,obj:objName(obj),args:vals.map(show),id:++uid});
    invoke(c,n,vals,null,cls,obj,cls);
  }
  function ctorPrologue(f,obj,cls) {
    const d=types.get(cls),baseInit=(f.inits||[]).find(i=>i.name===d.base);
    if(d.base){const bv=baseInit?baseInit.args.map(ev):[];runCtor(d.base,obj,bv,{args:baseInit?baseInit.args:[]});}
    (f.inits||[]).filter(i=>i.name!==d.base).forEach(i=>{
      const rec=obj.fields.get(i.name);if(!rec)throw new Error(`${i.name} is not a member of ${cls}.`);
      const v=i.args.map(ev)[0];rec.value=coerce(rec.type,v);
      events.push({t:'wset',obj:objName(obj),path:[i.name],name:i.name,cls,old:'?',value:show(rec.value),init:true});
    });
  }
  function destroyObj(obj) {
    if(obj.destroyed)return;obj.destroyed=true;
    const chain=chainOf(obj.cls).reverse();
    if(types.get(obj.cls).kind!=='class'&&!chain.some(c=>types.get(c).methods.some(m=>m.dtor)))return;
    for(const c of chain) {
      const dtor=types.get(c).methods.find(m=>m.dtor);
      events.push({t:'destruct',cls:c,obj:objName(obj),implicit:!dtor||!dtor.body,id:++uid});
      if(dtor&&dtor.body)invoke(dtor,{args:[]},[],null,'~'+c,obj,c);
    }
  }
  function destroyScope(sc) {
    [...sc.entries()].reverse().forEach(([,rec])=>{
      if(rec.ownsObj&&rec.scope===sc&&isObj(rec.value))destroyObj(rec.value.o);
      if(rec.ownsStream&&rec.scope===sc&&isStream(rec.value))closeStream(rec.value.st,true);
    });
  }
  function doNew(n) {
    const d=types.get(n.type);
    if(d&&d.kind!=='enum'){
      const obj=(!d.methods.some(m=>m.ctor)&&n.args.length)?aggregateInit(n.type,{items:n.args},'(heap)'):constructObj(n.type,n.args,'(heap)'),rec={type:n.type,value:{o:obj},heap:true,id:obj.id};
      heap.add(rec);events.push({t:'new',cls:n.type,id:obj.id});return {ptr:rec,name:'(heap)'};
    }
    const rec={type:n.type,value:n.args.length?coerce(n.type,ev(n.args[0])):zero(n.type),heap:true,id:++objId};heap.add(rec);return {ptr:rec,name:'(heap)'};
  }
  function doDelete(n) {
    const v=ev(n.e);
    if(!isPtr(v)||!v.ptr)throw new Error('delete needs a pointer to something that was made with new.');
    const r=v.ptr;if(!r.heap)throw new Error('delete only works on memory that was made with new.');
    if(r.freed)throw new Error('This memory was already deleted. Deleting twice is a bug.');
    events.push({t:'delete',cls:r.type,id:r.id});
    if(isObj(r.value))destroyObj(r.value.o);
    r.freed=true;
  }
  // ---- methods, virtual dispatch and operators ----
  function findMethod(cls,name,vals) {
    for(const c of chainOf(cls).reverse()) {
      const cands=types.get(c).methods.filter(m=>m.name===name&&!m.ctor&&!m.dtor&&(m.body||m.abstract));
      if(!cands.length)continue;
      const fit=cands.map(m=>{
        const need=m.params.filter(q=>!q.def).length;if(vals.length>m.params.length||vals.length<need)return {m,score:-1};
        let t=0;for(let k=0;k<vals.length;k++){const sc=score(m.params[k],vals[k]);if(sc<0){t=-1;break;}t+=sc;}
        return {m,score:t};
      }).filter(x=>x.score>=0);
      if(fit.length){fit.sort((a,b)=>b.score-a.score);return {m:fit[0].m,owner:c};}
    }
    return null;
  }
  const isVirtualIn=(cls,name,arity)=>chainOf(cls).some(c=>types.get(c).methods.some(m=>m.name===name&&m.virt&&m.params.length===arity));
  function dispatchCall(obj,sCls,name,vals,nodes,label) {
    const found=findMethod(sCls,name,vals);
    if(!found)throw new Error(`${sCls} has no method called ${name}${vals.length?` that takes ${vals.length} value${vals.length===1?'':'s'}`:''}.`);
    let {m,owner}=found,via='direct';
    if(!m.stat){
      if(isVirtualIn(sCls,name,m.params.length)){const dyn=findMethod(obj.cls,name,vals);if(dyn){m=dyn.m;owner=dyn.owner;}via=obj.cls!==sCls?'virtual':'direct';}
      else if(obj.cls!==sCls)via='static';
    }
    checkMethodAccess(m,owner,name);
    if(via!=='direct')events.push({t:'dispatch',via,staticCls:sCls,actual:obj.cls,method:name,owner:m.owner});
    return invoke(m,{args:nodes},vals,null,label||name,m.stat?null:obj,m.owner);
  }
  function staticClassOf(n,rec,subject,obj) {
    if(isPtr(subject)){
      if(rec&&typeof rec.type==='string'&&rec.type.endsWith('*'))return rec.type.slice(0,-1);
      if(n.obj.k==='this')return curCls;
      return subject.ptr.type&&types.has(subject.ptr.type)?subject.ptr.type:obj.cls;
    }
    return rec&&types.has(rec.type)?rec.type:obj.cls;
  }
  function userMethod(n,subject,rec,args) {
    const ptr=isPtr(subject);
    if(ptr&&subject.ptr.freed)throw new Error('This object was already deleted. Using it now is a bug.');
    const obj=ptr?subject.ptr.value.o:subject.o,sCls=staticClassOf(n,rec,subject,obj);
    return dispatchCall(obj,sCls,n.name,args,n.args,n.name);
  }
  function callFree(name,vals) {
    const defs=(fns.get(name)||[]).filter(d=>!d.proto);
    if(!defs.length)return NOCALL;
    const fit=defs.map(d=>{if(vals.length!==d.params.length)return {d,score:-1};let t=0;for(let k=0;k<vals.length;k++){const sc=score(d.params[k],vals[k]);if(sc<0){t=-1;break;}t+=sc;}return {d,score:t};}).filter(x=>x.score>=0);
    if(!fit.length)return NOCALL;
    fit.sort((a,b)=>b.score-a.score);
    return invoke(fit[0].d,{args:[]},vals,null,name);
  }
  function userOp(op,l,r) {
    const name='operator'+op;
    if(isObj(l)){
      const f=findMethod(l.o.cls,name,[r]);
      if(f){events.push({t:'operator',op,cls:l.o.cls});checkMethodAccess(f.m,f.owner,name);return invoke(f.m,{args:[]},[r],null,name,l.o,f.owner);}
    }
    const res=callFree(name,[l,r]);
    if(res!==NOCALL){events.push({t:'operator',op,cls:isObj(l)?l.o.cls:r.o.cls});return res;}
    throw new Error(`The operator ${op} does not know how to work with ${isObj(l)?l.o.cls:r.o.cls} yet. Write operator${op} for it.`);
  }
  function callSpecial(n) {
    const name=n.name;
    if(types.has(name)&&types.get(name).kind!=='enum'){const obj=constructObj(name,n.args,null);return {o:obj};}
    const qi=name.lastIndexOf('::');
    if(qi>0&&types.has(name.slice(0,qi))) {
      const c=name.slice(0,qi),m=name.slice(qi+2),vals=n.args.map(a=>ev(a)),f=findMethod(c,m,vals);
      if(!f)throw new Error(`${c} has no method called ${m}.`);
      if(!f.m.stat&&!curObj)throw new Error(`${c}::${m} is not static, so call it on an object: obj.${m}().`);
      checkMethodAccess(f.m,f.owner,m);
      return invoke(f.m,{args:n.args},vals,null,name,f.m.stat?null:curObj,f.owner);
    }
    if(curObj&&!lookup(name)&&chainOf(curCls).some(c=>types.get(c).methods.some(m=>m.name===name&&!m.ctor&&!m.dtor))) {
      const vals=n.args.map(a=>ev(a));return dispatchCall(curObj,curCls,name,vals,n.args,name);
    }
    return builtinCall?builtinCall(n):NOCALL;
  }
  // ===================== files and string streams =====================
  const fsMap=new Map([['numbers.txt',{text:'10 20 30\n',sample:true}],['names.txt',{text:'Ann\nBob\nCy\n',sample:true}],['scores.csv',{text:'Ann,90\nBob,85\nCy,70\n',sample:true}]]);
  const FILE_KINDS=new Set(['ifstream','ofstream','fstream']),SS_KINDS=new Set(['stringstream','istringstream','ostringstream']);
  const streamsOn=!!(O.includes&&(O.includes.has('fstream')||O.includes.has('sstream')));
  fsSnap=streamsOn?()=>[...fsMap.entries()].map(([name,f])=>({name,text:f.text||'',bytes:f.bytes?[...f.bytes]:undefined,created:!f.sample,sample:!!f.sample})):null;
  const modeName=f=>['in','out','app','trunc','binary','ate'].filter((_,i)=>f&(1<<i)).join('|')||'in';
  function requireInclude(kind) {
    const header=FILE_KINDS.has(kind)?'fstream':'sstream';
    if(O.includes&&!O.includes.has(header)){events.push({t:'noinclude',header,type:kind});throw new Error(`${kind} is not known here. Add  #include <${header}>  at the top of the file.`);}
  }
  const newStream=kind=>({kind,path:null,mode:0,open:false,fail:false,eof:false,bad:false,pos:0,buf:'',bbuf:[],str:'',varName:''});
  function flagsOf(kind,given) {
    const base=kind==='ifstream'?1:kind==='ofstream'?2:3;
    if(given===undefined)return base;
    let f=norm(given);if(kind==='ifstream')f|=1;if(kind==='ofstream')f|=2;return f;
  }
  function openStream(S,path,given) {
    S.mode=flagsOf(S.kind,given);S.path=path;S.pos=0;S.buf='';S.bbuf=[];S.eof=false;
    const existed=fsMap.has(path),pureIn=(S.mode&1)&&!(S.mode&(2|4));let truncated=false;
    if(pureIn) {
      if(!existed){S.open=false;S.fail=true;events.push({t:'fopen',path,mode:modeName(S.mode),ok:false,reason:'missing',stream:S.varName});return;}
    } else {
      if(path.includes('/')){S.open=false;S.fail=true;events.push({t:'fopen',path,mode:modeName(S.mode),ok:false,reason:'folder',stream:S.varName});return;}
      if(!existed)fsMap.set(path,{text:''});
      else if(!(S.mode&4)&&!((S.mode&1)&&(S.mode&2)&&!(S.mode&8))){const f=fsMap.get(path);if(f.text||f.bytes)truncated=true;f.text='';f.bytes=null;}
    }
    S.open=true;S.fail=false;
    events.push({t:'fopen',path,mode:modeName(S.mode),ok:true,existed,truncated,stream:S.varName,binary:!!(S.mode&16)});
  }
  function flushStream(S) {
    if(!S.open||!S.path)return;
    const f=fsMap.get(S.path);if(!f)return;
    if(S.buf){f.text=(f.text||'')+S.buf;events.push({t:'fflush',path:S.path,text:S.buf,stream:S.varName});S.buf='';}
    if(S.bbuf.length){f.bytes=[...(f.bytes||[]),...S.bbuf];events.push({t:'fflush',path:S.path,bytes:[...S.bbuf],stream:S.varName});S.bbuf=[];}
  }
  function closeStream(S,implicit) {
    if(!S.open){if(!implicit)S.fail=true;return;}
    flushStream(S);S.open=false;events.push({t:'fclose',path:S.path,implicit:!!implicit,stream:S.varName});
  }
  function streamDeclare(d,scope) {
    requireInclude(d.type);
    const S=newStream(d.type);S.varName=d.name;
    scope.set(d.name,{type:d.type,value:{st:S},ownsStream:true,scope});
    if(d.ctorArgs&&d.ctorArgs.length){
      const vals=d.ctorArgs.map(a=>ev(a));
      if(SS_KINDS.has(d.type)){S.str=text(vals[0]);S.open=true;}else openStream(S,text(vals[0]),vals[1]);
    } else if(SS_KINDS.has(d.type))S.open=true;
    events.push({t:'declare',name:d.name,kind:'stream',stream:d.type});
    return true;
  }
  function writeTo(stream,txt,endl) {
    const S=stream.st;
    if(S.console){out+=txt;return;}
    if(SS_KINDS.has(S.kind)){S.str+=txt;events.push({t:'swrite',stream:S.varName,text:txt});return;}
    if(!S.open||!(S.mode&(2|4))){S.fail=true;events.push({t:'fwrite',path:S.path,text:txt,ok:false,stream:S.varName});return;}
    S.buf+=txt;events.push({t:'fwrite',path:S.path,text:txt,ok:true,buffered:true,stream:S.varName});
    if(endl)flushStream(S);
  }
  function execInsert(n) {
    const tname=n.target,rec=tname==='cout'?null:lookup(tname),stream=tname==='cout'?CONSOLE:(rec?rec.value:undefined);
    if(!isStream(stream))throw new Error(`${tname} is not a stream, so << cannot send things to it.`);
    const before=out.length;
    for(const item of n.items) {
      const v=ev(item);
      if(isObj(v)){if(callFree('operator<<',[stream,v])===NOCALL)throw new Error(`cout does not know how to print a ${v.o.cls}. Print its members one by one, or write operator<< for it.`);continue;}
      writeTo(stream,text(v),item.k==='var'&&item.name==='endl');
    }
    if(tname==='cout')events.push({t:'print',text:out.slice(before)});
  }
  function streamInsert(l,r){writeTo(l,text(r));return l;}
  const readText=S=>SS_KINDS.has(S.kind)?S.str:(fsMap.get(S.path)?.text||'');
  const canRead=S=>SS_KINDS.has(S.kind)||(S.open&&(S.mode&1));
  function lvalueType(node) {
    if(node.k==='var')return find(node.name).type;
    if(node.k==='idx'){let x=node;while(x.k==='idx')x=x.a;return x.k==='var'?find(x.name).type:'int';}
    if(node.k==='field')return fieldRecOf(targetObj(node),node.name).type;
    throw new Error('>> needs a variable on its right, such as in >> x;');
  }
  const assignTo=(node,value)=>ev({k:'assign',op:'=',target:node,e:{k:'constval',v:value}});
  function extract(l,node) {
    const S=l.st;
    if(S.console)throw new Error('Reading from the keyboard (cin) is not used in this scene.');
    if(!canRead(S)){S.fail=true;events.push({t:'fread',path:S.path,ok:false,closed:true,stream:S.varName});return l;}
    if(S.fail)return l;
    const data=readText(S);let i=S.pos;
    while(i<data.length&&/\s/.test(data[i]))i++;
    if(i>=data.length){S.pos=data.length;S.eof=true;S.fail=true;events.push({t:'fread',path:S.path,ok:false,eof:true,from:i,stream:S.varName});return l;}
    const type=lvalueType(node);let value,end=i,ok=true,tokenText;
    if(type==='string'){let j=i;while(j<data.length&&!/\s/.test(data[j]))j++;tokenText=data.slice(i,j);value=tokenText;end=j;}
    else if(type==='char'){tokenText=data[i];value={c:data[i]};end=i+1;}
    else if(type==='double'||type==='float'){const m=/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(data.slice(i));if(m){value={d:parseFloat(m[0])};end=i+m[0].length;tokenText=m[0];}else{ok=false;value={d:0};tokenText=data.slice(i).split(/\s/)[0];}}
    else {const m=/^[+-]?\d+/.exec(data.slice(i));if(m){value=parseInt(m[0],10);end=i+m[0].length;tokenText=m[0];}else{ok=false;value=0;tokenText=data.slice(i).split(/\s/)[0];}}
    if(!ok)S.fail=true;else{S.pos=end;if(end>=data.length)S.eof=true;}
    assignTo(node,value);
    events.push({t:'fread',path:S.path,token:tokenText,type,value:show(value),from:i,to:ok?end:i,ok,stream:S.varName,eof:S.eof});
    return l;
  }
  function streamMethod(n,subject,args) {
    const S=subject.st,name=n.name,path=S.path,note=(m,res)=>events.push({t:'fcheck',path,method:m,result:res,stream:S.varName});
    switch(name) {
      case 'open':{if(S.open){S.fail=true;note('open',false);return undefined;}openStream(S,text(args[0]),args[1]);return undefined;}
      case 'close':closeStream(S,false);return undefined;
      case 'is_open':note('is_open',S.open);return S.open;
      case 'eof':note('eof',S.eof);return S.eof;
      case 'fail':{const r=S.fail||S.bad;note('fail',r);return r;}
      case 'bad':note('bad',S.bad);return S.bad;
      case 'good':{const g=!S.fail&&!S.eof&&!S.bad&&(S.open||SS_KINDS.has(S.kind));note('good',g);return g;}
      case 'clear':S.fail=false;S.eof=false;S.bad=false;return undefined;
      case 'flush':flushStream(S);return undefined;
      case 'str':if(args.length){S.str=text(args[0]);S.pos=0;return undefined;}return S.str;
      case 'seekg':S.pos=norm(args[0]);S.eof=false;S.fail=false;events.push({t:'fseek',path,pos:S.pos,stream:S.varName});return undefined;
      case 'tellg':return S.pos;
      case 'put':writeTo(subject,text(args[0]));return subject;
      case 'get': {
        if(!canRead(S)||S.fail){S.fail=true;return -1;}
        const data=readText(S);if(S.pos>=data.length){S.eof=true;S.fail=true;return -1;}
        const ch=data[S.pos++];events.push({t:'fread',path,token:ch,type:'char',value:show({c:ch}),from:S.pos-1,to:S.pos,ok:true,stream:S.varName});return {c:ch};
      }
      case 'write': {
        const ptrV=args[0],size=norm(args[1]);
        if(!isPtr(ptrV)||!ptrV.ptr)throw new Error('write needs the address of a variable, such as (char*)&n.');
        if(!S.open||!(S.mode&(2|4))){S.fail=true;return undefined;}
        const view=toBytes(ptrV.ptr.type,ptrV.ptr.value),bytes=Array.from({length:size},(_,i)=>i<16?view.getUint8(i):0);
        S.bbuf.push(...bytes);events.push({t:'fwrite',path,binary:true,bytes,ok:true,buffered:true,text:'',stream:S.varName});return undefined;
      }
      case 'read': {
        const ptrV=args[0],size=norm(args[1]),f=fsMap.get(path);
        if(!isPtr(ptrV)||!ptrV.ptr)throw new Error('read needs the address of a variable, such as (char*)&n.');
        if(!S.open||!f||!f.bytes||S.pos+size>f.bytes.length){S.fail=true;S.eof=true;return undefined;}
        const view=new DataView(new ArrayBuffer(16));f.bytes.slice(S.pos,S.pos+size).forEach((b,i)=>view.setUint8(i,b));
        ptrV.ptr.value=fromBytes(ptrV.ptr.type,view);events.push({t:'fread',path,binary:true,bytes:f.bytes.slice(S.pos,S.pos+size),value:show(ptrV.ptr.value),from:S.pos,to:S.pos+size,ok:true,type:ptrV.ptr.type,stream:S.varName});S.pos+=size;return undefined;
      }
    }
    throw new Error(`.${name}() is not available on this stream.`);
  }
  function builtinCall(n) {
    switch(n.name) {
      case 'getline': {
        const st=ev(n.args[0]);if(!isStream(st))throw new Error('getline needs a stream to read from, such as getline(file, line);');
        const S=st.st,delim=n.args[2]?text(ev(n.args[2])):'\n';
        if(S.console)throw new Error('Reading from the keyboard (cin) is not used in this scene.');
        if(!canRead(S)){S.fail=true;events.push({t:'fgetline',path:S.path,ok:false,closed:true,stream:S.varName});return st;}
        if(S.fail)return st;
        const data=readText(S);
        if(S.pos>=data.length){S.eof=true;S.fail=true;events.push({t:'fgetline',path:S.path,ok:false,eof:true,stream:S.varName});return st;}
        const from=S.pos;let j=data.indexOf(delim,S.pos),line;
        if(j<0){line=data.slice(S.pos);S.pos=data.length;S.eof=true;}else{line=data.slice(S.pos,j);S.pos=j+1;}
        assignTo(n.args[1],line);
        events.push({t:'fgetline',path:S.path,line,from,to:S.pos,ok:true,stream:S.varName,delim:delim==='\n'?'\\n':delim});
        return st;
      }
      case 'stoi':case 'atoi': {
        const sv=text(ev(n.args[0])),m=/^\s*[+-]?\d+/.exec(sv);
        if(!m)throw new Error(`stoi cannot turn "${sv}" into a whole number.`);
        events.push({t:'convert',fn:'stoi',from:sv,value:parseInt(m[0],10)});return parseInt(m[0],10);
      }
      case 'stod': {
        const sv=text(ev(n.args[0])),m=/^\s*[+-]?(\d+\.?\d*|\.\d+)/.exec(sv);
        if(!m)throw new Error(`stod cannot turn "${sv}" into a number.`);
        events.push({t:'convert',fn:'stod',from:sv,value:parseFloat(m[0])});return {d:parseFloat(m[0])};
      }
      case 'to_string':return text(ev(n.args[0]));
    }
    return NOCALL;
  }
  const rootName=n=>n.k==='var'?n.name:n.k==='idx'?rootName(n.a):n.k==='method'||n.k==='field'?rootName(n.obj):n.k==='this'?'this':'';
  const pathOf=n=>n.k==='idx'?[...pathOf(n.a),n.last]:n.k==='field'?[...pathOf(n.obj),n.name]:[];
  function callMethod(n) {
    const o=n.obj,args=n.args.map(ev),rec=o.k==='var'?find(o.name):null,name=rootName(n);
    const subject=rec?(rec.arr||rec.value):ev(o);
    if(subject===undefined)throw new Error(`Give ${name} a value first.`);
    if(isObj(subject)||(isPtr(subject)&&subject.ptr&&isObj(subject.ptr.value)))return userMethod(n,subject,rec,args);
    if(isPtr(subject)&&!subject.ptr)throw new Error('This pointer is null: it points to nothing.');
    if(isStream(subject))return streamMethod(n,subject,args);
    const isStr=typeof subject==='string',len=subject.length,num=i=>norm(args[i]);
    const bad=(msg,extra={})=>{events.push({t:'oob',name,via:n.name,...extra});throw new Error(msg);};
    const mutate=value=>{rec.value=value;return value;};
    const note=(op,extra={})=>events.push({t:'method',name,op,...extra});
    switch(n.name) {
      case 'size':case 'length':note('size',{n:len});return len;
      case 'empty':note('empty',{n:len});return len===0;
      case 'at': {
        const i=num(0);if(!Number.isInteger(i)||i<0||i>=len)bad(`at(${i}) throws out_of_range: valid indexes are 0 to ${len-1}.`,{index:i,size:len,path:[]});
        const v=isStr?{c:subject[i]}:subject[i];events.push({t:'read',name,path:[i],value:show(v),via:'at'});return v;
      }
    }
    if(!isStr)throw new Error(`.${n.name}() is not supported for this array in the scene.`);
    const piece=i=>text(args[i]);
    switch(n.name) {
      case 'substr': {
        const pos=num(0),count=args.length>1?num(1):len-pos;
        if(pos>len)bad(`substr: position ${pos} is past the end (length ${len}).`,{index:pos,size:len,path:[]});
        const result=subject.substr(pos,count);note('substr',{pos,len:Math.min(count,len-pos),result,before:subject});return result;
      }
      case 'find': {
        const needle=piece(0),from=args.length>1?num(1):0,at=subject.indexOf(needle,from);note('find',{needle,from,result:at<0?'npos':at,before:subject});return at<0?NPOS:at;
      }
      case 'append':case 'push_back': {const add=piece(0);const after=mutate(subject+add);note('append',{text:add,before:subject,after});return after;}
      case 'pop_back': {if(!len)bad('pop_back on an empty string.');const after=mutate(subject.slice(0,-1));note('erase',{pos:len-1,len:1,before:subject,after});return after;}
      case 'clear': {const after=mutate('');note('erase',{pos:0,len,before:subject,after});return after;}
      case 'insert': {
        const pos=num(0),add=piece(1);if(pos>len)bad(`insert: position ${pos} is past the end (length ${len}).`,{index:pos,size:len,path:[]});
        const after=mutate(subject.slice(0,pos)+add+subject.slice(pos));note('insert',{pos,text:add,before:subject,after});return after;
      }
      case 'erase': {
        const pos=num(0),count=args.length>1?num(1):len-pos;if(pos>len)bad(`erase: position ${pos} is past the end (length ${len}).`,{index:pos,size:len,path:[]});
        const cut=Math.min(count,len-pos),after=mutate(subject.slice(0,pos)+subject.slice(pos+cut));note('erase',{pos,len:cut,before:subject,after});return after;
      }
      case 'replace': {
        const pos=num(0),count=num(1),add=piece(2);if(pos>len)bad(`replace: position ${pos} is past the end (length ${len}).`,{index:pos,size:len,path:[]});
        const cut=Math.min(count,len-pos),after=mutate(subject.slice(0,pos)+add+subject.slice(pos+cut));note('replace',{pos,len:cut,text:add,before:subject,after});return after;
      }
    }
    throw new Error(`.${n.name}() is not supported in this scene.`);
  }
  function ev(n) {
    switch(n.k) {
      case 'num':return n.f?{d:n.v}:n.v;
      case 'str':return n.v;
      case 'chr':return {c:n.v};
      case 'bool':return n.v;
      case 'var': {
        if(n.name==='endl'||n.name==='std::endl')return '\n';
        if(n.name==='string::npos'||n.name==='std::string::npos')return NPOS;
        const rec=lookup(n.name);
        if(!rec){const sv=specialName(n.name);if(sv!==undefined)return sv;const fv=fnValue(n.name);if(fv)return fv;throw new Error(`${n.name} has not been declared yet.`);}
        if(rec.static&&rec.access&&rec.access!=='public')checkAccess(rec,n.name,{cls:rec.owner});
        if(rec.arr)return rec.arr;
        if(rec.value===undefined)throw new Error(`Give ${n.name} a value first.`);
        return rec.value;
      }
      case 'idx': {
        const base=ev(n.a),i=norm(ev(n.i)),size=base.length;n.last=i;
        if(!Number.isInteger(i)||i<0||i>=size){events.push({t:'oob',name:rootName(n),index:i,size,via:'[]',path:pathOf(n.a)});throw new Error(`Index ${i} is outside the ${size} items (valid: 0 to ${size-1}).`);}
        const value=typeof base==='string'?{c:base[i]}:base[i];
        if(!Array.isArray(value))events.push({t:'read',name:rootName(n),path:[...pathOf(n.a),i],value:show(value),via:'[]'});
        return value;
      }
      case 'method':return callMethod(n);
      case 'call':return callNode(n);
      case 'this':{if(!curObj)throw new Error('this only exists inside a class method.');return {ptr:{type:curCls+'*',value:{o:curObj}},name:'this'};}
      case 'null':return {ptr:null,name:'nullptr'};
      case 'constval':return n.v;
      case 'sizeof':return n.type?sizeOfType(n.type):sizeOfValue(ev(n.e));
      case 'cast2':{const v=ev(n.e);return n.ptr?v:coerce(n.type,v);}
      case 'field':return readField(n);
      case 'new':return doNew(n);
      case 'lambda':return makeLambda(n);
      case 'cast':return coerce(n.type,ev(n.e));
      case 'addr': {
        if(n.e.k!=='var')throw new Error('& needs a variable, such as &x.');
        const rec=find(n.e.name);return {ptr:rec,name:n.e.name};
      }
      case 'deref': {
        const v=ev(n.e);if(!isPtr(v))throw new Error('* needs a pointer.');
        if(!v.ptr)throw new Error('This pointer is null: it points to nothing.');
        if(v.ptr.freed)throw new Error('This memory was already deleted.');
        if(!isObj(v.ptr.value))events.push({t:'read',name:v.name,path:[],value:show(v.ptr.value),via:'*'});return v.ptr.value;
      }
      case 'un': {const v=ev(n.e);if(n.op==='!')return !truthy(v);if(n.op==='-')return isD(v)?{d:-v.d}:-norm(v);return v;}
      case 'bin': {
        if(n.op==='&&'){const l=ev(n.l);return truthy(l)?truthy(ev(n.r)):false;}
        if(n.op==='||'){const l=ev(n.l);return truthy(l)?true:truthy(ev(n.r));}
        {const l=ev(n.l);if(n.op==='>>'&&isStream(l))return extract(l,n.r);const r=ev(n.r);if(isObj(l)||isObj(r))return userOp(n.op,l,r);if(isStream(l)&&n.op==='<<')return streamInsert(l,r);return binop(n.op,l,r);}
      }
      case 'cond':return truthy(ev(n.c))?ev(n.a):ev(n.b);
      case 'assign': {
        const value=ev(n.e),t=n.target;
        if(t.k==='field')return assignField(n,t,value);
        if(t.k==='deref') {
          const pv=ev(t.e);if(!isPtr(pv))throw new Error('* needs a pointer.');
          const rec=pv.ptr,old=rec.value;rec.value=coerce(rec.type,n.op==='='?value:binop(n.op.slice(0,-1),old,value));
          events.push({t:'write',name:pv.name,path:[],old:show(old),value:show(rec.value),via:'*'});return rec.value;
        }
        if(t.k==='idx'&&t.a.k==='field')return assignIdxOnField(n,t,value);
        if(t.k==='idx') {
          const root=find(rootName(t)),name=rootName(t),i=norm(ev(t.i));t.last=i;
          if(!root.arr&&typeof root.value==='string'&&t.a.k==='var'){
            if(!Number.isInteger(i)||i<0||i>=root.value.length){events.push({t:'oob',name,index:i,size:root.value.length,via:'[]',path:[]});throw new Error(`Index ${i} is outside the ${root.value.length} letters (valid: 0 to ${root.value.length-1}).`);}
            const before=root.value,ch=text(coerce('char',value));root.value=before.slice(0,i)+ch+before.slice(i+1);
            events.push({t:'write',name,path:[i],old:show({c:before[i]}),value:show({c:ch}),via:'[]'});return {c:ch};
          }
          if(!root.arr)throw new Error('Only arrays can be changed with [ ].');
          const container=t.a.k==='var'?root.arr:ev(t.a);
          if(!Number.isInteger(i)||i<0||i>=container.length){events.push({t:'oob',name,index:i,size:container.length,via:'[]',path:pathOf(t.a),write:true});throw new Error(`Index ${i} is outside the ${container.length} items (valid: 0 to ${container.length-1}).`);}
          const old=container[i];container[i]=coerce(root.type,n.op==='='?value:binop(n.op.slice(0,-1),old,value));
          events.push({t:'write',name,path:[...pathOf(t.a),i],old:show(old),value:show(container[i]),via:'[]'});return container[i];
        }
        const rec=find(t.name);
        if(rec.arr)throw new Error('Assign to one item, such as a[0].');
        if(rec.isConst)throw new Error(`${t.name} is const and cannot change.`);
        if(rec.readOnly)throw new Error(`${t.name} is const here, so it cannot change. Take it by reference without const to change it.`);
        if(rec.captured)throw new Error(`${t.name} was captured by copy, so it cannot be changed. Capture it by reference instead: [&${t.name}].`);
        const beforeValue=rec.value;
        rec.value=coerce(rec.type,n.op==='='?value:binop(n.op.slice(0,-1),rec.value===undefined?(()=>{throw new Error(`Give ${t.name} a value first.`);})():rec.value,value));
        if(typeof rec.value==='string'&&n.op==='+=')events.push({t:'method',name:t.name,op:'append',text:text(value),before:beforeValue,after:rec.value});
        else if(typeof rec.value==='string')events.push({t:'method',name:t.name,op:'assign',before:beforeValue,after:rec.value});
        if(typeof rec.value!=='string')events.push({t:'set',name:t.name,old:show(beforeValue),value:show(rec.value),static:rec.static?rec.owner:undefined});
        return rec.value;
      }
      case 'inc': {
        if(n.target.k==='field')return incField(n);
        if(n.target.k!=='var')throw new Error('Use ++ or -- on a variable.');
        const rec=find(n.target.name);
        if(rec.value===undefined)throw new Error(`Give ${n.target.name} a value first.`);
        if(rec.captured)throw new Error(`${n.target.name} was captured by copy, so it cannot be changed. Capture it by reference instead: [&${n.target.name}].`);
        const old=rec.value;rec.value=coerce(rec.type,binop(n.op==='++'?'+':'-',old,1));
        events.push({t:'set',name:n.target.name,old:show(old),value:show(rec.value)});
        return n.prefix?rec.value:old;
      }
    }
    throw new Error('That expression is not supported in this scene.');
  }
  const listValue=n=>n.k==='list'?n.items.map(listValue):ev(n);
  function build(values,dims,type,level=0) {
    const size=dims[level]??values?.length??0;
    return Array.from({length:size},(_,i)=>{
      const item=values?.[i];
      if(level<dims.length-1)return build(Array.isArray(item)?item:undefined,dims,type,level+1);
      return coerce(type,item===undefined?zero(type):item);
    });
  }
  function declare(d) {
    const scope=scopes.at(-1);
    if(!d.name.includes('::')&&scope.has(d.name))throw new Error(`${d.name} is already declared in this scope.`);
    if(STREAMS.has(d.type)&&!d.ptr&&!d.ref&&!d.arr&&streamDeclare(d,scope))return;
    if(userDeclare(d,scope))return;
    if(d.fnptr){scope.set(d.name,{type:'fn',value:d.init?ev(d.init):undefined});events.push({t:'declare',name:d.name,kind:'fn'});return;}
    if(d.ref){
      if(!d.init||d.init.k!=='var')throw new Error('A reference must be set to a variable, such as int& r = x;');
      scope.set(d.name,aliasFor(find(d.init.name),{type:d.type}));events.push({t:'declare',name:d.name,kind:'alias',of:d.init.name});return;
    }
    if(d.ptr&&!d.arr){
      scope.set(d.name,{type:d.type+'*',value:d.init?ev(d.init):undefined,isPtr:true});events.push({t:'declare',name:d.name,kind:'ptr'});return;
    }
    if(d.arr) {
      const type=d.type==='auto'?'int':d.type;let values=d.init?listValue(d.init):undefined;
      const dims=d.dims.map(x=>x?norm(ev(x)):null);
      if(typeof values==='string'&&type==='char'){values=[...values].map(c=>({c}));values.push({c:'\0'});}
      if(dims[0]===null){if(!values)throw new Error('Give the array a size or a { } list.');dims[0]=values.length;}
      if(Array.isArray(values)&&values.length>dims[0])throw new Error(type==='char'&&typeof d.init?.v==='string'?`No room for the \\0 end mark: "${d.init.v}" needs ${values.length} slots but ${d.name} has only ${dims[0]}.`:`Too many values: ${name(d)} holds only ${dims[0]}.`);
      const inner=dims.slice(1).map((x,i)=>x??(Array.isArray(values?.[0])?values[0].length:0));
      const shape=[dims[0],...inner],arr=build(values,shape,type);
      scope.set(d.name,{type,arr,std:d.std});events.push({t:'declare',name:d.name,kind:'array',dims:shape});return;
    }
    let value=d.init?(d.init.k==='list'?ev(d.init.items[0]):ev(d.init)):undefined;
    const type=d.type==='auto'?inferType(value):d.type;
    scope.set(d.name,{type,value:value===undefined?(type==='string'||type==='std::string'?'':undefined):coerce(type,value)});
    events.push({t:'declare',name:d.name,kind:type==='string'||type==='std::string'?'string':'scalar'});
  }
  const name=d=>d.name;
  function describe(n,evs) {
    const e=evs.find(x=>x.t==='declare'),w=evs.find(x=>x.t==='write'),r=evs.find(x=>x.t==='read'),m=evs.find(x=>x.t==='method'),pr=evs.find(x=>x.t==='print');
    const at=x=>`${x.name}${x.path.map(i=>`[${i}]`).join('')}`;
    const dEv=evs.find(x=>x.t==='define'),cEv=evs.find(x=>x.t==='call'),rEvs=evs.filter(x=>x.t==='return'),oEv=evs.find(x=>x.t==='overflow');
    if(dEv)return dEv.proto?`Announce ${dEv.sig}`:`Build the machine ${dEv.sig}`;
    if(oEv)return `${oEv.fn} keeps calling itself and never stops`;
    if(cEv)return `Call ${cEv.fn}(${cEv.args.map(a=>a.value).join(', ')})${rEvs.length&&rEvs.at(-1).value!==''?` and get ${rEvs.at(-1).value}`:''}${pr?`, then print ${JSON.stringify(pr.text.replace(/\n/g,'↵'))}`:''}`;
    const tyE=evs.find(x=>x.t==='type'),csE=evs.find(x=>x.t==='construct'&&x.obj!=='(temp)')||evs.find(x=>x.t==='construct'),dsE=evs.find(x=>x.t==='destruct'),wsE=evs.find(x=>x.t==='wset'),gtE=evs.find(x=>x.t==='get'),unE=evs.find(x=>x.t==='union'),nwE=evs.find(x=>x.t==='new'),dlE=evs.find(x=>x.t==='delete'),dnE=evs.find(x=>x.t==='denied'),dpE=evs.find(x=>x.t==='dispatch'),stE=evs.find(x=>x.t==='static-define');
    const fo=evs.find(x=>x.t==='fopen'),fc=evs.find(x=>x.t==='fclose'),fg=evs.find(x=>x.t==='fgetline'),fr=evs.find(x=>x.t==='fread'),fw=evs.find(x=>x.t==='fwrite'),fk=evs.find(x=>x.t==='fcheck'),ni=evs.find(x=>x.t==='noinclude'),cv=evs.find(x=>x.t==='convert');
    if(ni)return `${ni.type} needs #include <${ni.header}>`;
    if(fo)return fo.ok?`Open "${fo.path}" (${fo.mode})${fo.truncated?', old content wiped':''}`:`Could not open "${fo.path}"${fo.reason==='missing'?': the file does not exist':''}`;
    if(fc)return `Close "${fc.path}"${fc.implicit?' (the stream ended)':''}`;
    if(fg&&!pr)return fg.ok?`Read one line: ${JSON.stringify(fg.line)}`:'No line to read: the end of the file';
    if(fr&&!pr&&!fg)return fr.ok?`Read ${JSON.stringify(fr.token)} from "${fr.path}"`:(fr.eof?'Nothing left to read: the end of the file':'Reading failed');
    if(fw&&!pr)return fw.ok?`Write ${JSON.stringify(fw.text)} to "${fw.path}" (waits in the buffer)`:`Writing failed: "${fw.path}" is not open`;
    if(fk&&!pr)return `Ask ${fk.stream||'the stream'}.${fk.method}(): ${fk.result}`;
    if(cv&&!pr)return `${cv.fn}("${cv.from}") gives ${cv.value}`;
    if(tyE)return `Draw the blueprint: ${tyE.kind} ${tyE.name}`;
    if(dnE)return `Blocked: ${dnE.name} is ${dnE.access}`;
    if(csE&&!cEv&&!pr)return `Build ${csE.obj}, a ${csE.cls}${csE.args&&csE.args.length?` with ${csE.args.join(', ')}`:''}`;
    if(dsE&&!pr&&!cEv)return `${dsE.obj} goes out of scope and is taken apart`;
    if(nwE&&!pr)return `Build a new ${nwE.cls} on the heap`;
    if(dlE)return `Delete the ${dlE.cls} from the heap`;
    if(stE)return `Give ${stE.cls}::${stE.name} its starting value ${stE.value}`;
    if(unE&&!pr)return unE.op==='write'?`Store ${unE.value} in the shared box as ${unE.as}`:`Read the shared box as ${unE.as}: ${unE.value}`;
    if(wsE&&!pr&&!cEv)return `Set ${wsE.path.join('.')} of ${wsE.obj} to ${wsE.value}`;
    if(gtE&&!pr&&!cEv)return `Read ${gtE.path.join('.')} of ${gtE.obj}: ${gtE.value}`;
    if(w)return `Put ${w.value} into ${at(w)} (it was ${w.old})`;
    if(m)return {size:`Ask ${m.name} how many it holds: ${m.n}`,empty:`Is ${m.name} empty? ${m.n===0}`,append:`Add "${m.text}" to the end of ${m.name}`,substr:`Copy ${m.len} letter(s) from position ${m.pos}: "${m.result}"`,find:`Search for "${m.needle}": ${m.result}`,insert:`Insert "${m.text}" at position ${m.pos}`,erase:`Erase ${m.len} letter(s) from position ${m.pos}`,replace:`Replace ${m.len} letter(s) at position ${m.pos} with "${m.text}"`,assign:`Give ${m.name} a new value`}[m.op]||`${m.name}.${m.op}()`;
    if(pr)return `Print ${JSON.stringify(pr.text.replace(/\n/g,'↵'))}`;
    if(r)return `Read ${at(r)}: ${r.value}`;
    if(e)return `Create ${e.name}${e.dims?` with ${e.dims.join(' x ')} slots`:''}`;
    return n.text||'Run the statement';
  }
  const stmtFrame=n=>{if(!O.statements)return;const evs=events.splice(0);frame('stmt',describe(n,evs),{events:evs,text:n.text||''});};
  const lap=()=>{if(++laps>MAX_LAPS)throw LIMIT;};
  function body(node,ctxItem) {
    const before=out.length,result=exec(node.body);
    const printed=out.slice(before).replace(/\n/g,'↵');
    return {result,printed,hasOutput:out.length>before};
  }
  function exec(n) {
    switch(n.k) {
      case 'empty':return;
      case 'block': {
        scopes.push(new Map());
        try{for(const s of n.body){const r=exec(s);if(r)return r;}}
        catch(e){aborting=true;throw e;}
        finally{const sc=scopes.pop();if(!aborting)destroyScope(sc);}
        return;
      }
      case 'decls':n.items.forEach(declare);stmtFrame(n);return;
      case 'expr':ev(n.e);stmtFrame(n);return;
      case 'cout':{execInsert(n);stmtFrame(n);return;}
      case 'break':return 'break';
      case 'continue':return 'continue';
      case 'return':{retVal=n.e?ev(n.e):undefined;return 'return';}
      case 'delete':{doDelete(n);stmtFrame(n);return;}
      case 'if':{if(truthy(ev(n.c)))return exec(n.then);return n.other?exec(n.other):undefined;}
      case 'switch': {
        const value=ev(n.c);let start=n.items.findIndex(item=>item.label&&binop('==',value,ev(item.label)));
        if(start<0)start=n.items.findIndex(item=>item.label===null);
        if(start<0)return;
        scopes.push(new Map());
        try {
          for(let i=start;i<n.items.length;i++) {
            for(const s of n.items[i].body){const r=exec(s);if(r==='break')return;if(r)return r;}
          }
        } finally {scopes.pop();}
        return;
      }
      case 'for': {
        scopes.push(new Map());const c={n:0,id:loopCount++,kind:'for'};ctx.push(c);
        try {
          if(n.init)exec(n.init);
          frame('init',n.initText?`Start: ${n.initText}`:'Start the loop',{loopKind:'for',flag:'init'});
          for(;;) {
            const ok=n.cond?truthy(ev(n.cond)):true;
            frame('check',`Check ${subst(n.text)||'(no condition)'}: ${ok?'true, run the body':'false, leave the loop'}`,{ok,flag:'check',loopKind:'for',ctrl:ctrlOf(n.text)});
            if(!ok)break;
            lap();c.n++;
            const b=body(n),rec=n.text.length?ctrlOf(n.text):'';
            const lv=rec?show(find(rec).value):'';
            if(b.result==='return')return 'return';
            if(b.result==='break'){frame('break',`break: leave the loop right now${b.hasOutput?` (printed ${b.printed})`:''}`,{lap:c.n,lv});break;}
            frame(b.result==='continue'?'continue':'body',b.result==='continue'?'continue: skip the rest of this lap':`Run the body${b.hasOutput?` and print ${b.printed}`:''}`,{lap:c.n,lv,flag:'body'});
            if(n.update){ev(n.update);frame('update',`Update: ${n.updateText}`,{flag:'update',loopKind:'for'});}
          }
          frame('exit','The loop is finished.',{loopKind:'for'});
        } finally {ctx.pop();scopes.pop();}
        return;
      }
      case 'while':case 'do': {
        const c={n:0,id:loopCount++,kind:n.k};ctx.push(c);
        try {
          frame('init',n.k==='do'?'do-while runs the body first, then checks':'while checks first, then runs the body',{loopKind:n.k});
          let first=true;
          for(;;) {
            if(n.k==='while'||!first) {
              const ok=truthy(ev(n.c));
              frame('check',`Check ${subst(n.text)}: ${ok?'true, go around again':'false, leave the loop'}`,{ok,loopKind:n.k,ctrl:ctrlOf(n.text)});
              if(!ok)break;
            }
            first=false;lap();c.n++;
            const b=body(n),rec=ctrlOf(n.text),lv=rec?show(find(rec).value):'';
            if(b.result==='return')return 'return';
            if(b.result==='break'){frame('break',`break: leave the loop right now${b.hasOutput?` (printed ${b.printed})`:''}`,{lap:c.n,lv});break;}
            frame(b.result==='continue'?'continue':'body',b.result==='continue'?'continue: jump to the check':`Run the body${b.hasOutput?` and print ${b.printed}`:''}`,{lap:c.n,lv,loopKind:n.k});
          }
          frame('exit','The loop is finished.',{loopKind:n.k});
        } finally {ctx.pop();}
        return;
      }
      case 'range': {
        const src=n.source.k==='list'?n.source.items.map(ev):ev(n.source);
        const items=typeof src==='string'?[...src].map(ch=>({c:ch})):src;
        if(!Array.isArray(items))throw new Error('A range-based for needs an array, a string or a { } list.');
        const sourceRec=n.source.k==='var'?find(n.source.name):null;
        scopes.push(new Map());const c={n:0,id:loopCount++,kind:'range'};ctx.push(c);
        try {
          const rf={items:items.map(show)};
          frame('init',`Walk through ${items.length} item${items.length===1?'':'s'}`,{loopKind:'range',rf:{...rf,idx:-1}});
          for(let i=0;i<items.length;i++) {
            lap();c.n++;
            const scope=new Map();scopes[scopes.length-1]=scope;
            const type=n.type==='auto'?inferType(items[i]):n.type;
            scope.set(n.name,{type,value:coerce(type,items[i])});
            frame('item',`${n.name} takes ${n.byRef?'a reference to':'a copy of'} ${show(items[i])}`,{loopKind:'range',rf:{...rf,idx:i},lap:c.n});
            const b=body(n);
            if(n.byRef&&sourceRec?.arr)sourceRec.arr[i]=coerce(sourceRec.type,scope.get(n.name).value);
            if(b.result==='return')return 'return';
            const lastItems=sourceRec?.arr?sourceRec.arr.map(show):rf.items;
            if(b.result==='break'){frame('break','break: leave the loop right now',{loopKind:'range',rf:{items:lastItems,idx:i},lap:c.n});break;}
            frame(b.result==='continue'?'continue':'body',b.result==='continue'?'continue: skip the rest of this lap':`Run the body${b.hasOutput?` and print ${b.printed}`:''}`,{loopKind:'range',rf:{items:lastItems,idx:i},lap:c.n});
          }
          frame('exit','The loop is finished.',{loopKind:'range',rf:{items:sourceRec?.arr?sourceRec.arr.map(show):rf.items,idx:-1}});
        } finally {ctx.pop();scopes.pop();}
        return;
      }
    }
  }
  const state={frames,output:'',error:'',stopped:false,types:program.types.map(d=>({kind:d.kind,name:d.name,base:d.base,scoped:d.scoped,items:(d.items||[]).map(i=>i.name),members:d.members.map(m=>({name:m.name,type:m.type,access:m.access,static:!!m.static})),methods:d.methods.map(m=>({name:m.name,ctor:!!m.ctor,dtor:!!m.dtor,virt:!!m.virt,access:m.access}))})),functions:program.funcs.map(f=>({name:f.name,sig:sigOf(f),proto:f.proto,inline:f.inline,ret:f.ret,params:f.params.map(q=>({type:q.type,name:q.name,byRef:q.byRef,ptr:q.ptr,def:!!q.def}))}))};
  try {
    registerTypes();
    if(O.statements)program.types.forEach(d=>{
      events.push({t:'type',kind:d.kind,name:d.name,base:d.base,scoped:d.scoped,items:(d.items||[]).map(i=>i.name),members:d.members.map(m=>({name:m.name,type:m.type,access:m.access,static:!!m.static,dims:m.dims.length})),methods:d.methods.map(m=>({name:m.name,ctor:!!m.ctor,dtor:!!m.dtor,virt:!!m.virt,stat:!!m.stat,abstract:!!m.abstract,access:m.access,sig:`${m.ret||''} ${m.name}(${m.params.map(q=>q.type+' '+q.name).join(', ')})`.trim()}))});
      const evs=events.splice(0);frame('stmt',describe(null,evs),{events:evs,text:d.name});
    });
    if(O.statements)program.funcs.forEach(f=>{
      events.push({t:'define',fn:f.name,sig:sigOf(f),params:f.params.map(q=>({type:q.type,name:q.name,byRef:q.byRef,ptr:q.ptr,def:!!q.def})),ret:f.ret,inline:f.inline,proto:f.proto});
      const evs=events.splice(0);frame('stmt',describe(null,evs),{events:evs,text:sigOf(f)});
    });
    for(const statement of program.globals){if(exec(statement)==='return')break;}
    if(program.main)exec(program.main);
  }
  catch(error) {
    if(error===LIMIT){state.stopped=true;frame('limit',`Step limit reached after ${MAX_LAPS} laps. This loop never ends: make sure something changes the condition.`,{});}
    else{state.error=error.message;if(O.statements)frame('error',error.message,{events:events.splice(0)});}
  }
  if(O.statements&&!state.error&&!state.stopped){
    const left=[...heap].filter(r=>!r.freed);
    if(left.length)events.push({t:'leak',count:left.length,types:left.map(r=>r.type)});
    if(events.length)frame('stmt','End of the program',{events:events.splice(0)});
  }
  state.output=out;
  return state;
}
export function loopModel(source,options={}) {
  try {
    const tokens=lex(cleanCode(source));
    const includes=new Set([...source.matchAll(/#include\s*<([^>]+)>/g)].map(m=>m[1]));
    return run(parse(tokens),{...options,includes});
  } catch(error){return {frames:[],output:'',error:error.message,stopped:false};}
  finally {USER=null;}
}
