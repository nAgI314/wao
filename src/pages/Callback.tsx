import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      fetch(`/api/git-auth=${code}`)
        .then((res) => 
          res.json()
      )
        .then((data) => {
          console.log("GitHub token:", data.access_token);
          // ローカルストレージに保存（例）
          localStorage.setItem("github_token", data.access_token);
          // ホーム画面に戻る
          navigate("/");
        })
        .catch((err) => {
          console.error("GitHub Auth Error:", err);
          navigate("/");
        });
    } else {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">GitHub ログイン中...</h1>
      <p>しばらくお待ちください。</p>
    </div>
  );
}
