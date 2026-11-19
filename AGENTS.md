# 项目协作约定

## 用户的持续授权与发布要求

用户要求：后续本项目的改动完成后，都要同步更新 GitHub 和 Vercel。这是本项目的默认交付要求；除非用户在当前任务明确要求仅本地修改、暂停发布或使用其他流程，否则应完成提交、推送和生产部署验证，无须再次询问是否同步。

- GitHub 仓库：`havardzzl/file-viewer`
- Git 远程：`git@github.com:havardzzl/file-viewer.git`
- 生产分支：`main`
- Vercel 项目：`file-viewer`（不要误用 `file-viewer-static`）
- Vercel Project ID：`prj_K8lIL8u5rmjHJvG5Nn3MEabUz9oP`
- Vercel Team ID：`team_GTsE8RoUaARJRmoHB0lTlQlX`
- Vercel Team slug：`zhangzhongliangzzl-9189s-projects`
- 生产网址：`https://file-viewer-teal.vercel.app`

## 每次改动的完成标准

1. 检查工作区和适用指令，保留用户已有改动；只提交本次任务范围内的文件。
2. 修改 `src/` 等源码；执行适用检查和 `npm run build`。构建会生成根目录独立版 `index.html` 和 `dist/index.html`，根目录生成文件如有变化也应提交；不提交 `node_modules/`、`dist/`、`.vercel/` 或凭据。
3. 将本次修改提交到 GitHub，并推送生产分支 `main`。不要强制推送或覆盖他人的提交；若远程已有新提交，先安全整合。
4. 优先使用已有 Git 集成触发 Vercel 部署，避免为同一次提交重复部署。若未触发，再使用已授权的 Vercel 工具为上述项目部署同一提交。
5. 确认对应提交的生产部署状态为 `READY`，并验证生产网址和与本次改动有关的行为。仅推送成功或旧部署为 `READY` 不算本次部署完成。
6. 最终回复简要说明改动、验证结果、GitHub 提交和生产网址。遇到权限、构建、网络或部署阻塞时如实说明，不宣称同步完成；继续完成不依赖该阻塞的工作。

## 本地使用

根目录 `index.html` 必须保持可直接用浏览器打开；不要手工修改生成的 HTML，应修改源码后重新构建。开发入口为 `src/index.html`，开发命令为 `npm run dev`。
