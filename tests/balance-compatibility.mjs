import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'

const source = await fs.readFile(new URL('../sidebar/lib/client.js', import.meta.url), 'utf8')
const code = source.slice(source.indexOf('function splitYuan('), source.indexOf('function BalanceRing('))
const createStore = (value) => ({ getSnapshot: () => value, set: (next) => { value = next } })
const createBalance = vm.runInNewContext(`(() => { ${code}; return createRailBalance })()`, {
  _deepseek_ai_dsh_client_store: { createSnapshotStore: createStore },
  document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
  window: { addEventListener() {}, removeEventListener() {} },
  setTimeout, clearTimeout, setInterval: () => 1, clearInterval() {},
})
let deliver
let ended = false
let accepted = 0
const stream = {
  [Symbol.asyncIterator]() { return this },
  next: () => ended ? Promise.resolve({ done: true }) : new Promise((resolve) => { deliver = resolve }),
  dispose: () => { ended = true; deliver?.({ done: true }) },
}
let cleanup
let reads = 0
let respond = async () => ({ ok: true, value: { status: 'ready', value: [{ currency: 'CNY', balance: '25.50' }], bonusWallets: [] } })
const balance = createBalance({
  remote: { $stream: () => stream, account: { getBalance: (metadata) => {
    reads++
    assert.equal(metadata.version, '0.2.2-rc.3')
    return respond()
  } } },
  locale: { getSnapshot: () => ({ active: 'zh-CN' }) },
  effect: (fn) => { cleanup = fn() },
})
const settle = async () => { for (let i = 0; i < 4; i++) await new Promise(setImmediate) }
const emit = async (type, status) => {
  assert.ok(deliver)
  const next = deliver
  deliver = undefined
  next({ value: { value: { type, state: { status } }, accept: () => { accepted++ } }, done: false })
  await settle()
}
try {
  await emit('snapshot', 'signed-out')
  assert.equal(balance.store.getSnapshot().status, 'signedOut')
  assert.equal(reads, 0)
  await emit('credentials-changed', 'credential-stored')
  assert.equal(balance.store.getSnapshot().status, 'ready')
  assert.equal(balance.store.getSnapshot().display, '25.50')
  assert.equal(balance.store.getSnapshot().count, '2')
  assert.equal(balance.store.getSnapshot().fraction, 0.55)

  let release
  respond = () => new Promise((resolve) => { release = resolve })
  const pending = balance.refresh()
  assert.equal(balance.refresh(), pending, 'Concurrent refreshes must share the same read')
  await settle()
  await emit('credentials-changed', 'signed-out')
  release({ ok: true, value: { status: 'ready', value: [{ currency: 'CNY', balance: '99.00' }] } })
  await pending
  assert.equal(balance.store.getSnapshot().status, 'signedOut', 'A late old-account balance must not reappear after sign-out')

  respond = async () => ({ ok: true, value: { status: 'failed' } })
  await emit('snapshot', 'credential-stored')
  assert.equal(balance.store.getSnapshot().status, 'failed', 'A read failure must not claim the user is signed out')
  respond = async () => ({ ok: true, value: { status: 'ready', value: [{ currency: 'CNY', balance: '0.00' }] } })
  await balance.refresh()
  assert.equal(balance.store.getSnapshot().status, 'ready')
  assert.equal(balance.store.getSnapshot().display, '0.00')
  assert.equal(accepted, 4)
  console.log('ok   rc.3 account envelopes, login refresh, exact balance ring, coalescing, sign-out races and failure recovery')
} finally { cleanup() }
