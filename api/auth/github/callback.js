// /api/callback.js
export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing OAuth code" });
  }

  // --- 1. GitHubにアクセストークンをリクエスト ---
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return res.status(400).json(tokenData);
  }

  const accessToken = tokenData.access_token;

  // --- 2. トークンでGitHubユーザー情報を取得 ---
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });
  const userData = await userRes.json();

  // --- 3. フロントに返す ---
  res.status(200).json({
    access_token: accessToken,
    login: userData.login, // ← GitHubユーザー名
    avatar_url: userData.avatar_url,
  });
}
