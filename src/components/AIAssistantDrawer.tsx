import React, { useState, useEffect, useRef } from 'react';
import { AgriculturalProduct } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { X, Send, Bot, Settings, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, User, ExternalLink } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentProduct?: AgriculturalProduct | null;
  onSelectProduct?: (product: AgriculturalProduct) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
  model?: string;
  diagnosticNotice?: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  language,
  currentProduct,
  onSelectProduct,
}) => {
  const t = UI_STRINGS[language];

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [localAiUrl, setLocalAiUrl] = useState('http://127.0.0.1:11434');
  const [modelName, setModelName] = useState('qwen3.5:4b');
  const [format, setFormat] = useState<'ollama' | 'openai'>('ollama');
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message?: string;
    secureTunnelAdvice?: string;
    loading: boolean;
  }>({ tested: false, connected: false, loading: false });

  // Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text:
        language === 'hi'
          ? 'राम राम किसान भाई! मैं किसानसेतु का एआई कृषि सहायक हूँ। आप मुझसे ट्रैक्टरों की तुलना, खाद की सही मात्रा, सोलर पंप के लाभ या किसी भी कृषि उपकरण के बारे में पूछ सकते हैं।'
          : 'Namaste! I am your KisanSetu Agricultural AI Assistant powered by Qwen3.5-4B. How can I help you evaluate farm machinery, calculate fertilizer applications, or compare vendor prices today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'local_qwen',
      model: 'Qwen3.5-4B Agronomy Engine',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // If a product was passed for context, add a prompt
  useEffect(() => {
    if (currentProduct) {
      const promptText =
        language === 'hi'
          ? `मुझे ${currentProduct.brand} ${currentProduct.name} के फायदे, तकनीकी विशेषताएं और अन्य विकल्पों के बारे में बताएं।`
          : `Explain the technical specifications, verified pros/cons, and alternative options for ${currentProduct.name}.`;
      setInputValue(promptText);
    }
  }, [currentProduct, language]);

  // Test local connection
  const handleTestConnection = async () => {
    setConnectionStatus({ tested: false, connected: false, loading: true });
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: localAiUrl, model: modelName, format }),
      });
      const data = await res.json();
      setConnectionStatus({
        tested: true,
        connected: data.connected,
        message: data.message || (data.connected ? 'Connected successfully!' : 'Could not reach server.'),
        secureTunnelAdvice: data.secureTunnelAdvice,
        loading: false,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network test error';
      setConnectionStatus({
        tested: true,
        connected: false,
        message: `Network error: ${errorMsg}`,
        loading: false,
      });
    }
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4).map((m) => ({ role: m.sender, content: m.text })),
          localAiUrl,
          modelName,
          currentProductId: currentProduct?.id,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_reply`,
        sender: 'assistant',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        model: data.modelUsed || data.model || modelName,
        diagnosticNotice: data.diagnosticNotice,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error reaching backend';
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: `Service communication error: ${errorMsg}. Product search and comparison tools remain functional.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">Qwen3.5-4B AI Farming Assistant</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                  Local Adapter
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Retrieval-Augmented Agronomy & Machinery Advisor</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showSettings ? 'bg-stone-200 text-stone-900' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
              title="Configure Local AI Connection"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Local AI Settings Collapsible Panel */}
        {showSettings && (
          <div className="p-4 bg-stone-100 border-b border-stone-200 space-y-3 text-xs shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800">Local Inference Runtime Settings</span>
              <span className="text-[11px] text-stone-500">Configure your local Ollama / vLLM runtime</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-600 block mb-1">Local Host Endpoint</label>
                <input
                  type="text"
                  value={localAiUrl}
                  onChange={(e) => setLocalAiUrl(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  className="w-full p-1.5 border border-stone-300 rounded bg-white text-xs"
                />
              </div>

              <div>
                <label className="text-stone-600 block mb-1">Model Identifier</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="qwen3.5:4b"
                  className="w-full p-1.5 border border-stone-300 rounded bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={format === 'ollama'}
                    onChange={() => setFormat('ollama')}
                  />
                  <span>Ollama API</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={format === 'openai'}
                    onChange={() => setFormat('openai')}
                  />
                  <span>OpenAI / vLLM</span>
                </label>
              </div>

              <button
                onClick={handleTestConnection}
                disabled={connectionStatus.loading}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {connectionStatus.loading && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Test Connection</span>
              </button>
            </div>

            {connectionStatus.tested && (
              <div
                className={`p-2 rounded text-[11px] ${
                  connectionStatus.connected
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {connectionStatus.connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{connectionStatus.message}</span>
                </div>
                {connectionStatus.secureTunnelAdvice && (
                  <p className="mt-1.5 text-stone-700 bg-white/80 p-2 rounded border border-amber-200 leading-relaxed font-mono text-[10px]">
                    {connectionStatus.secureTunnelAdvice}
                  </p>
                )}
                {!connectionStatus.connected && !connectionStatus.secureTunnelAdvice && (
                  <p className="mt-1 text-stone-600">
                    KisanSetu automatically falls back to our ICAR-grounded agricultural knowledge engine so you still receive accurate guidance!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-xs'
                    : 'bg-stone-100 text-stone-800 rounded-bl-xs border border-stone-200'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {msg.diagnosticNotice && (
                  <div className="mt-2 pt-2 border-t border-stone-200 text-[10px] text-stone-500 italic">
                    {msg.diagnosticNotice}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400 px-1">
                <span>{msg.timestamp}</span>
                {msg.model && <span>· {msg.model}</span>}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 p-3 bg-stone-100 rounded-xl text-xs text-stone-600 border border-stone-200 max-w-[70%]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              <span>Consulting Qwen3.5 & Agronomy Database...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Agricultural Queries */}
        <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/60 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
          <span className="text-stone-400 font-medium shrink-0">Sample Questions:</span>
          {[
            'महिंद्रा 575 बनाम स्वराज 744 तुलना',
            'Nano Urea vs 45kg bag cost',
            'Best fertilizer for wheat basal',
            'Is 3HP Solar pump cheaper than diesel?',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 bg-white hover:bg-stone-200 border border-stone-200 rounded-full text-stone-700 transition-colors shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-4 border-t border-stone-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'खेती या उपकरण के बारे में प्रश्न पूछें...'
                  : 'Ask about equipment specs, fertilizer dosages, or prices...'
              }
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
