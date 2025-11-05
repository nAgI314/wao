import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      console.error("GitHub Auth Error:", error);
      navigate("/");
      return;
    }

    if (code) {
      // APIを呼び出す
      fetch(`/api/git-auth?code=${encodeURIComponent(code)}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.access_token) {
            console.log("✅ GitHub token取得成功");
            // トークンを保存
            localStorage.setItem("github_token", data.access_token);
            localStorage.setItem("github_user", JSON.stringify({
              token: data.access_token,
              login: "user" // 後でユーザー情報を取得して更新
            }));
            // ホーム画面に戻る
            window.location.href = "/";
          } else {
            throw new Error("tokenが返されていません");
          }
        })
        .catch((err) => {
          console.error("❌ GitHub Auth Error:", err);
          alert("認証に失敗しました: " + err.message);
          navigate("/");
        });
    } else {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-gradient-to-b from-blue-400 to-blue-600">
      <h1 className="text-3xl font-bold mb-4">GitHub ログイン中...</h1>
      <p>しばらくお待ちください。</p>
    </div>
  );
}