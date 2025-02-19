
import { cn } from "@/lib/utils";

interface MessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp?: string;
}

export function Message({ content, role, timestamp }: MessageProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg max-w-[85%] animate-fade-up",
        role === "user"
          ? "ml-auto bg-chat-user shadow-sm border"
          : "mr-auto bg-chat-assistant"
      )}
    >
      <p className="text-sm leading-relaxed">{content}</p>
      {timestamp && (
        <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
      )}
    </div>
  );
}
