import { useEffect } from "react";

export default function Callback() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      fetch(`/api/callback?code=${code}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem("github_token", data.access_token);
            localStorage.setItem("github_user", data.login); // ← ユーザー名も保存
            localStorage.setItem("github_avatar", data.avatar_url);
            window.location.href = "/";
          } else {
            alert("GitHub認証に失敗しました");
          }
        });
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center text-lg text-gray-200">
      GitHub認証中です…
    </div>
  );
}
