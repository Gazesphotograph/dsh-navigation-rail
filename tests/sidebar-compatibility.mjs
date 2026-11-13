import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'

const source = await fs.readFile(new URL('../sidebar/lib/client.js', import.meta.url), 'utf8')
const store = (value) => ({ getSnapshot: () => value, set: (next) => { value = next }, subscribe: () => () => {} })
const element = (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) })
const React = {
  createElement: element,
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useRef: (current) => ({ current }),
  useMemo: (fn) => fn(),
  useEffect: () => {},
}
let plugin
vm.runInNewContext(source, {
  window: { __ModuleLoader__: { load: ({ factory }) => {
    plugin = factory((name) => {
      if (name === 'react') return React
      if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element }
      if (name.endsWith('dsh-client-store')) return { createSnapshotStore: store }
      if (name.endsWith('dsh-client-ui-slots')) return { resolveSlotLabel: (label) => label }
      return {}
    })
  } } },
  document: { querySelector: () => ({}), documentElement: { hasAttribute: () => true } },
  localStorage: { getItem: () => null },
  setTimeout, clearTimeout, console,
})
const registrations = new Map()
const factories = new Map()
const noOp = () => {}
const ctx = {
  effect: noOp,
  get: () => ({}),
  remote: { $stream: () => ({}) },
  slots: {
    entriesOfSlot: () => [{ options: { id: 'profile-insights', label: 'Profile' } }],
    subscribe: () => noOp,
    register: (options, component) => { registrations.set(options.name, { options, component }); return noOp },
    registerFactory: (options, component) => { factories.set(options.name, { options, component }); return noOp },
    inject: (_name, fn) => { const value = fn(); if (value?.next) [...value] },
  },
  shortcuts: { catalog: store([]) },
}
plugin.apply(ctx)
assert.ok(factories.has('sidebar.panel.icon'), 'The new icon factory must be registered during startup')
assert.equal(registrations.get('sidebar').options.children['sidebar.panellist'], undefined)
const root = registrations.get('sidebar')
const injected = root.options.inject()
assert.equal(typeof injected.navigateBack, 'function')
assert.equal(typeof injected.navigateForward, 'function')
const props = {
  collapsed: true, width: 56, ...injected,
  usePanels: (select) => select([{ id: 'profile-insights', label: 'Profile' }]),
  useEntryPins: (select) => select([]),
  useEntryActions: (select) => select(true),
  useShortcuts: (select) => select([]),
  usePanelInfo: (select) => select({ activePanelId: null }),
  useRemoteAccess: () => true,
  t: (key) => key,
  renderSlot: () => null,
  renderFactorySlot: () => null,
}
const tree = root.component(props)
const nodes = []
function visit(node) { if (!node || typeof node !== 'object') return; nodes.push(node); for (const child of node.children ?? []) visit(child) }
visit(tree)
const panel = nodes.find((node) => node.type?.name === 'PanelRow')
assert.ok(panel)
assert.equal(panel.props.renderFactorySlot, props.renderFactorySlot)
assert.doesNotThrow(() => panel.type(panel.props), 'Panel icons must use the current factory API')
assert.ok(registrations.get('sidebar').options.children['sidebar.workspaces'].inject.hooks.sectionScroller)
const rendered = []
const hooksTree = root.component({ ...props, renderSlot: (name, _props, options) => { rendered.push({ name, options }); return null } })
assert.ok(hooksTree)
assert.equal(typeof rendered.find((row) => row.name === 'sidebar.workspaces').options.hookContext.useSectionScroller, 'function')
assert.ok(rendered.find((row) => row.name === 'sidebar.session.action').options.children)
const denied = []
let started = false
root.component({ ...props, useRemoteAccess: () => false, startSession: () => { started = true }, renderSlot: (name, _props, options) => { denied.push({ name, options }); return null } })
const newButton = denied.find((row) => row.name === 'sidebar.session.action').options.children
assert.equal(newButton.props.disabled, true)
newButton.props.onClick()
assert.equal(started, false)
console.log('ok   rc.3 startup registration, panel icon factory, rail rendering, history callbacks and workspace scrolling')
