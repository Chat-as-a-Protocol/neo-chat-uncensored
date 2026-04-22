import { AnimatePresence, motion } from "framer-motion";
import "highlight.js/styles/github-dark.css";
import { Bot, Crown, Send, Sparkles, User, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useStore } from "../store/chat";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const { messages, addMessage, updateLastMessage, usage, user } = useStore();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [input]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    addMessage({ role: "user", content: userMessage });
    setIsStreaming(true);

    // Adicionar mensagem vazia do assistant
    addMessage({
      role: "assistant",
      content: "",
      model: "venice-uncensored-1-2",
    });

    try {
      const apiUrl = import.meta.env.PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
            model: "llama-3.3-70b",
            stream: true,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                updateLastMessage(data.choices[0].delta.content);
              }
              if (data.choices?.[0]?.finish_reason === "stop") {
                setIsStreaming(false);
              }
            } catch (e) {
              // Ignorar linhas malformadas
            }
          }
        }
      }

      // Ao encerrar a leitura limpa do stream, finaliza a bolinha
      setIsStreaming(false);
    } catch (error) {
      updateLastMessage(`⚠️ ${error.message}`);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950/50 backdrop-blur-xl">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-white">Sua Marca IA</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Powered by Venice Uncensored
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {usage && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-sm">
              <span className="text-slate-400">Usado hoje:</span>
              <span
                className={`font-mono ${usage.remaining < 100 ? "text-red-400" : "text-emerald-400"}`}
              >
                {usage.today} / {usage.limit}
              </span>
              {usage.remaining < 100 && (
                <button className="ml-2 text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Upgrade
                </button>
              )}
            </div>
          )}
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/10">
                <Bot className="w-12 h-12 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Como posso ajudar?
                </h2>
                <p className="text-slate-400 max-w-md">
                  Pergunte qualquer coisa. Sem censura, sem filtros. Sua
                  privacidade é absoluta.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {[
                  "Explique quantum computing",
                  "Escreva um poema",
                  "Debug meu código",
                  "Crie um personagem",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                    : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              <div
                className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-600/90 text-white"
                      : "bg-slate-800/90 border border-white/10 text-slate-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      className="prose prose-invert prose-sm max-w-none"
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div className="relative">
                              <div className="absolute right-2 top-2 text-xs text-slate-400">
                                {match[1]}
                              </div>
                              <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code
                              className="bg-slate-700 rounded px-1"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content ||
                        (index === messages.length - 1 && isStreaming
                          ? "●"
                          : "")}
                    </ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500 mt-1 px-1">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-t border-white/10 p-4 bg-slate-950/80 backdrop-blur"
      >
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-4 pr-14 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none max-h-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-2 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 disabled:hover:bg-violet-500 transition"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-2">
          AI pode gerar informações imprecisas. Verifique fatos importantes.
        </p>
      </motion.div>
    </div>
  );
}
