import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const js=await fs.readFile(new URL('../layout/lib/client.js',import.meta.url),'utf8')
const start=js.indexOf('function clampWidth(')
const end=js.indexOf('//#endregion',start)
const compute=new Function('const RIGHTBAR_MAX_RATIO=.7;'+js.slice(start,end)+';return computeColumns')()
for(const [viewport,sidebar,rightbar,collapsedWidth] of [[1280,0,0,56],[1280,0,600,56],[800,0,600,56],[650,0,500,56],[1280,280,600,56],[1280,0,600,0]]) {
 const cols=compute(viewport,sidebar,rightbar,collapsedWidth)
 assert.equal(cols.sidebar,sidebar===0?collapsedWidth:56+Math.max(264,Math.min(420,sidebar)))
 assert.ok(cols.center>=0&&cols.rightbar>=0)
 assert.ok(cols.sidebar+cols.center+cols.rightbar<=viewport+1)
 if(cols.rightbar>0)assert.ok(cols.center>=400,'Right pane must preserve main minimum')
}
assert.ok(js.includes('const collapsedWidth = 56;'))
const sidebar=await fs.readFile(new URL('../sidebar/lib/client.js',import.meta.url),'utf8')
assert.ok(sidebar.includes('overflow-y:auto;overflow-x:hidden'))
console.log('ok   six column solver cases; collapsed rail width; short-window scroll')
