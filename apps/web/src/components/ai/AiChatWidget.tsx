'use client';

import { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

const QUICK_SUGGESTIONS = [
  '¿Cuánto vendí hoy?',
  '¿Qué productos tienen stock bajo?',
  '¿Cuánto me deben los clientes?',
  'Resumen de la semana',
] as const;

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: '¡Hola! 👋 Soy el CFO virtual de tu negocio. Puedo ayudarte con ventas, inventario y clientes.',
};

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await aiApi.chat(trimmed);
      const assistantMsg: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        role: 'assistant',
        content: 'No pude conectarme. Intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function handleSuggestion(suggestion: string) {
    void sendMessage(suggestion);
  }

  const allMessages: Message[] = messages.length === 0 ? [INITIAL_MESSAGE] : messages;
  const showSuggestions = messages.length === 0;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Cerrar asistente CFO' : 'Abrir asistente CFO'}
        style={{ backgroundColor: '#C9A84C' }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 4L16 16M16 4L4 16" stroke="#1A1400" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <path d="M11 2L13.5 8.5H20L14.5 12.5L16.5 19L11 15L5.5 19L7.5 12.5L2 8.5H8.5L11 2Z" fill="#1A1400" />
          </svg>
        )}
      </button>

      {/* Chat drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Asistente CFO Nexus"
          aria-modal="true"
          style={{
            backgroundColor: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          }}
          className="fixed bottom-24 right-6 z-50 flex h-96 w-80 flex-col shadow-2xl"
        >
          {/* Header */}
          <div
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            className="flex items-center justify-between rounded-t-[16px] px-4 py-3"
          >
            <div>
              <p style={{ color: '#C9A84C' }} className="text-sm font-semibold leading-tight">
                Nexus CFO
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tu asistente financiero
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {allMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'rgba(201,168,76,0.10)',
                          border: '1px solid rgba(201,168,76,0.20)',
                          color: 'rgba(255,255,255,0.9)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: 'rgba(255,255,255,0.85)',
                        }
                  }
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Quick suggestions */}
            {showSuggestions && (
              <div className="space-y-1.5 pt-1">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    style={{
                      border: '1px solid rgba(201,168,76,0.20)',
                      color: 'rgba(201,168,76,0.85)',
                      background: 'rgba(201,168,76,0.06)',
                    }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-[rgba(201,168,76,0.12)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                  className="flex items-center gap-1 rounded-2xl px-3 py-2"
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: 'rgba(201,168,76,0.6)',
                        animationDelay: `${i * 0.15}s`,
                      }}
                      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            className="flex items-center gap-2 rounded-b-[16px] px-3 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame algo..."
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.85)',
              }}
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none placeholder:text-white/30 focus:border-[rgba(201,168,76,0.4)] disabled:opacity-50"
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              style={{ backgroundColor: '#C9A84C' }}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="#1A1400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
