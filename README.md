# 谁惹痘

仅供个人使用的“饮食习惯 × 痘痘变化”本地追踪 PWA。无账号、无云同步、无分析 SDK；全部业务数据和照片保存在设备 IndexedDB。

## Windows 本地运行

1. 从 [Node.js 官网](https://nodejs.org/) 安装 Node.js 22 LTS。安装时保留默认选项。
2. 在项目文件夹空白处按住 Shift 右键，选择“在终端中打开”。
3. 依次运行：

```powershell
npm install
npm run dev
```

终端会显示本地地址，在浏览器打开即可。常用检查命令：

```powershell
npm run typecheck
npm test
npm run build
npm run lint
```

## 发布到 GitHub Pages

1. 注册或登录 GitHub，创建名为 `who-provoked-acne` 的空 repository，不要勾选自动创建 README。
2. 在本项目终端运行：

```powershell
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin https://github.com/<你的用户名>/who-provoked-acne.git
git push -u origin main
```

3. 打开仓库的 **Settings → Pages**，在 **Build and deployment / Source** 选择 **GitHub Actions**。
4. 打开 **Actions** 查看构建。只有类型检查、测试和生产构建全部通过才会发布。
5. 地址为 `https://<你的用户名>.github.io/who-provoked-acne/`。

## 安装到 iPhone 主屏幕

1. 使用 iOS 17 或更高版本的 Safari 打开部署地址。
2. 点 Safari 底部“分享”按钮，选择“添加到主屏幕”。
3. 确认名称后添加。以后从主屏幕图标启动，会以独立 Web App 打开而没有普通 Safari 地址栏。
4. 首次完整加载后，应用外壳可离线打开，离线时仍可新增和查看记录；重新联网不会上传或同步业务数据。

## 数据安全与备份

- 主数据库为 IndexedDB，不使用 localStorage 存储业务数据。
- “我的 → 数据安全”可检查数据库、持久化存储、占用与配额。
- JSON 数据备份不含照片；ZIP 完整备份包含照片，可恢复到空数据库。
- 恢复前会完整校验，默认替换全部数据，不做合并。
- 浏览器本地存储无法保证 100% 永久不丢失。清除网站数据、卸载或系统回收空间都可能造成数据丢失，请定期导出完整备份。

## 洞察算法说明

洞察只在至少 14 个有效记录日后展示结论。因素日 `t0` 的 72 小时窗口要求 `t0`、`t+1`、`t+2`、`t+3` 四天新增痘痘状态全部明确；UNKNOWN 不会被当作 0 或“未暴露”。暴露与对照都至少需要 5 个完整窗口。

相关等级以两组“72 小时出现新增痘痘比例”的百分点差为主要依据：5、15、30 个百分点分别作为“关联较弱”“可能相关”“关联较明显”的产品启发式阈值。阈值集中在 `src/insightConfig.ts`，不具备医学意义，也不表示因果关系。

## 技术结构

React + TypeScript + Vite + Dexie/IndexedDB + vite-plugin-pwa + JSZip。生产代码没有第三方业务 API、Analytics 或 Telemetry。数据库升级只使用 Dexie migration，从不自动删除数据库。
