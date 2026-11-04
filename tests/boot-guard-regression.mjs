import assert from 'node:assert/strict'
import vm from 'node:vm'
import fs from 'node:fs/promises'
import {apply,BOOT_PATH} from '../index.js'
const routes=new Map(),hooks=new Map(),cleanups=[]
let graph={rev:'startup',entries:[],batches:[]}
const ctx={clientModules:{graph:()=>graph},connection:{fetch:{register:(route)=>{assert.equal(typeof route,'object','native connection.fetch accepts one route object');assert.deepEqual(route.methods,['GET','HEAD']);assert.equal(route.requestBody,'buffered');assert.equal(typeof route.fetch,'function');routes.set(route.path,route.fetch);return()=>routes.delete(route.path)}}},effect:(fn)=>{const dispose=fn();if(dispose)cleanups.push(dispose);return dispose},on:(event,handler)=>{hooks.set(event,handler)}}
apply(ctx)
const inject=hooks.get('webserver/index-inject')
const startup=[{kind:'script-preload',src:'plugins/stale-application.js'},{kind:'global',name:'__DSH_BOOT__',value:graph}]
inject(startup);inject(startup)
assert.equal(startup.filter(r=>r.kind==='script-src').length,1,'one stable guard per document')
assert.ok(startup.at(-1).src.endsWith('/boot.js'))
const sandbox=vm.createContext({__ModuleLoader__:{mode:'queue'}})
graph={rev:'after-three-rebuilds',entries:[{id:'@local/example',rev:'latest'}],batches:[]}
let loaded=0
// Execute injected script rows in sequence; this is an offline carrier simulation,
// not the packaged desktop installer or a real native-window reload.
for (const row of startup) {
  if (row.kind !== 'script-src') continue;
  loaded++;
  assert.equal('/'+row.src,BOOT_PATH);
  const response=routes.get(BOOT_PATH)(new Request('http://local'+BOOT_PATH));
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.match(response.headers.get('content-type'),/javascript/);
  vm.runInContext(await response.text(),sandbox);
}
assert.equal(loaded,1,'stale application preloads are not executed')
assert.equal(sandbox.__DSH_BOOT__.rev,graph.rev,'current graph replaces saved Main-process graph before boot')
console.log('ok   offline injection simulation consumes current graph from a stale startup snapshot')
const handler=routes.get(BOOT_PATH)
const head=handler(new Request('http://local'+BOOT_PATH,{method:'HEAD'}));assert.equal(await head.text(),'');assert.equal(head.headers.get('cache-control'),'no-store')
assert.equal(handler(new Request('http://local'+BOOT_PATH,{method:'POST'})).status,405)
console.log('ok   authenticated carrier registration, GET/HEAD no-store, unsupported method rejection')
graph={rev:'newer-again',entries:[],batches:[]}
sandbox.__ModuleLoader__.mode='live'
vm.runInContext(await handler(new Request('http://local'+BOOT_PATH)).text(),sandbox)
assert.equal(sandbox.__DSH_BOOT__.rev,'after-three-rebuilds','guard must not mutate an already running client')
console.log('ok   live module state is untouched outside the parser queue')
const absent=[];inject(absent);assert.equal(absent.length,0,'no graph means no boot dependency')
cleanups.forEach(fn=>fn());assert.equal(routes.size,0)
console.log('ok   idempotent injection, absent-graph handling, route cleanup')
