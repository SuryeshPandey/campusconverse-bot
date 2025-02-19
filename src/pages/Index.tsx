
import { useState } from "react";
import { Message } from "@/components/Message";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! How can I assist you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const newMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    // Simulate AI response (we'll implement real AI integration later)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "I'm a placeholder response. The real AI integration will be implemented soon!",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4">
      <header className="py-6">
        <h1 className="text-2xl font-semibold text-center">CampusCompass</h1>
      </header>

      <main className="flex-1 chat-container flex flex-col">
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <Message
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="p-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
