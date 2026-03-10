"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, Users, Swords, Shield } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ascension, setAscension] = useState("A1");
  const [playstyle, setPlaystyle] = useState("初心者卓");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    // Generate a simple 6-character room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store user's intended display name in session storage
    // so the wait page can pick it up when joining
    sessionStorage.setItem("sts2_username", name.trim());
    sessionStorage.setItem("sts2_room_asc", ascension);
    sessionStorage.setItem("sts2_room_style", playstyle);

    router.push(`/room/${roomId}/wait`);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden border border-neutral-700">
        <div className="bg-gradient-to-r from-red-600 to-red-900 p-6 text-center">
          <h1 className="text-3xl font-black text-white tracking-widest drop-shadow-md">
            STS2 <span className="text-red-300">COMPANION</span>
          </h1>
          <p className="text-red-200 text-sm mt-2 font-medium">マルチプレイ連携ツール</p>
        </div>

        <form onSubmit={handleCreateRoom} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-400 mb-1">
                プレイヤー名
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="あなたの名前"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-neutral-600 text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1">
                  アセンション
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                  <select
                    value={ascension}
                    onChange={(e) => setAscension(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none font-medium text-white"
                  >
                    {[...Array(21)].map((_, i) => (
                      <option key={`A${i}`} value={`A${i}`}>A{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-400 mb-1">
                  プレイスタイル
                </label>
                <div className="relative">
                  <Swords className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                  <select
                    value={playstyle}
                    onChange={(e) => setPlaystyle(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none font-medium text-white"
                  >
                    <option value="初心者卓">初心者卓</option>
                    <option value="中級者卓">中級者卓</option>
                    <option value="上級者卓">上級者卓</option>
                    <option value="エンジョイ">エンジョイ</option>
                    <option value="ガチ">ガチ</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <span className="animate-pulse">作成中...</span>
            ) : (
              <>
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                ルームを作成すると参加
              </>
            )}
          </button>
        </form>
      </div>
      <p className="mt-8 text-neutral-600 text-sm">
        Slay the Spire 2 Unofficial Companion App
      </p>
    </div>
  );
}
