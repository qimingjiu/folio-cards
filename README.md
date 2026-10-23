# Folio · 项目卡片工坊

**把你的项目，漂亮地分享。**

一个轻巧的项目分享图生成器。写下项目名称、简介与亮点，挑选主题和版式，直接导出高清 PNG。

原创 TypeScript + Canvas 实现，MIT 许可，运行和构建均无第三方 npm 依赖。没有账号系统、付费墙或导出水印。

![Folio 项目卡片工坊界面](docs/preview.jpg)

## 能做什么

- **三套主题**：纸间、午夜、薄荷。
- **三种版式**：封面、功能亮点、新版本发布。
- **三种比例**：横版 1200 × 675、方形 1080 × 1080、竖版 1080 × 1440。
- **高清导出**：1× / 2× PNG，预览与导出使用同一绘制函数。
- **项目截图**：本地上传 PNG / JPG / WebP，保留完整画面；最长边缩至 1600 px 后存入草稿。
- **本地草稿**：自动保存当前草稿，支持 JSON 导入与导出；替换前会确认。
- **响应式界面**：桌面与手机浏览器均可使用。

> 数据保存在当前浏览器的 localStorage，清除站点数据会删除草稿，跨设备请使用 JSON 导出。应用不发送内容或上传的截图；访问托管网站仍会产生普通页面访问请求。不同设备使用系统字体，字形与换行可能略有区别。文字过长时会缩小或省略，并在预览下方提醒。

## 本地运行

需要 **Node.js 24+**。无须 `npm install`。

```sh
npm run dev
```

打开终端显示的 `http://localhost:4173`。这个命令启动时构建一次；修改源文件后请重启。可用 `PORT=3000 npm run dev` 指定端口。

```sh
npm test       # 草稿边界、文本排版等测试
npm run build # 输出到 dist/
```

构建使用 Node 的 `stripTypeScriptTypes` 去掉可擦除的类型语法，不做类型检查。`tsconfig.json` 用于编辑器检查；新增代码应避免 enum、namespace 等需要转换的语法。

## 部署

将 `dist/` 上传到任意静态托管服务即可，无服务端、密钥或数据库要求。文件使用相对路径，也可以部署到 GitHub Pages 的仓库子目录。

仓库附带手动触发的 GitHub Pages 工作流：在仓库 Settings → Pages 中把 Source 设为 GitHub Actions，再到 Actions 运行 **Deploy Pages**。CI 会在 push / pull request 时运行测试与构建。

## 赞助

赞助入口尚未开通。当前界面隐藏赞助按钮，仓库没有填写虚假的收款地址。开通真实赞助页后，按 [赞助配置说明](docs/sponsorship.md) 接入即可。

## 项目结构

```text
src/model.ts       草稿模型、校验与文本换行
src/render.ts      Canvas 卡片绘制
src/app.ts         编辑、预览、存储、导出
src/config.ts      作者与赞助入口
public/           HTML、CSS 与原创 SVG 图标
scripts/          无依赖构建与开发服务器
tests/            Node 内置测试
```

代码、图形和主题均独立实现。字体来自使用者设备，不捆绑第三方字体或图片。许可证见 [MIT License](LICENSE)。

## English

Folio is a local-first project card studio: three themes, three layouts, three aspect ratios, screenshot uploads, PNG export and portable JSON drafts. Built independently with TypeScript and Canvas. Zero third-party npm dependencies. MIT licensed. Requires Node.js 24+ for development; run `npm run dev`.
