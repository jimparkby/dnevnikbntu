"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Boots the Telegram Mini App shell: expands to full screen, then exchanges
// initData for a session cookie so subsequent server components see the user.
export default function TelegramInit() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setAuthError("Открой это приложение из Telegram — вне Telegram оно не работает.");
      return;
    }

    tg.ready();
    tg.expand();
    tg.requestFullscreen?.();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.("#F5F6F8");
    tg.setBackgroundColor?.("#F5F6F8");

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("auth_failed");
        return res.json();
      })
      .then(() => router.refresh())
      .catch(() => setAuthError("Не удалось войти. Попробуй перезапустить приложение."));
  }, [router]);

  if (authError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg p-6 text-center">
        <p className="text-sm text-text-secondary">{authError}</p>
      </div>
    );
  }

  return null;
}
