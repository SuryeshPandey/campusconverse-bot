
import { useState } from "react";
import { Message } from "@/components/Message";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { HfInference } from "@huggingface/inference";

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
  const { toast } = useToast();

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
      // Get the secrets from Supabase
      const { data: secrets, error: secretsError } = await supabase
        .from('secrets')
        .select('value')
        .eq('name', 'HUGGING_FACE_API_KEY')
        .single();

      if (secretsError) {
        throw new Error('Could not retrieve API key: ' + secretsError.message);
      }

      if (!secrets?.value) {
        throw new Error('API key not found in Supabase secrets');
      }

      const hf = new HfInference(secrets.value);

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        inputs: `<s>[INST] ${content} [/INST]`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_k: 50,
          top_p: 0.95,
          repetition_penalty: 1.2,
        },
      });

      if (!response || !response.generated_text) {
        throw new Error('Invalid response from API');
      }

      // Extract the response text after [/INST]
      const responseText = response.generated_text.split('[/INST]').pop()?.trim() || '';

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error:', error);
      
      // More specific error handling
      let errorMessage = "An error occurred while processing your request.";
      if (error.message.includes("API key not found")) {
        errorMessage = "Hugging Face API key not found. Please make sure it's properly set up in Supabase.";
      } else if (error.message.includes("Could not retrieve API key")) {
        errorMessage = "Could not access the API key. Please check your Supabase connection.";
      } else if (error.message.includes("Invalid token")) {
        errorMessage = "Invalid Hugging Face API key. Please check if it's correct.";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: errorMessage,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
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
