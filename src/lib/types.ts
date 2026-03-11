export type UserState = {
    id: string; // socket/tab id
    name: string;
    avatar: string;
    deckStatus: string;
};

export type ChatMessage = {
    id: string;
    senderId: string;
    senderName: string;
    avatar: string;
    text: string;
    timestamp: number;
};

export type RoomState = {
    roomInfo: {
        name: string;
        ascension: string;
        playstyle: string;
    };
    hostId?: string; // ID of the user who created the room
    users: Record<string, UserState>;
    messages: Record<string, ChatMessage>;
};
