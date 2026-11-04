window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-sidebar",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let _deepseek_ai_dsh_client_ui_slots = require("@deepseek-ai/dsh-client-ui-slots");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		const NO_PANELS = [];
		/**
		* Create the in-memory panel pin list; the snapshot keeps its reference until the list changes.
		* @returns Unpinned panel ids and the pin mutation.
		*/
		function createPanelPins() {
			const store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)({ unpinned: NO_PANELS });
			return {
				unpinned: {
					getSnapshot: () => store.getSnapshot().unpinned,
					subscribe: (listener) => store.subscribe(listener)
				},
				setPinned: (id, pinned) => {
					const current = store.getSnapshot().unpinned;
					if (id === "plugins" || pinned !== current.includes(id)) return;
					store.set({ unpinned: pinned ? current.filter((entry) => entry !== id) : [...current, id] });
				}
			};
		}
		//#endregion
		//#region \0dsh-css:D:\ci\runners\github\_work\deepseek-harness\deepseek-harness\packages\client\ui-sidebar\src\client\HeaderLeadingControls.module.css.mjs
		const css$1 = ".hc2fJa_controls{align-items:center;gap:8px;display:flex}.hc2fJa_iconButton{border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.hc2fJa_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-sidebar/HeaderLeadingControls.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-sidebar";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var HeaderLeadingControls_module_css_default = {
			"controls": "hc2fJa_controls",
			"iconButton": "hc2fJa_iconButton"
		};
		//#endregion
		//#region lib/types/client/HeaderLeadingControls.js
		/** Window-chrome controls for the fully hidden sidebar (frame shell.leading seat). */
		/**
		* Sidebar-open and New Session controls in the frame's window-chrome seat.
		* On macOS desktop a collapsed sidebar hides entirely (no rail), taking both
		* controls off screen; this occupant puts them back beside the traffic
		* lights. The frame mounts the seat only in that state and owns its
		* placement, so the occupant renders unconditionally.
		* @param props - Injected sidebar actions plus the sidebar locale seat.
		* @returns the two window-chrome controls.
		*/
        // Keep navigation inside the application: browser history would leave the
        // authenticated desktop document. Coalesce panel/session changes per turn.
        function createNavigation(ctx, workspace) {
            const store = _deepseek_ai_dsh_client_store.createSnapshotStore({back:false,forward:false});
            const entries=[];
            let index=-1, queued=false, restoring=false, disposed=false;
            const read=()=>({panel:ctx.layout.panelInfo.getSnapshot().activePanelId,selection:workspace.selection.getSnapshot()});
            const key=value=>JSON.stringify([value.panel,value.selection.sessionId,value.selection.subagentAddress]);
            const publish=()=>store.set({back:index>0,forward:index<entries.length-1});
            const record=()=>{
                if(disposed||restoring)return;
                const value=read();
                if(index>=0&&key(entries[index])===key(value))return;
                entries.splice(index+1);entries.push(value);
                if(entries.length>100)entries.shift();
                index=entries.length-1;publish();
            };
            const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;record();});};
            const go=delta=>{
                record();
                const next=index+delta;
                if(restoring||next<0||next>=entries.length)return;
                const value=entries[next];
                restoring=true;
                try {
                    const target=value.selection.subagentAddress??value.selection.sessionId;
                    if(target===undefined)workspace.clearMain();else workspace.openSession(target);
                    ctx.layout.selectPanel(value.panel);
                    index=next;publish();
                } catch(error) {console.warn('Navigation target unavailable',error);}
                finally {queueMicrotask(()=>{restoring=false;});}
            };
            ctx.effect(()=>{
                const stopPanel=ctx.layout.panelInfo.subscribe(schedule);
                const stopSelection=workspace.selection.subscribe(schedule);
                record();
                const action=event=>{
                    switch(event.detail){
                        case 'back':go(-1);break;
                        case 'forward':go(1);break;
                        case 'sidebar':ctx.layout.toggleSidebar();break;
                        case 'home':case 'new':workspace.startSession();break;
                        case 'search':{
                            const entry=ctx.shortcuts.registry?.commands?.get('session.search');
                            // Use the registered shortcut's own action if available.
                            if(entry?.resolve){const result=entry.resolve({modal:null});if(result?.status==='handled')result.run();}
                            else {document.querySelector('.dsh-drawer-sessions button[aria-label="搜索会话"]')?.click();}
                            break;
                        }
                        case 'rightbar':document.querySelector('[data-sidebar-right-toggle]')?.click();break;
                    }
                };
                window.addEventListener('dsh-shell-action',action);
                return ()=>{disposed=true;stopPanel();stopSelection();window.removeEventListener('dsh-shell-action',action);};
            },'navigation: panel and session history');
            for(const [id,code,label] of [['back','ArrowLeft','rail.back'],['forward','ArrowRight','rail.forward']])ctx.effect(()=>{
                const binding={code,modifiers:['alt']};
                return ctx.shortcuts.registerFixed({id:'navigation.'+id,label:()=>ctx.locale.bind('sidebar')(label),keys:ctx.shortcuts.describeBinding(binding).keys,bindings:[binding],group:'application'});
            },'navigation: fixed history reference '+id);
            ctx.effect(()=>ctx.shortcuts.observeFixedInput(input=>{
                if(input.type==='reset')return;
                const {gesture,context}=input;
                if(gesture.composing||gesture.defaultPrevented||gesture.repeat||context.modal!==null||context.region==='terminal')return;
                if(!gesture.alt||gesture.control||gesture.shift||gesture.meta)return;
                if(gesture.code!=='ArrowLeft'&&gesture.code!=='ArrowRight')return;
                input.consume();go(gesture.code==='ArrowLeft'?-1:1);
            }),'navigation: fixed history input');
            return {store,back:()=>go(-1),forward:()=>go(1)};
        }

        function HeaderLeadingControls({collapsed,toggleSidebar,useNavigation,navigateBack,navigateForward,t}) {
            const h=react.createElement;
            const state=useNavigation(value=>value);
            const glyph=(path)=>h('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:path}));
            const button=(label,action,icon,extra={})=>h('button',{type:'button',className:'dsh-caption-button',title:label,'aria-label':label,onClick:action,...extra},icon);
            return h('div',{className:'dsh-caption-controls'},
                button(t('rail.back')+' (Alt+←)',navigateBack,glyph('M19 12H5m6-6-6 6 6 6'),{disabled:!state.back,'aria-keyshortcuts':'Alt+ArrowLeft'}),
                button(t('rail.forward')+' (Alt+→)',navigateForward,glyph('M5 12h14m-6-6 6 6-6 6'),{disabled:!state.forward,'aria-keyshortcuts':'Alt+ArrowRight'}),
                button(t(collapsed?'toggle.open':'toggle.collapse')+' (Ctrl+B)',toggleSidebar,h(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutlineRegular,{size:16}),{'aria-expanded':!collapsed,'aria-controls':'dsh-conversation-drawer','aria-keyshortcuts':'Control+B'}));
        }

		//#endregion
		//#region ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-css:D:\ci\runners\github\_work\deepseek-harness\deepseek-harness\packages\client\ui-sidebar\src\client\SidebarRoot.module.css.mjs
		const css = ".wtg9ga_root{--dsh-sidebar-inline-padding:12px;height:100%;padding:6px var(--dsh-sidebar-inline-padding);box-sizing:border-box;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex-direction:column;font-size:14px;display:flex}[data-platform=darwin] .wtg9ga_root{background:0 0}.wtg9ga_root.wtg9ga_collapsed{padding:18px 10px 6px}[data-windows-titlebar] .wtg9ga_root .wtg9ga_logoRow{height:40px;margin:0;padding:0}[data-windows-titlebar] .wtg9ga_toggle{top:calc((var(--dsh-windows-titlebar-height) - 28px) / 2);z-index:30;-webkit-app-region:no-drag;position:fixed;left:12px}[data-windows-titlebar] .wtg9ga_root.wtg9ga_collapsed .wtg9ga_logoRow{height:0}[data-windows-titlebar] .wtg9ga_root:not(.wtg9ga_collapsed) .wtg9ga_brand{padding-left:4px}[data-windows-titlebar] .wtg9ga_brandIdentity{transform:translateY(1px)}[data-windows-titlebar] .wtg9ga_brandMark{transform:translate(1px)}[data-windows-titlebar] .wtg9ga_brandName{font-weight:400}[data-windows-titlebar] .wtg9ga_root.wtg9ga_collapsed{padding:0}[data-windows-titlebar] .wtg9ga_root:not(.wtg9ga_collapsed) .wtg9ga_newSession{margin-top:8px;margin-left:0}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_regionArea{display:none}html[data-windows-titlebar]:has([data-sidebar-collapsed=true]){--dsh-windows-menu-start:84px}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_newSession{top:calc((var(--dsh-windows-titlebar-height) - 28px) / 2);z-index:30;-webkit-app-region:no-drag;border:none;margin:0;padding:0;position:fixed;left:48px}[data-windows-titlebar] .wtg9ga_railIn .wtg9ga_iconButton,[data-windows-titlebar] .wtg9ga_railIn .wtg9ga_newSession{animation:none}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_toggle,[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_newSession{border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--dsw-alias-label-secondary)}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_toggle .wtg9ga_panelIcon{display:inline}.wtg9ga_root.wtg9ga_quietBars{--dsh-scrollbar-thumb:transparent;--dsh-scrollbar-thumb-hover:transparent}.wtg9ga_fading>*{opacity:0;transition:opacity .15s var(--ds-ease-in-out)}.wtg9ga_wide{animation:wtg9ga_wide-in .2s var(--ds-ease-in-out)}@keyframes wtg9ga_wide-in{0%{opacity:0}}.wtg9ga_railIn .wtg9ga_iconButton,.wtg9ga_railIn .wtg9ga_newSession,.wtg9ga_railIn .wtg9ga_panelList,.wtg9ga_railIn .wtg9ga_regionArea{animation:wtg9ga_rail-in .15s var(--ds-ease-in-out) backwards}.wtg9ga_railIn .wtg9ga_footArea{animation:wtg9ga_rail-fade-in .15s var(--ds-ease-in-out) backwards}@keyframes wtg9ga_rail-in{0%{opacity:0;transform:translate(49px)}}@keyframes wtg9ga_rail-fade-in{0%{opacity:0}}.wtg9ga_topStrip{box-sizing:border-box;height:52px;margin:-6px calc(-1 * var(--dsh-sidebar-inline-padding)) 0;flex:none;justify-content:flex-end;align-items:center;padding:0 12px 2px;display:flex}[data-fullscreen] .wtg9ga_topStrip{justify-content:flex-start}.wtg9ga_topStrip+.wtg9ga_logoRow{margin-top:-12px}.wtg9ga_logoRow{box-sizing:border-box;flex:none;justify-content:flex-end;align-items:center;gap:8px;height:60px;margin-bottom:4px;padding:8px 0 8px 4px;display:flex;overflow:hidden}.wtg9ga_collapsed .wtg9ga_logoRow{justify-content:flex-start;height:36px;margin-bottom:12px;padding:0;overflow:visible}.wtg9ga_brand{min-width:0;color:inherit;cursor:pointer;background:0 0;border:none;flex:1;align-items:center;padding:0;display:inline-flex;overflow:hidden}[data-platform=darwin] .wtg9ga_brand{cursor:default}.wtg9ga_brandIdentity{align-items:center;gap:8px;min-width:0;height:24px;display:inline-flex}.wtg9ga_brandMark{flex:none;justify-content:center;align-items:center;display:inline-flex}.wtg9ga_brandName{letter-spacing:.04em;align-items:center;gap:6px;min-width:0;height:24px;font-size:18px;font-weight:600;line-height:24px;display:inline-flex}.wtg9ga_fallbackBrandName{letter-spacing:0;white-space:nowrap;font-size:17px}.wtg9ga_localBuildBrand{white-space:nowrap;flex-direction:column;flex:none;justify-content:center;align-items:flex-start;gap:1px;height:24px;display:inline-flex}.wtg9ga_localBuildTitle{letter-spacing:0;font-size:12px;line-height:13px}.wtg9ga_iconButton{border-radius:var(--dsw-radius-sm);cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex;position:relative}.wtg9ga_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.wtg9ga_iconButton.wtg9ga_toggle:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}.wtg9ga_collapsed .wtg9ga_iconButton{border-radius:var(--dsw-radius-md);width:36px;height:36px}.wtg9ga_collapsed .wtg9ga_toggle .wtg9ga_panelIcon{display:none}.wtg9ga_collapsed .wtg9ga_toggle:hover .wtg9ga_panelIcon{display:inline}.wtg9ga_collapsed .wtg9ga_toggle:hover .wtg9ga_railMark{display:none}.wtg9ga_railMark{justify-content:center;align-items:center;display:inline-flex}.wtg9ga_collapsed .wtg9ga_iconButton{color:var(--dsw-alias-label-primary)}.wtg9ga_buildVersion{height:10px;color:var(--dsw-alias-label-primary-inverted);background:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code);white-space:nowrap;border-radius:2px;flex:none;align-items:center;padding:0 3px;font-size:6px;font-weight:500;line-height:10px;display:inline-flex}.wtg9ga_newSession{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-button-elevated-fill);height:38px;color:var(--dsw-alias-label-primary);cursor:pointer;flex:none;justify-content:center;align-items:center;gap:0;margin:0 2px 12px;padding:8px 12px;font-size:14px;font-weight:500;line-height:22px;display:flex;position:relative;overflow:hidden;container-type:inline-size}.wtg9ga_newSession:hover{background:var(--dsw-alias-button-floating-hover)}[data-platform=darwin] .wtg9ga_newSession{background:#ffffff8c}[data-platform=darwin] .wtg9ga_newSession:hover{background:#ffffff4d}[data-platform=darwin] [data-ds-dark-theme] .wtg9ga_newSession{background:#ffffff26}[data-platform=darwin] [data-ds-dark-theme] .wtg9ga_newSession:hover{background:#fff3}.wtg9ga_collapsed .wtg9ga_newSession{background:0 0;border-color:#0000;align-self:flex-start;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.wtg9ga_collapsed .wtg9ga_newSession:hover{background:var(--dsw-alias-interactive-bg-hover)}.wtg9ga_newSessionLabel{white-space:nowrap;max-width:200px;overflow:hidden}.wtg9ga_collapsed .wtg9ga_newSessionLabel{max-width:0}.wtg9ga_newSessionLabelMask{flex:1;min-width:0}.wtg9ga_newSession:is(:hover,:focus-visible) .wtg9ga_newSessionLabelMask:has(+.wtg9ga_newSessionShortcut){overflow:hidden;mask-image:linear-gradient(90deg,#000 calc(100% - 16px),#0000)}.wtg9ga_newSessionContent{justify-content:center;align-items:center;gap:6px;width:100cqw;display:flex}.wtg9ga_newSessionContent>svg{flex:none}.wtg9ga_newSessionShortcut{opacity:0;pointer-events:none;flex:none;font-weight:400;display:inline-flex}.wtg9ga_newSession:is(:hover,:focus-visible) .wtg9ga_newSessionShortcut{opacity:1}.wtg9ga_panelList{flex-direction:column;flex:none;gap:2px;margin-bottom:8px;display:flex}.wtg9ga_panelRow{box-sizing:border-box;border-radius:var(--dsw-radius-md);min-height:36px;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;align-items:center;gap:8px;margin:0 2px;padding:7px 8px;line-height:22px;display:flex}.wtg9ga_panelRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.wtg9ga_panelRow.wtg9ga_panelActive{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.wtg9ga_panelRow:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}.wtg9ga_moreAnchor{flex-direction:column;display:flex}.wtg9ga_panelRow[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}.wtg9ga_moreMenu{width:288px;max-width:calc(100vw - 24px)}.wtg9ga_panelGlyph{flex:none;justify-content:center;align-items:center;display:inline-flex}.wtg9ga_panelTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.wtg9ga_collapsed .wtg9ga_panelList{gap:12px;margin-bottom:12px}.wtg9ga_collapsed .wtg9ga_panelRow{width:36px;height:36px;color:var(--dsw-alias-label-primary);justify-content:center;margin:0;padding:0}.wtg9ga_regionArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-sidebar-inline-padding));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:hidden}.wtg9ga_collapsed .wtg9ga_regionArea{margin-left:0;margin-right:0;padding-left:0}.wtg9ga_footArea{flex-direction:column;flex:none;display:flex}.wtg9ga_settingsArea,.wtg9ga_footerActions{flex:none;width:100%;min-width:0}.wtg9ga_footerActions{display:flex}.wtg9ga_collapsed .wtg9ga_footArea{align-items:center}.wtg9ga_collapsed .wtg9ga_settingsArea,.wtg9ga_collapsed .wtg9ga_footerActions{justify-content:center;width:auto;display:flex}@media (prefers-reduced-motion:reduce){.wtg9ga_wide,.wtg9ga_fading>*,.wtg9ga_railIn .wtg9ga_iconButton,.wtg9ga_railIn .wtg9ga_newSession,.wtg9ga_railIn .wtg9ga_panelList,.wtg9ga_railIn .wtg9ga_footArea,.wtg9ga_railIn .wtg9ga_regionArea{transition:none;animation:none}}[data-windows-titlebar] .wtg9ga_root.wtg9ga_collapsed{padding:10px 10px 8px}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_logoRow{margin:0}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_panelList{display:flex;min-height:0;flex:1;align-items:center;gap:8px;margin:0 0 8px;overflow-y:auto;overflow-x:hidden}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_panelRow{flex:none}[data-windows-titlebar] .wtg9ga_collapsed .wtg9ga_footArea{display:flex}";
		const tagId = "@deepseek-ai/dsh-client-ui-sidebar/SidebarRoot.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-sidebar";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SidebarRoot_module_css_default = {
			"brand": "wtg9ga_brand",
			"brandIdentity": "wtg9ga_brandIdentity",
			"brandMark": "wtg9ga_brandMark",
			"brandName": "wtg9ga_brandName",
			"buildVersion": "wtg9ga_buildVersion",
			"collapsed": "wtg9ga_collapsed",
			"fading": "wtg9ga_fading",
			"fallbackBrandName": "wtg9ga_fallbackBrandName",
			"footArea": "wtg9ga_footArea",
			"footerActions": "wtg9ga_footerActions",
			"iconButton": "wtg9ga_iconButton",
			"localBuildBrand": "wtg9ga_localBuildBrand",
			"localBuildTitle": "wtg9ga_localBuildTitle",
			"logoRow": "wtg9ga_logoRow",
			"moreAnchor": "wtg9ga_moreAnchor",
			"moreMenu": "wtg9ga_moreMenu",
			"newSession": "wtg9ga_newSession",
			"newSessionContent": "wtg9ga_newSessionContent",
			"newSessionLabel": "wtg9ga_newSessionLabel",
			"newSessionLabelMask": "wtg9ga_newSessionLabelMask",
			"newSessionShortcut": "wtg9ga_newSessionShortcut",
			"panelActive": "wtg9ga_panelActive",
			"panelGlyph": "wtg9ga_panelGlyph",
			"panelIcon": "wtg9ga_panelIcon",
			"panelList": "wtg9ga_panelList",
			"panelRow": "wtg9ga_panelRow",
			"panelTitle": "wtg9ga_panelTitle",
			"quietBars": "wtg9ga_quietBars",
			"rail-fade-in": "wtg9ga_rail-fade-in",
			"rail-in": "wtg9ga_rail-in",
			"railIn": "wtg9ga_railIn",
			"railMark": "wtg9ga_railMark",
			"regionArea": "wtg9ga_regionArea",
			"root": "wtg9ga_root",
			"settingsArea": "wtg9ga_settingsArea",
			"toggle": "wtg9ga_toggle",
			"topStrip": "wtg9ga_topStrip",
			"wide": "wtg9ga_wide",
			"wide-in": "wtg9ga_wide-in"
		};
		//#endregion
		//#region lib/types/client/SidebarRoot.js
		/**
		* Sidebar shell: column geometry and global panel navigation.
		* Collapse is a slide plus crossfade:
		* content freezes at its expanded width (inline style) and fades out in place
		* while the sliding column (AppFrame grid tracks) clips it — nothing reflows
		* mid-slide. At settle the wide-only content unmounts and the upper
		* controls enter the 56px rail from the same horizontal offset (one icon each,
		* same top-down order) on one fade that ends with the slide. The bottom-pinned
		* settings control only fades. The workspace/session browsing region between
		* global panel rows and the foot is the `sidebar.workspaces` registrant's,
		* and the foot holds `sidebar.settings` plus `sidebar.footer.action`; the shell
		* hands them the wide flag (plus an expand request callback for the browser).
		*
		* The column also owns whether the scroll regions nested in it draw a
		* scrollbar at all: the shell tracks the pointer and rebinds ui-theme's
		* scrollbar indirection away while it is elsewhere, so a list the user is not
		* pointing at carries no bar.
		*/
		/** Wide-content unmount delay; matches the 150ms wide-content fade-out. */
		const COLLAPSE_SETTLE_MS = 150;
		/**
		* How long the column's scrollbars stay drawn after the pointer leaves it.
		* The bar is a pointer affordance here, and hiding it on the leave event
		* itself makes it blink out while the pointer is only crossing the column's
		* edge — on the way to the conversation, or around a portalled menu.
		*/
		const SCROLLBAR_LINGER_MS = 2e3;
		/** Format complete-build metadata for the local brand badge. */
		function localBuildVersion() {
			return `0.2.1-rc.5-d4db512` + ({}.DSH_CLIENT_GIT_DIRTY === "true" ? "-dirty" : "");
		}
		/** Analytics category of an official panel; other panels are never reported. */
		function officialEntry(id) {
			if (id === "plugins") return "plugin";
			return id === "schedules" ? "cron" : void 0;
		}
		/** Each panel row subscribes only to its own selection state. */
		function PanelRow({ id, label, wide, usePanelInfo, selectPanel, trackEntryClick, renderSlot }) {
			const active = usePanelInfo((info) => info.activePanelId === id);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label,
				delayMs: 500,
				disabled: wide,
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: clsx(SidebarRoot_module_css_default.panelRow, active && SidebarRoot_module_css_default.panelActive),
					"aria-label": label,
					"aria-current": active ? "page" : void 0,
					onClick: () => {
						const entry = officialEntry(id);
						if (entry !== void 0) trackEntryClick({
							menu_name: entry,
							position: "sidebar"
						});
						selectPanel(id);
					},
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: SidebarRoot_module_css_default.panelGlyph,
						"aria-hidden": "true",
						children: renderSlot("sidebar.panellist", {
							size: wide ? 16 : 18,
							active
						}, { only: id })
					}), wide && (0, react_jsx_runtime.jsx)("span", {
						className: clsx(SidebarRoot_module_css_default.panelTitle, SidebarRoot_module_css_default.wide),
						children: label
					})]
				})
			});
		}
		/** The panel list's More launcher: a panel-row button whose menu rows come from `sidebar.panellist.actions`. */
		function PanelMoreMenu({ wide, label, entries, onOpen, onPinnedChange, trackEntryClick, renderSlot }) {
			const [open, setOpen] = (0, react.useState)(false);
			const onDismiss = () => {
				setOpen(false);
			};
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				onClose: onDismiss,
				portal: true,
				autoFocus: true,
				className: SidebarRoot_module_css_default.moreAnchor,
				listClassName: SidebarRoot_module_css_default.moreMenu,
				anchor: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label,
					delayMs: 500,
					disabled: wide,
					children: (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: SidebarRoot_module_css_default.panelRow,
						"aria-label": label,
						"aria-haspopup": "menu",
						"aria-expanded": open,
						onClick: () => {
							trackEntryClick({
								menu_name: "more",
								position: "sidebar"
							});
							setOpen((value) => !value);
						},
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: SidebarRoot_module_css_default.panelGlyph,
							"aria-hidden": "true",
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconAppsAddOutlineRegular, { size: wide ? 16 : 18 })
						}), wide && (0, react_jsx_runtime.jsx)("span", {
							className: clsx(SidebarRoot_module_css_default.panelTitle, SidebarRoot_module_css_default.wide),
							children: label
						})]
					})
				}),
				children: renderSlot("sidebar.panellist.actions", {
					entries,
					onOpen,
					onPinnedChange,
					onDismiss
				})
			});
		}
		/**
		* Render the sidebar column shell.
		* @param props - composed slot props (runtime share + injected callbacks, contract/slots.ts).
		* @returns the sidebar element tree.
		*/
        const RAIL_CSS = `
/* Home composition reuses the shipped composer and its live session sources. */
.an3WzG_composerHero{gap:0;padding-bottom:32px;max-width:820px}
.an3WzG_composerHero .WOwLGG_root{padding:0 20px;margin-bottom:26px;height:auto;min-height:36px}
.an3WzG_composerHero .WOwLGG_headline{font-size:28px;line-height:38px;font-weight:600;letter-spacing:-.5px}
.an3WzG_composerHero .WOwLGG_fishHitbox,.an3WzG_composerHero .WOwLGG_previewBadge,.an3WzG_composerHero .WOwLGG_body{display:none}
.an3WzG_composerHero .an3WzG_heroWorkspaceRow{order:10;box-sizing:border-box;position:relative;z-index:10;flex-wrap:wrap;gap:12px;margin:-12px 28px 0;padding:20px 14px 10px;min-height:62px;border-radius:24px;background:var(--dsw-alias-bg-layer-1)}
.an3WzG_heroWorkspaceRow .WOwLGG_workspace{max-width:min(48%,280px);height:30px;min-height:30px;border-radius:8px;font-size:13px;font-weight:500}
.an3WzG_heroWorkspaceRow .m2hUqa_menuAnchor{order:3}
.an3WzG_heroWorkspaceRow .m2hUqa_seat{height:30px;border-radius:8px}
.an3WzG_heroWorkspaceRow .an3WzG_heroOptions{order:2;margin-left:0;flex:none}
.an3WzG_heroWorkspaceRow > [data-slot="conversation.hero.workspace"] > span{position:absolute}
.an3WzG_heroWorkspaceRow .WOwLGG_workspace,.an3WzG_heroWorkspaceRow .dsh-home-files,.an3WzG_heroWorkspaceRow .m2hUqa_seat{box-sizing:border-box;height:32px;min-height:32px;padding:0 10px;gap:6px;border-radius:10px;font-size:13px;font-weight:500}
.an3WzG_composerHero .GRgSLq_root{position:relative;z-index:11}
.an3WzG_composerHero .GRgSLq_card{border-radius:24px;min-height:128px}
.an3WzG_composerHero .GRgSLq_row{margin-top:auto;padding:2px 10px 8px}
.an3WzG_composerHero .GRgSLq_primary{transform:none}
.an3WzG_composerHero .GRgSLq_input,.an3WzG_composerHero .GRgSLq_placeholder{font-size:14px}
.dsh-home-files{display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;height:30px;padding:0 9px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap}
.dsh-home-files:hover,.dsh-home-files[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-home-files:disabled{opacity:.45;cursor:default}
.dsh-home-files:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
html[data-windows-titlebar]:root{--dsh-windows-menu-start:112px!important}
[data-windows-titlebar] .mP3x-q_leadingSeat{position:absolute;left:8px;top:4px;height:32px;z-index:1200}
.dsh-caption-controls{display:flex;align-items:center;gap:2px;-webkit-app-region:no-drag}
.dsh-caption-button{width:30px;height:30px;display:grid;place-items:center;padding:0;background:transparent;color:var(--dsw-alias-label-secondary);border:0;border-radius:6px;cursor:pointer}
.dsh-caption-button:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-caption-button:disabled{opacity:.28;cursor:default;background:transparent}
.dsh-caption-button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.dsh-rail-button[aria-current=page]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}
.dsh-navigation-shell .dsh-drawer-content{padding:16px 16px 12px;gap:14px}
.dsh-navigation-shell .dsh-drawer-sessions{margin-right:0}
.dsh-drawer-sessions .GAkraW_root:not(.GAkraW_rail) .GAkraW_sectionHeader{margin-right:0;margin-bottom:8px;gap:8px}
.dsh-drawer-sessions .GAkraW_headerActions{gap:8px}
.dsh-drawer-sessions .GAkraW_headerActions:not(.GAkraW_headerActionsHidden){max-width:64px}
@media(max-width:680px){.an3WzG_composerHero .an3WzG_heroWorkspaceRow{margin-left:24px;margin-right:24px}.an3WzG_composerHero .WOwLGG_headline{font-size:24px}.an3WzG_composerHero .WOwLGG_root{margin-bottom:20px}.an3WzG_composerHero .GRgSLq_card{min-height:120px}}
@media(max-height:540px){.an3WzG_composerHero{padding-top:20px;padding-bottom:16px}.an3WzG_composerHero .WOwLGG_root{margin-bottom:16px}}
@media(forced-colors:active){.dsh-rail-button[aria-current=page]{outline:1px solid Highlight}.an3WzG_composerHero .an3WzG_heroWorkspaceRow{border:1px solid ButtonText}}

        .dsh-navigation-shell{height:100%;min-width:0;display:flex;overflow:hidden;color:var(--dsw-alias-label-primary)}
        .dsh-function-rail{box-sizing:border-box;width:56px;min-width:56px;height:100%;display:flex;align-items:center;flex-direction:column;padding:10px 0 8px;gap:8px;border-right:0}
        .dsh-rail-button{box-sizing:border-box;width:36px;height:36px;flex:none;display:flex;align-items:center;justify-content:center;border:0;border-radius:10px;background:transparent;color:inherit;cursor:pointer;padding:0}
        .dsh-rail-button:hover,.dsh-rail-button[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}
        .dsh-rail-button:focus-visible,.dsh-drawer-new:focus-visible,.dsh-drawer-close:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}
        .dsh-rail-nav{display:flex;flex:1;min-height:0;width:56px;align-items:center;gap:8px;flex-direction:column;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}
        .dsh-rail-nav button{flex:none}.dsh-rail-footer{flex:none;display:flex;align-items:center;flex-direction:column;gap:8px;width:56px}
        .dsh-rail-account,.dsh-rail-extra{display:flex;justify-content:center;width:56px;min-width:0}.dsh-rail-extra:empty{display:none}
        html[data-windows-titlebar]:root{--dsh-windows-menu-start:112px!important}
        /* One continuous hairline around the conversation workspace, outside the fixed rail. */
        .mP3x-q_frame:has(.dsh-navigation-shell)>.mP3x-q_sidebarCol{border-right:0}
        .mP3x-q_frame[data-sidebar-collapsed=true]:has(.dsh-navigation-shell)>.mP3x-q_sidebarCol{box-shadow:none}
        .mP3x-q_frame:has(.dsh-navigation-shell)::after{content:"";position:absolute;inset:var(--dsh-frame-chrome-top,0px) 0 0 56px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent);border-radius:14px 0 0 14px;pointer-events:none;z-index:12}
        .mP3x-q_frame:has(.dsh-navigation-shell) .dsh-conversation-drawer{border-radius:14px 0 0 14px}
        .mP3x-q_frame[data-sidebar-collapsed=true]:has(.dsh-navigation-shell)>.mP3x-q_centerCol{border-radius:14px 0 0 14px}

        .dsh-conversation-drawer{box-sizing:border-box;height:100%;min-width:0;overflow:hidden;flex:none;opacity:1;transform:translateX(0);transition:width 220ms cubic-bezier(.22,.61,.36,1),opacity 180ms ease,transform 220ms cubic-bezier(.22,.61,.36,1),visibility 0s}
        .dsh-conversation-drawer[data-closed=true]{opacity:0;transform:translateX(-8px);visibility:hidden;pointer-events:none;transition:width 220ms cubic-bezier(.22,.61,.36,1),opacity 140ms ease,transform 220ms cubic-bezier(.22,.61,.36,1),visibility 0s linear 220ms}
        .dsh-drawer-content{box-sizing:border-box;height:100%;display:flex;flex-direction:column;padding:12px 12px 8px;gap:12px}
        .dsh-drawer-header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:30px;flex:none}
        .dsh-drawer-brand{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;min-width:0;white-space:nowrap}.dsh-drawer-brand>svg{flex:none}.dsh-drawer-brand>span{overflow:hidden;text-overflow:ellipsis}
        .dsh-drawer-wordmark{display:flex;align-items:center;min-width:0}.dsh-drawer-wordmark svg{max-width:190px;max-height:26px}
        .dsh-drawer-close{background:transparent;color:var(--dsw-alias-label-tertiary);border:0;border-radius:7px;width:28px;height:28px;display:grid;place-items:center;cursor:pointer;flex:none}
        .dsh-drawer-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:inherit}.dsh-drawer-new{display:flex;justify-content:flex-start;align-items:center;gap:9px;width:100%;min-height:36px;padding:8px 10px;flex:none;border:0;border-radius:9px;background:transparent;color:inherit;font:inherit;font-size:13px;line-height:20px;cursor:pointer;text-align:left;transition:background 140ms ease}.dsh-drawer-new:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsh-drawer-new:active{background:var(--dsw-alias-interactive-bg-active)}.dsh-drawer-new>svg{flex:none;opacity:.85}
        .dsh-drawer-sessions{display:flex;flex-direction:column;flex:1;min-height:0;margin-left:-4px;margin-right:-12px;padding-left:4px;overflow:hidden}
        .dsh-balance-button{position:relative;flex-direction:column;width:36px;height:38px;min-height:38px;padding:0;border-radius:10px;color:var(--dsw-alias-label-secondary)}.dsh-balance-button svg{display:block;flex:none;overflow:visible}
        .dsh-balance-arc{transform-origin:18px 18px;transition:transform 180ms ease,opacity 180ms ease;opacity:.6}.dsh-balance-track{stroke:currentColor;opacity:.28}.dsh-balance-fill{stroke:currentColor;transition:stroke-dashoffset .35s ease}.dsh-balance-total{stroke:currentColor;opacity:.55}
        .dsh-balance-button:is(:hover,:focus-visible)[data-indicator=segment] .dsh-balance-upper,.dsh-balance-button:is(:hover,:focus-visible)[data-indicator=total] .dsh-balance-lower{transform:scale(1.12);opacity:1}
        .dsh-balance-button[data-status=failed]{opacity:.5}.dsh-balance-dot{fill:currentColor;opacity:.6}.dsh-balance-multiple{position:absolute;right:-1px;bottom:-4px;max-width:34px;font-size:9px;line-height:11px;font-weight:500;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);background:var(--dsw-specific-sidebar-fill);border-radius:4px;padding:0 2px;overflow:hidden;text-overflow:ellipsis}
        html[data-as-reduced-motion=true] .dsh-conversation-drawer,html[data-as-reduced-motion=true] .dsh-balance-fill,html[data-as-reduced-motion=true] .dsh-balance-arc{transition:none}
        @media(prefers-reduced-motion:reduce){.mP3x-q_frame,.dsh-balance-fill,.dsh-conversation-drawer,.dsh-balance-arc{transition:none!important}}
        /* In the collapsed state, the border and clipped surface share one box.
           This avoids independent corner paths in the frame overlay and content. */
        .mP3x-q_frame[data-sidebar-collapsed=true]:has(.dsh-navigation-shell)::after{display:none}
        .mP3x-q_frame[data-sidebar-collapsed=true]:has(.dsh-navigation-shell)>.mP3x-q_centerCol{box-sizing:border-box;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent);border-right:0;border-radius:14px 0 0 14px;background-clip:padding-box}
        .mP3x-q_frame[data-sidebar-collapsed=true]>.mP3x-q_sidebarCol:has(.dsh-navigation-shell){position:relative;z-index:16;overflow:visible}
        .dsh-navigation-shell[data-conversations-hidden=true]{overflow:visible}
        .mP3x-q_frame:has(.dsh-navigation-shell) .dsh-conversation-drawer[data-preview=true]{position:absolute;z-index:18;left:64px;top:8px;bottom:8px;height:auto;max-width:calc(100vw - 80px);overflow:visible;border:1px solid var(--dsw-alias-border-l3);border-radius:14px;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-prominent,0 12px 36px rgb(0 0 0 / .24));opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity 120ms ease,transform 160ms ease}
        .dsh-conversation-drawer[data-preview=true]>.dsh-drawer-content{overflow:hidden;border-radius:inherit}
        /* The transparent bridge remains part of the preview hit area. */
        .dsh-conversation-drawer[data-preview=true]::before{content:"";position:absolute;left:-18px;top:0;bottom:0;width:18px}
        @media(prefers-reduced-motion:reduce){.dsh-conversation-drawer[data-preview=true]{transition:none}}
        @media(forced-colors:active){.dsh-conversation-drawer[data-preview=true]{background:Canvas;border-color:CanvasText}}

        `;

        // Split the integer decimal string before converting the sub-10 remainder.
        // This avoids rounding 9.99999 up to 10 or losing a large reserve count.
        function splitYuan(amount) {
            const raw=String(amount);
            if(!/^-?\d+(?:\.\d+)?$/.test(raw)) return null;
            const [whole,decimal='']=raw.replace(/^-/,'').split('.');
            const negative=raw.startsWith('-');
            const count=negative?0n:BigInt(whole)/10n;
            const remainder=negative?0:Number(`${Number(BigInt(whole)%10n)}.${decimal||'0'}`);
            const fraction=Math.max(0,Math.min(1,remainder/10));
            const tiny=BigInt(whole)===0n&&/^00/.test(decimal)&&/[1-9]/.test(decimal);
            const display=(negative?'-':'')+BigInt(whole).toString()+'.'+(tiny?decimal.replace(/0+$/,''):decimal.slice(0,2).padEnd(2,'0'));
            return {fraction,count:count.toString(),remainder,display};
        }

        function createRailBalance(ctx) {
            const store=_deepseek_ai_dsh_client_store.createSnapshotStore({status:'loading'});
            let disposed=false, generation=0, signedIn=false, inFlight;
            const cancellations=new Set();
            const publish=value=>{if(!disposed)store.set(value);};
            const refresh=()=>{
                if(disposed||!signedIn)return Promise.resolve();
                if(inFlight)return inFlight;
                const current=generation;
                publish({...store.getSnapshot(),refreshing:true});
                let timeout,cancel;
                const request=Promise.race([
                    Promise.resolve().then(()=>ctx.remote.account.getBalance({version:'0.2.1-rc.5',locale:ctx.locale.getSnapshot().active,timezoneOffsetSeconds:-new Date().getTimezoneOffset()*60})),
                    new Promise((_,reject)=>{cancel=()=>reject(new Error('Balance reader disposed'));cancellations.add(cancel);timeout=setTimeout(()=>reject(new Error('Balance read timed out')),20000);})
                ]).then(result=>{
                    if(disposed||generation!==current)return;
                    const value=result.ok&&result.value?.status==='ready'?result.value.value:null;
                    const wallet=Array.isArray(value)?value.find(w=>w.currency==='CNY'):null;
                    const segment=wallet?splitYuan(wallet.balance):null;
                    // No implicit USD conversion and no simulated zero on failures.
                    publish(segment?{status:'ready',...segment,updated:Date.now()}:{status:'failed'});
                }).catch(()=>{if(!disposed&&generation===current)publish({status:'failed'});}).finally(()=>{clearTimeout(timeout);cancellations.delete(cancel);if(inFlight===request)inFlight=undefined;});
                inFlight=request;
                return request;
            };
            const stream=ctx.remote.$stream({name:'navigation-rail-account',open:signal=>ctx.remote.account.watch(signal),ended:()=>new Error('Account state stream ended')});
            ctx.effect(()=>{
                (async()=>{for await(const frame of stream){
                    if(disposed)break;
                    generation++;inFlight=undefined;
                    signedIn=frame.value.status==='credential-stored';
                    publish({status:signedIn?'loading':'signedOut'});
                    frame.accept();
                    if(signedIn)void refresh();
                }})().catch(()=>{if(!disposed){generation++;signedIn=false;publish({status:'failed'});}});
                const visible=()=>{if(document.visibilityState!=='hidden')void refresh();};
                const timer=setInterval(visible,60000);
                window.addEventListener('focus',visible);
                document.addEventListener('visibilitychange',visible);
                return ()=>{disposed=true;generation++;for(const cancel of cancellations)cancel();cancellations.clear();clearInterval(timer);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);void stream.dispose();};
            },'navigation rail: balance account stream and refresh lifetime');
            return {store,refresh};
        }

        function BalanceRing({useBalance,refreshBalance,t}) {
            const h=react.createElement;
            const value=useBalance(s=>s);
            const [indicator,setIndicator]=react.useState('segment');
            const ready=value.status==='ready';
            const reserve=ready&&value.count!=='0';
            const label=ready?`${t('rail.balance')} ¥${value.display} · ${t('rail.segment')}${reserve?' · '+t('rail.reserve',{count:value.count}):''} · ${t('rail.refresh')}`:t('rail.'+(value.status==='signedOut'?'signedOut':value.status==='loading'?'loading':'unavailable'));
            const tooltip=ready?(indicator==='segment'?`${t('rail.ten')} · ${t('rail.remaining',{percent:Math.floor(value.fraction*100)})}`:`${t('rail.total')} · ¥${value.display}`):label;
            const upper='M5.5 16 A12.7 12.7 0 0 1 30.5 16';
            const lower='M30.5 20 A12.7 12.7 0 0 1 5.5 20';
            return h(_deepseek_ai_dsh_client_ui_primitives.Tooltip,{label:tooltip,side:'right',delayMs:120,portal:true},
                h('button',{type:'button',className:'dsh-rail-button dsh-balance-button','aria-label':label,'aria-busy':value.refreshing||value.status==='loading','data-status':value.status,'data-indicator':indicator,onPointerMove:event=>{const rect=event.currentTarget.getBoundingClientRect();setIndicator(event.clientY<rect.top+rect.height/2?'segment':'total');},onKeyDown:event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();setIndicator(event.key==='ArrowUp'?'segment':'total');}},onClick:()=>{void refreshBalance();}},
                    h('svg',{width:30,height:30,viewBox:'0 0 36 36','aria-hidden':true},
                        h('g',{className:'dsh-balance-arc dsh-balance-upper'},
                            h('path',{className:'dsh-balance-track',d:upper,fill:'none',strokeWidth:1.8,strokeLinecap:'round'}),
                            ready&&h('path',{className:'dsh-balance-fill',d:upper,fill:'none',strokeWidth:1.8,pathLength:100,strokeDasharray:'100 100',strokeDashoffset:100-value.fraction*100,strokeLinecap:'round',opacity:value.fraction===0?0:1})),
                        h('g',{className:'dsh-balance-arc dsh-balance-lower'},h('path',{className:'dsh-balance-total',d:lower,fill:'none',strokeWidth:1.8,strokeLinecap:'round',strokeDasharray:ready?undefined:'2 4'})),
                        h('circle',{className:'dsh-balance-dot',cx:18,cy:18,r:2.5})),
                    reserve&&h('span',{className:'dsh-balance-multiple','aria-hidden':true},value.count+'×')));
        }

        function SidebarRoot({ collapsed, width, startSession, toggleSidebar, selectPanel, setPinned, trackEntryClick, usePanels, useEntryPins, useEntryActions, useShortcuts, usePanelInfo, useBalance, refreshBalance, t, renderSlot }) {
            const h = react.createElement;
            const panels = usePanels(s => s);
            const unpinned = useEntryPins(s => s);
            const activePanelId = usePanelInfo(s => s.activePanelId);
            const hasEntryActions = useEntryActions(s => s);
            const newShortcut = useShortcuts(rows => rows.find(row => row.id === 'session.new'));
            const drawerWidth = react.useRef(Math.max(264, width - 56));
            if (!collapsed) drawerWidth.current = Math.max(264, width - 56);
            const [previewOpen, setPreviewOpen] = react.useState(false);
            const homeRef = react.useRef(null);
            const drawerRef = react.useRef(null);
            const hover = react.useRef({home:false,drawer:false,keyboard:false,openTimer:null,closeTimer:null});
            const preview = collapsed && previewOpen;
            const visible = !collapsed || preview;
            const clearTimers = () => {
                clearTimeout(hover.current.openTimer);
                clearTimeout(hover.current.closeTimer);
                hover.current.openTimer = hover.current.closeTimer = null;
            };
            const closePreview = () => { clearTimers(); hover.current.keyboard = false; setPreviewOpen(false); };
            const holdPreview = () => { clearTimeout(hover.current.closeTimer); hover.current.closeTimer = null; };
            const scheduleClose = () => {
                clearTimeout(hover.current.openTimer);
                clearTimeout(hover.current.closeTimer);
                hover.current.closeTimer = setTimeout(() => {
                    const state = hover.current;
                    if (state.home || state.drawer) return;
                    // Workspace menus and dialogs render in portals. Keep the drawer
                    // mounted until those operations end, including native folder picking.
                    if (document.querySelector('[role="menu"], [role="dialog"], [aria-modal="true"]')) { scheduleClose(); return; }
                    if (state.keyboard && (homeRef.current?.contains(document.activeElement) || drawerRef.current?.contains(document.activeElement))) return;
                    setPreviewOpen(false);
                }, 260);
            };
            const enterHome = event => {
                if (!collapsed || event.pointerType === 'touch') return;
                hover.current.home = true;
                hover.current.keyboard = false;
                holdPreview();
                if (previewOpen) return;
                clearTimeout(hover.current.openTimer);
                hover.current.openTimer = setTimeout(() => setPreviewOpen(true), 160);
            };
            const leaveHome = () => { hover.current.home = false; if (collapsed) scheduleClose(); };
            react.useEffect(() => {
                clearTimers(); hover.current.home = hover.current.drawer = hover.current.keyboard = false;
                setPreviewOpen(false);
                return clearTimers;
            }, [collapsed]);
            react.useEffect(() => {
                if (!preview) return;
                const outside = event => {
                    if (!(event.target instanceof Element)) return;
                    if (homeRef.current?.contains(event.target) || drawerRef.current?.contains(event.target)) return;
                    if (event.target.closest('[role="menu"], [role="dialog"], [aria-modal="true"]')) return;
                    closePreview();
                };
                const escape = event => {
                    if (event.key !== 'Escape' || document.querySelector('[role="menu"], [role="dialog"], [aria-modal="true"]')) return;
                    if (drawerRef.current?.contains(document.activeElement)) homeRef.current?.focus({preventScroll:true});
                    closePreview();
                };
                const focus = event => { if (hover.current.keyboard) outside(event); };
                window.addEventListener('pointerdown', outside, true);
                window.addEventListener('keydown', escape);
                window.addEventListener('focusin', focus);
                window.addEventListener('blur', closePreview);
                return () => {
                    window.removeEventListener('pointerdown', outside, true);
                    window.removeEventListener('keydown', escape);
                    window.removeEventListener('focusin', focus);
                    window.removeEventListener('blur', closePreview);
                };
            }, [preview]);
            const openNew = () => { trackEntryClick({menu_name:'new_session',position:'sidebar'}); startSession(); };
            const iconButton = (label, action, glyph, extra={}) => h(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {label,side:'right',delayMs:350,disabled:preview},
                h('button',{type:'button',className:'dsh-rail-button','aria-label':label,onClick:action,...extra},glyph));
            return h('div', {className:'dsh-navigation-shell','data-conversations-hidden':collapsed||undefined,'data-hover-preview':preview||undefined},
                h('style',null,RAIL_CSS),
                h('aside', {className:'dsh-function-rail','aria-label':t('panels.label')},
                    iconButton(t('rail.home'),openNew,h('svg',{width:19,height:19,viewBox:'0 0 24 24',fill:'currentColor','aria-hidden':true},h('path',{d:'M3.5 10.1 11 3.7a1.5 1.5 0 0 1 2 0l7.5 6.4v9.2a1.7 1.7 0 0 1-1.7 1.7h-4.3v-6.3h-5V21H5.2a1.7 1.7 0 0 1-1.7-1.7z'})),{
                        ref:homeRef,'aria-current':activePanelId===null?'page':undefined,'aria-controls':'dsh-conversation-drawer','aria-expanded':visible,
                        onPointerEnter:enterHome,onPointerLeave:leaveHome,
                        onKeyDown:event=>{if(collapsed&&(event.key==='ArrowRight'||event.key==='ArrowDown')){event.preventDefault();clearTimers();hover.current.keyboard=true;setPreviewOpen(true);requestAnimationFrame(()=>drawerRef.current?.querySelector('button')?.focus({preventScroll:true}));}}
                    }),
                    h('nav',{className:'dsh-rail-nav '+SidebarRoot_module_css_default.collapsed,'aria-label':t('panels.label')},
                        panels.filter(({id})=>id==='plugins'||!unpinned.includes(id)).map(({id,label})=>h(PanelRow,{key:id,id,label,wide:false,usePanelInfo,selectPanel,trackEntryClick,renderSlot})),
                        hasEntryActions && h(PanelMoreMenu,{wide:false,label:t('panels.more'),entries:panels.filter(p=>p.id!=='plugins').map(p=>({...p,pinned:!unpinned.includes(p.id),active:p.id===activePanelId})),onOpen:selectPanel,onPinnedChange:setPinned,trackEntryClick,renderSlot})),
                    h('div',{className:'dsh-rail-footer'},
                        h(BalanceRing,{useBalance,refreshBalance,t}),
                        h('div',{className:'dsh-rail-extra'},renderSlot('sidebar.footer.action',{wide:false})),
                        h('div',{className:'dsh-rail-account'},renderSlot('sidebar.settings',{wide:false})))),
                h('section',{
                    ref:drawerRef,id:'dsh-conversation-drawer',className:'dsh-conversation-drawer',
                    'data-closed':!visible||undefined,'data-preview':preview||undefined,'aria-hidden':!visible,inert:!visible?'':undefined,'aria-label':t('rail.chats'),
                    onPointerEnter:()=>{hover.current.drawer=true;holdPreview();},
                    onPointerLeave:()=>{hover.current.drawer=false;if(collapsed)scheduleClose();},
                    onBlur:()=>{if(collapsed&&hover.current.keyboard)scheduleClose();},
                    style:{width:collapsed?(preview?drawerWidth.current:0):Math.max(0,width-56)}
                },
                  h('div',{className:'dsh-drawer-content',style:{width:preview?'100%':drawerWidth.current}},
                    h('header',{className:'dsh-drawer-header'},
                        h('span',{className:'dsh-drawer-brand'},renderSlot('sidebar.brand.mark',{size:23},{fallback:h(_deepseek_ai_dsh_client_ui_primitives.FishLogo,{size:23})}),h('span',{className:'dsh-drawer-wordmark'},renderSlot('sidebar.brand.name',{},{fallback:'DeepSeek Harness'})))),
                    h('button',{type:'button',className:'dsh-drawer-new','aria-label':t('session.new.label'),'aria-keyshortcuts':newShortcut?.aria,onClick:openNew},h(_deepseek_ai_dsh_client_ui_primitives.IconNewChatOutlineRegular,{size:16}),t('rail.newChat')),
                    h('div',{className:'dsh-drawer-sessions'},renderSlot('sidebar.workspaces',{wide:true,expandSidebar:()=>{if(collapsed&&!preview)toggleSidebar();}})))));
        }

		//#endregion
		//#region lib/types/client/locales.js
		/** `sidebar` namespace dictionaries for shell controls and global panels. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"session.new": "新会话",
			"session.new.label": "新建会话",
			"toggle.open": "展开会话列表",
			"toggle.collapse": "收起会话列表",
			"panels.label": "全局面板",
			"panels.more": "更多"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"session.new": "New Session",
			"session.new.label": "New session",
			"toggle.open": "Open conversations",
			"toggle.collapse": "Hide conversations",
			"panels.label": "Global panels",
			"panels.more": "More"
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Dictionary namespace owned by this plugin. */
		const NS = "sidebar";
		/** Services required by the sidebar plugin. */
		Object.assign(zh, {"rail.home":"主页","rail.back":"返回","rail.forward":"前进","rail.noHistory":"暂无浏览记录","rail.newChat":"新对话", "rail.ten":"10 元", "rail.total":"总余额", "rail.remaining":"剩余 {percent}%", "rail.chats":"会话", "rail.balance":"充值余额", "rail.segment":"每圈 ¥10", "rail.reserve":"另有 {count} 份 ¥10", "rail.refresh":"点击刷新余额", "rail.loading":"正在读取余额…", "rail.unavailable":"余额暂不可用 · 点击重试", "rail.signedOut":"登录后查看余额"});
		Object.assign(en, {"rail.home":"Home","rail.back":"Back","rail.forward":"Forward","rail.noHistory":"No navigation history","rail.newChat":"New chat", "rail.ten":"¥10", "rail.total":"Total balance", "rail.remaining":"{percent}% left", "rail.chats":"Conversations", "rail.balance":"Topped-up balance", "rail.segment":"¥10 per ring", "rail.reserve":"Plus {count} × ¥10", "rail.refresh":"Click to refresh balance", "rail.loading":"Loading balance…", "rail.unavailable":"Balance unavailable · click to retry", "rail.signedOut":"Sign in to view balance"});
		const inject = [
			"slots",
			"layout",
			"uiWorkspace",
			"locale",
			"shortcuts", "remote", "remote.account"
		];
		/** Registers the sidebar shell and its service callbacks.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			const workspaceNavigation = ctx.get("uiWorkspace");
			const railBalance = createRailBalance(ctx);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-sidebar: dictionaries");
			const navigation = createNavigation(ctx,workspaceNavigation);
            const panels = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)([]);
			const syncPanels = () => {
				const next = ctx.slots.entriesOfSlot("sidebar.panellist").map(({ options }) => {
					const id = options.id;
					return {
						id,
						order: options.order ?? 0,
						label: (0, _deepseek_ai_dsh_client_ui_slots.resolveSlotLabel)(options.label) ?? id
					};
				}).sort((a, b) => a.order - b.order);
				const previous = panels.getSnapshot();
				if (previous.length === next.length && previous.every((panel, index) => {
					const candidate = next[index];
					return panel.id === candidate.id && panel.order === candidate.order && panel.label === candidate.label;
				})) return;
				panels.set(next);
			};
			ctx.effect(() => ctx.slots.subscribe("sidebar.panellist", syncPanels), "ui-sidebar: panel entries");
			ctx.effect(() => ctx.locale.subscribe(syncPanels), "ui-sidebar: panel labels");
			const panelPins = createPanelPins();
			const entryActions = {
				getSnapshot: () => ctx.slots.entriesOfSlot("sidebar.panellist.actions").length > 0,
				subscribe: (listener) => ctx.slots.subscribe("sidebar.panellist.actions", listener)
			};
			const injectProps = () => ({
				refreshBalance: railBalance.refresh,
                navigateBack:navigation.back,navigateForward:navigation.forward,
				startSession: (workspaceId) => {
					workspaceNavigation.startSession(workspaceId);
				},
				toggleSidebar: () => {
					ctx.layout.toggleSidebar();
				},
				selectPanel: (id) => {
					ctx.layout.selectPanel(id);
				},
				setPinned: panelPins.setPinned,
				trackEntryClick: (attributes) => {
					ctx.get("productAnalytics")?.track("sidebar_menu_click", attributes);
				},
				hooks: {
					balance: railBalance.store,
                    navigation:navigation.store,
					panels,
					shortcuts: ctx.shortcuts.catalog,
					entryPins: panelPins.unpinned,
					entryActions
				}
			});
			ctx.slots.inject("sidebar", () => ctx.slots.register({
				name: "sidebar",
				locale: NS,
				children: {
					"sidebar.brand.mark": {
						kind: "single",
						scope: "root"
					},
					"sidebar.brand.name": {
						kind: "single",
						scope: "root"
					},
					"sidebar.toggle.badge": {
						kind: "single",
						scope: "root"
					},
					"sidebar.panellist": {
						kind: "list",
						scope: "root"
					},
					"sidebar.panellist.actions": {
						kind: "list",
						scope: "root"
					},
					"sidebar.workspaces": {
						kind: "single",
						scope: "root"
					},
					"sidebar.settings": {
						kind: "single",
						scope: "root"
					},
					"sidebar.footer.action": {
						kind: "list",
						scope: "root"
					}
				},
				inject: injectProps
			}, SidebarRoot));
			ctx.slots.inject("shell.leading", () => ctx.slots.register({
				name: "shell.leading",
				locale: NS,
				inject: injectProps
			}, HeaderLeadingControls));
			syncPanels();
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

