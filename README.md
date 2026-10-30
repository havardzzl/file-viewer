# Folio 文件预览器

支持粘贴、选择本地文件和拖放文件，自动识别并展示 JSON、Markdown、TOML、YAML 等格式。文件内容仅在浏览器本地处理。

## 直接打开

双击项目根目录下的 index.html，或将它拖入浏览器即可使用，无须启动服务器或安装 Node.js。dist/index.html 也是可独立打开的版本。应用脚本和样式已内嵌；断网时仍可使用，在线字体不可用时自动使用系统字体。

如果只想发布这个单页，也可以直接把 index.html 上传到支持单页网站的静态托管服务，无须 build。

## 本地开发

运行 npm install 后运行 npm run dev，打开终端输出的本地网址。

源码入口是 src/index.html，界面逻辑和样式分别位于 src/main.jsx、src/style.css。

## 构建与部署

运行 npm run build。每次构建会同步更新根目录的 index.html 和部署目录 dist/index.html。请修改 src/ 中的源码，再重新构建；不要直接编辑生成的根目录 HTML。

### 部署到 Vercel

把整个项目提交到 GitHub 并导入 Vercel，保留默认的项目根目录。Vercel 会安装 package.json 中的依赖、运行 npm run build，并按 vercel.json 部署 dist/。需要上传或提交的源码文件有 package.json、package-lock.json、vite.config.js、vercel.json、scripts/、src/ 和 index.html；node_modules/ 和 dist/ 已生成或忽略，无须提交。

也可先在本地运行 npm run build，再使用 Vercel CLI 执行 vercel deploy --prebuilt。临时预览部署适合短期试用；正式站点应在已登录的 Vercel 项目中部署。
