# 导航与余额

为 DeepSeek Harness 提供主页输入区、固定图标导航栏、独立会话抽屉、标题栏导航、余额指示和桌面启动保护。

插件：`@local/dsh-navigation-rail` · 版本：**1.4.0**

适用版本：**DeepSeek Harness 0.2.1-rc.5**。

## 功能与数据

- 保持 56px 功能图标栏，会话列表独立展开和收起。
- 保留原生标识、标题栏菜单和底部账户入口；短窗口支持导航滚动。
- 充值余额按 10 元档位显示比例及倍数，未登录或读取失败时不伪造为零。
- 启动时读取当前插件图，避免原生桌面刷新继续使用过期脚本地址。

该插件包含基于 **DeepSeek Harness 0.2.1-rc.5** 修改的 `layout`、`sidebar`
模块，替代当前 profile 的 `ui-layout` 和 `ui-sidebar`。上游 MIT 许可证分别
保留在两个子目录中，出处见 `THIRD_PARTY_NOTICES.md`。

仓库的 `cordis.patch.yml` 使用相对模块路径。当前版本的 DSH 加载器会以
补丁文件所在目录为基准转换为 file URL，无需改成某台电脑的绝对路径。
升级 Harness 后应先核对这两个固定版本的模块兼容性。安装、卸载或更新该插件
后请完整退出并重新打开桌面程序，使原生启动配置重新加载。

## 1.3.2 更新

- 主页欢迎语后显示原有输入框，下方提供工作区、文件资料库及模式入口。
- 底栏与输入框贴合，圆角 24px；三个入口等高，按钮间距 12px。
- 标题栏增加会话列表开关、返回/前进及应用、编辑、视图、帮助菜单。
- Alt+← / Alt+→ 使用官方 fixedInput；导航历史仅保存在当前窗口，刷新清空。
- Ctrl+B 保留原生行为；提供界面缩放、刷新与全屏菜单和快捷键。
- 保留工作区外框、侧栏间距调整及桌面启动保护。

原生标题栏和 Acrylic 联动需要单独配套的桌面壳补丁；本仓库不附带修改后的
`app.asar`，单独安装插件不能获得全部原生窗口功能。

## 1.4.0 更新

- 收起侧栏时，正文容器统一绘制边框与圆角，修正上下接缝。
- 在主页图标上停留约 160ms 后临时展开会话列表；移入列表可切换或新建对话，移出约 260ms 后收起。
- 悬浮列表覆盖正文，正文宽度与位置保持不变；支持跨越图标与列表间隙，并在操作列表菜单时保持显示。
- 标题栏开关仍可固定展开侧栏；键盘聚焦主页后按右箭头可进入临时列表，Esc 关闭并返回主页。
- 复用原会话列表和服务，不复制会话数据。

已在 Windows 桌面端对对应 Harness 版本检查深浅色圆角与浮层，13 项鼠标、会话导航、菜单和键盘交互检查通过。仓库内 `npm test` 仍为离线回归检查，不包含这些真实桌面操作。

## 安装

克隆仓库到固定目录后，在仓库根目录打开 PowerShell：

```powershell
$dsh = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
& $dsh plugin --profile desktop add (Get-Location).Path
```

如 Harness 安装在其他位置，把 `$dsh` 改为对应 CLI 路径。插件使用 DSH
提供的服务，无需自行安装 React 或其他前端运行依赖。安装后刷新页面；涉及
原生启动配置时完整重启桌面程序。使用其他 profile 时替换 `desktop`。

卸载：

```powershell
& $dsh plugin --profile desktop remove @local/dsh-navigation-rail
```

## 验证

使用 Node.js 22.15 或更新版本，在仓库根目录运行：

```powershell
npm test
npm pack --dry-run
```

`tests/` 包含使用本地代码、模拟服务或临时目录的离线回归检查，无需账户密钥。
这些检查不覆盖安装后的完整桌面交互，界面兼容性需在对应 Harness 版本中确认。

## 目录

- `index.js`：Host 服务入口。
- `package.json`、`cordis.patch.yml`：DSH bundle 元数据与加载配置。
- `tests/`：可复跑检查。
- `layout/`、`sidebar/`：固定版本的原生布局和侧栏模块。
