import { ChatRoom } from "@/components/chat/chat-room";

export default function ClientCommunautePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-syne text-3xl font-bold text-white">
        Communauté
      </h1>
      <ChatRoom />
    </div>
  );
}
