import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessions } from "@/hooks/useSessions";
import { useZones } from "@/hooks/useZones";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = {
  role: "user" | "ai";
  content: string;
};

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hi! I'm your Event Assistant. Ask me anything about the schedule, locations, or sessions!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sessions } = useSessions();
  const { zones } = useZones();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

      const contextPrompt = `
You are the official event assistant for "VenueApp - Global Summit 2026".
Be helpful, concise, and friendly.
Use the following data to answer the user's question, if relevant.

**Sessions Schedule:**
${sessions.map((s) => `- ${s.title} by ${s.speaker} at ${s.dome} on ${new Date(s.startsAt).toLocaleString()}`).join("\n")}

**Zones Setup:**
${zones.map((z) => `- ${z.name} (Type: ${z.type}, Capacity: ${z.capacity}, Current Crowd: ${z.crowdPct}% - ${z.isOpen ? "Open" : "Closed"})`).join("\n")}

User says: ${userMessage}
`;

      const result = await model.generateContent(contextPrompt);
      const responseText = result.response.text();

      setMessages((prev) => [...prev, { role: "ai", content: responseText }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "ai", content: `Error: ${error.message || "Failed to talk to AI."}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50 md:bottom-6 md:right-6"
        size="icon"
        onClick={() => setIsOpen(true)}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-50 flex h-[450px] w-[350px] flex-col shadow-2xl md:bottom-6 md:right-6">
          <div className="flex items-center justify-between border-b p-4 bg-primary text-primary-foreground rounded-t-xl">
            <div className="flex items-center font-semibold">
              <Bot className="mr-2 h-5 w-5" />
              Event AI Assistant
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${
                    msg.role === "ai"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground self-end"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="bg-muted text-foreground flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <form
              className="flex w-full items-center space-x-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Input
                type="text"
                placeholder="Ask about schedule..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
}
