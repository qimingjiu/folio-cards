# 接入真实赞助页

当前没有配置收款地址；不应仅凭 GitHub 用户名猜测可用的赞助页。

开通赞助页并确认实际可用后：

1. 将完整 HTTPS 地址填入 `src/config.ts` 的 `SPONSOR_URL`。界面会显示“支持作者”。
2. 在 README 的“赞助”段落添加相同真实链接。
3. 创建 `.github/FUNDING.yml`，例如 `custom: ["你的真实 HTTPS 赞助链接"]`。如果实际使用并已开通 GitHub Sponsors，可以改用 `github: qimingjiu`。
4. `npm test && npm run build`，提交并重新部署。

参考：[GitHub 官方赞助按钮说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository)。账户注册、身份验证和收款信息由作者本人完成。
