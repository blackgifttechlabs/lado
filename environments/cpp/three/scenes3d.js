import { RangeWorld, WhileWorld, NestedWorld, BreakWorld } from './loop-worlds.js?v=20261014-cs-18';
import { LoopMachine } from './loop-machine.js?v=20261014-cs-18';
import { DataWorld } from './data-world.js?v=20261014-cs-18';
import { FuncWorld } from './func-world.js?v=20261014-cs-18';
import { StructWorld } from './struct-world.js?v=20261014-cs-18';
import { ClassWorld } from './class-world.js?v=20261014-cs-18';
import { FileWorld } from './file-world.js?v=20261014-cs-18';

// Picks the 3D scene for a lesson mode. Returns null when WebGL is unavailable so the flat scene is used instead.
const WORLDS={for:LoopMachine,range:RangeWorld,while:WhileWorld,grid:NestedWorld,laps:BreakWorld};
export function createWorld(mode) {
  try{
    const Scene=WORLDS[mode];
    const instance=Scene?new Scene():mode.startsWith('data-')?new DataWorld(mode.slice(5)):mode.startsWith('func-')?new FuncWorld(mode.slice(5)):mode.startsWith('struct-')?new StructWorld(mode.slice(7)):mode.startsWith('class-')?new ClassWorld(mode.slice(6)):mode.startsWith('file-')?new FileWorld(mode.slice(5)):null;
    if(!instance)return null;instance.fit();return instance;
  }catch(error){console.warn('3D scene unavailable:',error);return null;}
}
