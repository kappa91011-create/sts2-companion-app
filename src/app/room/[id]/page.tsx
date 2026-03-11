"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomSync } from "@/hooks/useRoomSync";
import { VolumeX, Volume2, Copy, Send, MessageSquare, Plus, Check, LogOut, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";

const AVATARS = ["ironclad", "silent", "defect", "watcher", "necrobinder"];

const ALWAYS_VISIBLE_ACTIONS = [
    { label: "OK", text: "了解！（OK）" },
    { label: "待って", text: "ちょっと待って" },
    { label: "長考", text: "長考します" },
    { label: "準備完了", text: "準備完了（Ready）" },
    { label: "ごめん", text: "ごめん！" },
    { label: "ありがとう", text: "ありがとう！" },
    { label: "ナイス", text: "ナイス！" },
    { label: "発言取消", text: "発言を取り消します" },
];

const MAP_ACTIONS = [
    { label: "雑魚戦へ", text: "雑魚戦でカードを集めたい" },
    { label: "安全ルート", text: "安全なルートで行きたい" },
    { label: "？マスへ", text: "？マスを多めに踏みたい" },
    { label: "エリート戦へ", text: "エリートと戦いたい" },
    { label: "ショップへ", text: "ショップに行きたい" },
    { label: "焚き火へ", text: "焚き火で回復したい" },
    { label: "鍛冶へ", text: "カードを強化（鍛冶）したい" },
    { label: "ボス準備OK?", text: "ボス前の準備はOK？" },
];

const COMBAT_TARGETS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const COMBAT_ACTIONS = [
    { label: "弱体", text: "弱体（被ダメUP）を入れるよ" },
    { label: "脱力", text: "脱力（与ダメDOWN）を入れるよ" },
    { label: "筋力低下", text: "筋力を下げるよ" },
    { label: "脆弱", text: "脆弱（ブロック低下）を入れるよ" },
    { label: "マルチ札", text: "全体効果（マルチ専用）のカードを使うよ" },
    { label: "手札事故", text: "手札事故…（動けない）" },
    { label: "ピンチ", text: "HPがピンチ（助けて！）" },
    { label: "耐えられない", text: "このターン耐えきれないかも" },
    { label: "危険注意", text: "厄介な攻撃が来るから気をつけて！" },
    { label: "トドメ刺す", text: "この敵は削り切るよ！（トドメ刺す）" },
];

export default function RoomPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;

    // A unique user ID for this session (persisted for the room to avoid ghost duplicates on refresh/rejoin)
    const [userId] = useState(() => {
        if (typeof sessionStorage !== "undefined") {
            const stored = sessionStorage.getItem(`sts2_user_id_${roomId}`);
            if (stored) return stored;
            const newId = Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem(`sts2_user_id_${roomId}`, newId);
            return newId;
        }
        return Math.random().toString(36).substr(2, 9);
    });
    const { roomState, joinRoom, updateDeckStatus, sendMessage, isMuted, setIsMuted, leaveRoom, kickUser, isKicked } = useRoomSync(roomId, userId);

    useEffect(() => {
        if (isKicked) {
            alert("ホストによってルームから退出させられました。");
            router.replace("/");
        }
    }, [isKicked, router]);

    const [copied, setCopied] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatBoxText, setChatBoxText] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [myAvatar, setMyAvatar] = useState("ironclad");
    const [myDeckStatus, setMyDeckStatus] = useState("");
    const [myName, setMyName] = useState("");

    const [isPlayerAreaOpen, setIsPlayerAreaOpen] = useState(true);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<"map" | "combat" | "custom">("map");
    const [customActions, setCustomActions] = useState<{ label: string, text: string }[]>([]);
    const [newCustomLabel, setNewCustomLabel] = useState("");
    const [newCustomText, setNewCustomText] = useState("");

    // Initialize
    useEffect(() => {
        const storedName = sessionStorage.getItem("sts2_username");
        if (!storedName) {
            router.replace(`/room/${roomId}/wait`);
            return;
        }
        setMyName(storedName);

        // Load custom actions from local storage
        const storedCustom = localStorage.getItem("sts2_custom_actions");
        if (storedCustom) {
            try {
                setCustomActions(JSON.parse(storedCustom));
            } catch (e) { }
        }

        const storedAvatar = localStorage.getItem("sts2_custom_avatar");
        if (storedAvatar) {
            setMyAvatar(storedAvatar);
        }

        joinRoom({
            id: userId,
            name: storedName,
            avatar: storedAvatar || myAvatar,
            deckStatus: myDeckStatus
        });
    }, []); // Run once on mount

    // Update avatar locally & remotely when changed
    const handleAvatarSelect = (avatar: string) => {
        setMyAvatar(avatar);
        localStorage.setItem("sts2_custom_avatar", avatar);
        joinRoom({ id: userId, name: myName, avatar, deckStatus: myDeckStatus });
    };

    const handleDeckStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMyDeckStatus(val);
    };

    const handleDeckStatusBlur = () => {
        updateDeckStatus(myDeckStatus);
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendAction = (text: string) => {
        sendMessage(text, myName, myAvatar);
    };

    const handleSendCustomText = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatBoxText.trim()) return;
        sendMessage(chatBoxText.trim(), myName, myAvatar);
        setChatBoxText("");
    };

    const leaveRoomAndRedirect = async () => {
        await leaveRoom();
        router.push('/');
    };

    const addCustomAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomLabel.trim() || !newCustomText.trim()) return;
        const newList = [...customActions, { label: newCustomLabel, text: newCustomText }];
        setCustomActions(newList);
        localStorage.setItem("sts2_custom_actions", JSON.stringify(newList));
        setNewCustomLabel("");
        setNewCustomText("");
    };

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [roomState?.messages]);

    if (!roomState) {
        return (
            <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-red-600/50 rounded-full mb-4"></div>
                    <p className="text-neutral-400">Loading Room...</p>
                </div>
            </div>
        );
    }

    const users = Object.values(roomState.users || {});
    const messages = Object.values(roomState.messages || {}).sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col max-w-2xl mx-auto shadow-2xl relative pb-40 lg:pb-0">

            {/* HEADER */}
            <header className="bg-neutral-900 border-b border-neutral-800 p-4 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="font-black text-white leading-tight">ROOM: {roomId}</h1>
                        <p className="text-xs text-red-400 font-bold">{roomState.roomInfo?.ascension} / {roomState.roomInfo?.playstyle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={leaveRoomAndRedirect}
                        className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-lg transition text-sm font-medium"
                        title="Leave Room"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">退出</span>
                    </button>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition"
                        title={isMuted ? "ミュート解除" : "ミュート"}
                    >
                        {isMuted ? <VolumeX className="w-5 h-5 text-neutral-500" /> : <Volume2 className="w-5 h-5 text-red-500" />}
                    </button>
                    <button
                        onClick={handleCopyUrl}
                        className="flex items-center gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-2 rounded-lg transition font-medium text-sm"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="hidden sm:inline">{copied ? "Copied" : "Copy URL"}</span>
                    </button>
                </div>
            </header>

            {/* TOGGLE BUTTON */}
            <div className="flex justify-center -mt-4 relative z-10 font-medium">
                <button
                    onClick={() => setIsPlayerAreaOpen(!isPlayerAreaOpen)}
                    className="bg-neutral-800 border border-neutral-700 rounded-b-xl px-4 py-1.5 text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition shadow-lg"
                >
                    {isPlayerAreaOpen ? (
                        <><ChevronUp className="w-3 h-3" /> プレイヤーを隠す</>
                    ) : (
                        <><ChevronDown className="w-3 h-3" /> プレイヤーを表示</>
                    )}
                </button>
            </div>

            {/* USER LIST & AVATAR PICKER */}
            {isPlayerAreaOpen && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-900/50">
                    {users.map(u => (
                        <div key={u.id} className="bg-neutral-800 rounded-xl p-3 flex flex-col items-center border border-neutral-700 relative overflow-hidden group">
                            {roomState?.hostId === userId && u.id !== userId && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`${u.name} さんをキックしますか？`)) {
                                            kickUser(u.id);
                                        }
                                    }}
                                    className="absolute top-1 left-1 bg-red-600 hover:bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition z-20"
                                    title="キックする"
                                >
                                    ×
                                </button>
                            )}
                            {u.id === userId && (
                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] z-10"></div>
                            )}

                            {u.id === userId ? (
                                <div
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="relative cursor-pointer mb-2 group flex flex-col items-center"
                                >
                                    <img
                                        src={u.avatar.startsWith('data:image') ? u.avatar : `/${u.avatar}.png`}
                                        alt={u.name}
                                        className="w-14 h-14 rounded-full border-2 border-red-500/50 bg-neutral-900 object-cover group-hover:brightness-50 transition"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="absolute -bottom-2 bg-red-600 border border-red-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md z-20 pointer-events-none group-hover:scale-105 transition-transform">
                                        変更
                                    </span>
                                </div>
                            ) : (
                                <img
                                    src={u.avatar.startsWith('data:image') ? u.avatar : `/${u.avatar}.png`}
                                    alt={u.name}
                                    className="w-14 h-14 rounded-full border border-neutral-600 bg-neutral-900 mb-2 object-cover"
                                />
                            )}

                            <span className="text-xs font-bold truncate w-full text-center text-neutral-300">
                                {u.id === roomState?.hostId && <span className="text-yellow-400 mr-0.5" title="Host">👑</span>}
                                {u.name}
                            </span>

                            {u.id === userId ? (
                                <input
                                    type="text"
                                    maxLength={12}
                                    value={myDeckStatus}
                                    onChange={handleDeckStatusChange}
                                    onBlur={handleDeckStatusBlur}
                                    placeholder="デッキ状態..."
                                    className="mt-1 w-full bg-neutral-950 text-red-200 text-xs text-center rounded border border-neutral-700 py-1 px-1 focus:outline-none focus:border-red-500 placeholder-neutral-600"
                                />
                            ) : (
                                <div className="mt-1 w-full bg-neutral-950 text-neutral-400 text-xs text-center rounded border border-neutral-800 py-1 px-1 min-h-[26px]">
                                    {u.deckStatus || <span className="text-neutral-600 italic">状態なし</span>}
                                </div>
                            )}
                        </div>
                    ))}
                    {Array(4 - users.length).fill(null).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-neutral-800/30 rounded-xl p-3 flex flex-col items-center border border-neutral-800/50 justify-center">
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-neutral-700 mb-2 flex items-center justify-center">
                                <span className="text-neutral-700 font-bold text-xs">空</span>
                            </div>
                            <span className="text-xs text-neutral-600">待機中</span>
                        </div>
                    ))}
                </div>
            )}

            {/* AVATAR SELECTION MODAL */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">キャラクターを選択</h3>

                        <div className="mb-4 flex flex-col items-center">
                            <label className="w-full relative flex items-center justify-center py-3 bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-lg hover:border-red-500 hover:bg-neutral-800/80 transition cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                const img = new Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement("canvas");
                                                    const MAX_SIZE = 120;
                                                    let width = img.width;
                                                    let height = img.height;
                                                    if (width > height) {
                                                        if (width > MAX_SIZE) {
                                                            height *= MAX_SIZE / width;
                                                            width = MAX_SIZE;
                                                        }
                                                    } else {
                                                        if (height > MAX_SIZE) {
                                                            width *= MAX_SIZE / height;
                                                            height = MAX_SIZE;
                                                        }
                                                    }
                                                    canvas.width = width;
                                                    canvas.height = height;
                                                    const ctx = canvas.getContext("2d");
                                                    ctx?.drawImage(img, 0, 0, width, height);
                                                    const base64String = canvas.toDataURL("image/webp", 0.8);
                                                    handleAvatarSelect(base64String);
                                                    setIsAvatarModalOpen(false);
                                                };
                                                img.src = e.target?.result as string;
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <span className="text-sm text-neutral-400 group-hover:text-red-400 font-bold">
                                    + カスタム画像をアップロード
                                </span>
                            </label>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {AVATARS.map(av => (
                                <button
                                    key={av}
                                    onClick={() => { handleAvatarSelect(av); setIsAvatarModalOpen(false); }}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-neutral-800 transition ${myAvatar === av ? 'ring-2 ring-red-500 bg-neutral-800' : ''}`}
                                >
                                    <img src={`/${av}.png`} alt={av} className="w-14 h-14 rounded-full object-cover" />
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsAvatarModalOpen(false)}
                            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold transition"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}

            {/* CHAT LOG */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[150px] flex flex-col gap-2">
                {messages.length === 0 ? (
                    <div className="text-center text-neutral-600 text-sm mt-10 italic">アクションを選択してメッセージを送信してください</div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.senderId === userId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                <img src={msg.avatar?.startsWith('data:image') ? msg.avatar : `/${msg.avatar || 'ironclad'}.png`} alt={msg.senderName} className="w-6 h-6 rounded-full object-cover border border-neutral-700 flex-shrink-0" />
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <span className="text-[10px] text-neutral-500 mb-0.5 px-0.5">{msg.senderName}</span>
                                    <div className={`px-3 py-2 text-sm ${isMe
                                        ? 'bg-red-600 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-2xl rounded-tl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* FIXED ACTION PANEL (Bottom) */}
            <div className="fixed lg:static bottom-0 left-0 right-0 max-w-2xl mx-auto bg-neutral-900 border-t border-neutral-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">

                {/* ALWAYS VISIBLE QUICK ACTIONS */}
                <div className="p-2 border-b border-neutral-800/50">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                        {ALWAYS_VISIBLE_ACTIONS.map(act => (
                            <button
                                key={act.label}
                                onClick={() => handleSendAction(act.text)}
                                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-[10px] sm:text-xs py-2 px-1 rounded-md font-bold transition active:bg-neutral-600 truncate"
                            >
                                {act.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TAB INDICATORS */}
                <div className="flex border-b border-neutral-800">
                    <button
                        onClick={() => setActiveTab("map")}
                        className={`flex-1 py-2 text-xs font-bold transition ${activeTab === "map" ? "bg-red-900/40 text-red-400 border-b-2 border-red-500" : "text-neutral-500 hover:bg-neutral-800"}`}
                    >
                        マップ
                    </button>
                    <button
                        onClick={() => setActiveTab("combat")}
                        className={`flex-1 py-2 text-xs font-bold transition ${activeTab === "combat" ? "bg-red-900/40 text-red-400 border-b-2 border-red-500" : "text-neutral-500 hover:bg-neutral-800"}`}
                    >
                        戦闘
                    </button>
                    <button
                        onClick={() => setActiveTab("custom")}
                        className={`flex-1 py-2 text-xs font-bold transition ${activeTab === "custom" ? "bg-red-900/40 text-red-400 border-b-2 border-red-500" : "text-neutral-500 hover:bg-neutral-800"}`}
                    >
                        カスタム
                    </button>
                </div>

                {/* TAB CONTENT */}
                <div className="p-3 bg-neutral-950 flex flex-col gap-2 min-h-[140px]">
                    {activeTab === "map" && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {MAP_ACTIONS.map(act => (
                                <button
                                    key={act.label}
                                    onClick={() => handleSendAction(act.text)}
                                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-teal-400/90 hover:text-teal-300 text-xs py-2 px-1 rounded-md font-bold transition shadow-sm"
                                >
                                    {act.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === "combat" && (
                        <div className="space-y-3">
                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                {COMBAT_TARGETS.map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleSendAction(`左から${num}番目の敵を狙いたい`)}
                                        className="min-w-[40px] h-[40px] flex-shrink-0 bg-red-950 border border-red-900 text-red-400 font-black text-lg rounded-md flex items-center justify-center hover:bg-red-900 transition shadow-inner"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <span className="text-xs text-neutral-600 flex items-center ml-2 mr-4 whitespace-nowrap">ターゲット</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {COMBAT_ACTIONS.map(act => (
                                    <button
                                        key={act.label}
                                        onClick={() => handleSendAction(act.text)}
                                        className={`text-xs py-2 px-1 rounded-md font-bold transition border ${['弱体', '脱力', '筋力低下', '脆弱', 'マルチ札'].includes(act.label)
                                            ? 'bg-neutral-900 border-indigo-900/50 text-indigo-300 hover:bg-neutral-800'
                                            : 'bg-neutral-900 border-orange-900/50 text-orange-400 hover:bg-neutral-800'
                                            }`}
                                    >
                                        {act.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "custom" && (
                        <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                            {customActions.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {customActions.map((act, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendAction(act.text)}
                                            className="bg-neutral-800 border border-purple-900/30 text-purple-300 text-xs py-2 rounded-md font-bold hover:bg-neutral-700 text-left px-3 truncate"
                                        >
                                            {act.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-500 italic mb-3">カスタム定型文はまだありません</p>
                            )}

                            <form onSubmit={addCustomAction} className="bg-neutral-900 p-2 rounded-lg border border-neutral-800 flex gap-2 w-full flex-col sm:flex-row">
                                <input
                                    type="text"
                                    placeholder="ボタン表示名 (短く)"
                                    maxLength={8}
                                    value={newCustomLabel}
                                    onChange={e => setNewCustomLabel(e.target.value)}
                                    className="bg-neutral-950 text-white text-xs px-2 py-1.5 rounded border border-neutral-700 flex-1 focus:border-purple-500 outline-none"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="送信メッセージ (長くてもOK)"
                                    value={newCustomText}
                                    onChange={e => setNewCustomText(e.target.value)}
                                    className="bg-neutral-950 text-white text-xs px-2 py-1.5 rounded border border-neutral-700 flex-[2] focus:border-purple-500 outline-none"
                                    required
                                />
                                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* TEXT CHAT EXPAND BUTTON/INPUT */}
                <div className="bg-neutral-900 p-2 flex items-center gap-2">
                    {!isChatOpen ? (
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 rounded-lg text-sm transition"
                        >
                            <MessageSquare className="w-4 h-4" />
                            チャットを開く
                        </button>
                    ) : (
                        <form onSubmit={handleSendCustomText} className="flex w-full gap-2">
                            <button
                                type="button"
                                onClick={() => setIsChatOpen(false)}
                                className="p-2 text-neutral-500 hover:bg-neutral-800 rounded-lg"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                placeholder="自由入力..."
                                value={chatBoxText}
                                onChange={e => setChatBoxText(e.target.value)}
                                className="flex-1 bg-neutral-800 text-sm text-white px-3 py-2 rounded-lg border border-neutral-700 focus:outline-none focus:border-red-500"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!chatBoxText.trim()}
                                className="bg-red-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-red-500 transition"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
