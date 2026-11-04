// The desktop Main process snapshots index injections once. Its renderer reloads
// must obtain the current plugin graph before the shell constructs module state.
export const inject = ['clientModules', 'connection', 'webServer']
export const BOOT_PATH = '/api/dsh-navigation-rail/boot.js'

export function apply(ctx) {
  ctx.effect(() => ctx.connection.fetch.register({
    path: BOOT_PATH,
    methods: ['GET', 'HEAD'],
    requestBody: 'buffered',
    fetch: (request) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } })
      }
      // Resolve per request, never at apply/ready time. The stable URL survives
      // plugin revisions while the desktop's saved injection list does not.
      const graph = JSON.stringify(ctx.clientModules.graph()).replaceAll('<', '\\u003c')
      const source = `(()=>{if(globalThis.__ModuleLoader__?.mode!=="queue")return;globalThis.__DSH_BOOT__=${graph};})();\n`
      return new Response(request.method === 'HEAD' ? null : source, {
        headers: {
          'content-type': 'text/javascript; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      })
    },
  }), 'navigation-rail: current desktop boot graph')

  ctx.on('webserver/index-inject', (rows) => {
    // The native shell applies rows in order and awaits script-src. Application
    // preloads are hints, so a stale hint cannot execute the old application.
    // Put this after the captured graph global, before boot readiness resolves.
    if (rows.some(row => row.kind === 'script-src' && row.src === BOOT_PATH.slice(1))) return
    if (!rows.some(row => row.kind === 'global' && row.name === '__DSH_BOOT__')) return
    rows.push({ kind: 'script-src', placement: 'head', src: BOOT_PATH.slice(1) })
  })
}
