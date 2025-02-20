
import { useState } from "react";
import { Message } from "@/components/Message";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const HfInference = await import('@huggingface/inference').then(m => m.default);
      const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);
      
      // Using Mistral-7B model
      const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${content} [/INST]`,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
          }
        }),
      });

      if (!response.ok) {
        console.error('API Error:', await response.text());
        throw new Error('API request failed');
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (!result || !result[0] || !result[0].generated_text) {
        throw new Error('Invalid response format from API');
      }

      const generatedText = result[0].generated_text.trim();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: generatedText,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4">
      <header className="py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CampusCompass</h1>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
        </Button>
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
