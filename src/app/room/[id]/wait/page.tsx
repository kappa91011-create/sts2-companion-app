"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRoomSync } from "@/hooks/useRoomSync";
import { Play } from "lucide-react";

export default function WaitPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;
    const { roomState, createRoomInitial } = useRoomSync(roomId, "temp");
    const [userName, setUserName] = useState<string | null>(null);

    // Audio unlock state
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        // Read from session storage
        const storedName = sessionStorage.getItem("sts2_username");
        setUserName(storedName);

        // If an initial creator arrives, bootstrap the room
        if (storedName && !roomState?.roomInfo?.name) {
            const asc = sessionStorage.getItem("sts2_room_asc") || "A1";
            const style = sessionStorage.getItem("sts2_room_style") || "初心者卓";
            createRoomInitial({ name: storedName, ascension: asc, playstyle: style });
        }
    }, [roomState, createRoomInitial]);

    const handleJoin = async () => {
        // Unblock audio
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        await ctx.resume();

        let finalName = userName;
        if (!finalName) {
            const inputEl = document.getElementById('guestNameInput') as HTMLInputElement;
            if (inputEl && inputEl.value.trim()) {
                finalName = inputEl.value.trim();
                sessionStorage.setItem("sts2_username", finalName);
                setUserName(finalName);
            } else {
                return; // require name
            }
        }

        setHasInteracted(true);
        router.push(`/room/${roomId}`);
    };

    const playerCount = roomState?.users ? Object.keys(roomState.users).length : 0;
    const isFull = playerCount >= 4;

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-neutral-800 rounded-2xl shadow-xl overflow-hidden border border-neutral-700 p-8 text-center space-y-6">

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">入室待機</h2>
                    {roomState?.roomInfo ? (
                        <div className="bg-neutral-900 p-4 rounded-lg text-sm text-neutral-400 space-y-1">
                            <p>作成者: <span className="text-white font-medium">{roomState.roomInfo.name}</span></p>
                            <p>ルール: <span className="text-white font-medium">{roomState.roomInfo.ascension} / {roomState.roomInfo.playstyle}</span></p>
                        </div>
                    ) : (
                        <p className="text-neutral-500 animate-pulse text-sm">ルーム情報を取得中...</p>
                    )}
                </div>

                {!userName ? (
                    <div className="py-4 border-y border-neutral-700 text-left space-y-3">
                        <label className="block text-sm font-bold text-neutral-400">
                            参加する名前を入力してください
                        </label>
                        <input
                            type="text"
                            maxLength={16}
                            placeholder="あなたの名前"
                            id="guestNameInput"
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg text-white font-medium"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleJoin();
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div className="py-4 border-y border-neutral-700">
                        <p className="text-lg font-medium">現在の参加人数</p>
                        <div className="flex items-end justify-center gap-1 mt-2">
                            <span className={`text-4xl font-black ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                                {playerCount}
                            </span>
                            <span className="text-xl text-neutral-500 mb-1">/ 4 人</span>
                        </div>
                        {isFull && <p className="text-red-500 text-xs mt-2 font-bold">満員のため入室できません</p>}
                    </div>
                )}

                <div>
                    <button
                        onClick={handleJoin}
                        disabled={isFull || hasInteracted}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        {isFull ? "満員" : "入室する (音声ON)"}
                    </button>
                    <p className="text-xs text-neutral-500 mt-4">
                        ※通知音を再生するため、ブラウザの音声制限を解除します。
                    </p>
                </div>
            </div>
        </div>
    );
}
