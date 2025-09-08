'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Lock,
  Phone,
  Video,
  Download,
  FileText,
  Image as ImageIcon,
  Mic,
  Trash2,
} from 'lucide-react';

const HARDCODED_PASSWORD = 'secret2024';
const POLL_INTERVAL = 1000;

const STICKERS = [
  '❤️','💕','💖','💘','💝','💗','💓','💞','💟','♥️',
  '😍','🥰','😘','💋','😊','😄','😆','🤗','😇','🥺','😭',
  '🔥','✨','🌟','💫','🦋','🌈','☀️','🌙','⭐',
  '🎉','🎊','🥳','🎈','👑','💎','💐','🍀','🦄',
];

const ALLOWED_USERNAMES = ['Sophie', 'Umer'];
const USER_STORAGE_KEY = 'exclusivechat.username';

export default function ExclusiveChatApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(ALLOWED_USERNAMES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null;
    if (saved && ALLOWED_USERNAMES.includes(saved)) setSelectedUsername(saved);
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        if (data.messages.length > 0) setLastMessageId(data.messages[data.messages.length - 1].id);
      }
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const pollForMessages = async () => {
    try {
      const url = lastMessageId
        ? `/api/messages/poll?lastMessageId=${encodeURIComponent(lastMessageId)}`
        : '/api/messages/poll';
      const response = await fetch(url);
      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => [...prev, ...data.messages]);
        setLastMessageId(data.messages[data.messages.length - 1].id);
      }
    } catch (e) {
      console.error('Failed to poll messages:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
      pollIntervalRef.current = setInterval(pollForMessages, POLL_INTERVAL);
      return () => pollIntervalRef.current && clearInterval(pollIntervalRef.current);
    }
  }, [isAuthenticated, lastMessageId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === HARDCODED_PASSWORD) {
      setUser(selectedUsername);
      setIsAuthenticated(true);
      try { localStorage.setItem(USER_STORAGE_KEY, selectedUsername); } catch {}
    } else {
      alert('Incorrect password!');
    }
  };

  const sendMessage = async (content, type = 'text', extra = {}) => {
    if ((type === 'text' && !content.trim()) || !user || isLoading) return;
    setIsLoading(true);
    try {
      const message = {
        user,
        content,
        type,
        ...extra,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setLastMessageId(data.message.id);
        if (type === 'text') setNewMessage('');
      }
    } catch (e) {
      console.error('Failed to send message:', e);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || isLoading) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const isImage = file.type.startsWith('image/');
        if (isImage) {
          await sendMessage(data.url, 'image');
        } else {
          await sendMessage(data.url, 'file', { fileName: file.name, fileSize: file.size });
        }
      } else {
        alert('Failed to upload');
      }
    } catch (e) {
      console.error('Failed to upload file:', e);
      alert('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllMessages = async () => {
    if (!confirm('Are you sure you want to clear all messages?')) return;
    try {
      const res = await fetch('/api/messages', { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        setLastMessageId(null);
      }
    } catch (e) {
      console.error('Failed to clear messages:', e);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6B4CF6] via-[#7A56FF] to-[#9A65FF] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative w-full max-w-md rounded-[28px] border border-white/15 bg-white/10 p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8 space-y-2">
            <div className="mx-auto h-20 w-20 rounded-full bg-white/20 grid place-items-center">
              <Lock className="text-white/90 h-8 w-8" />
            </div>
            <h1 className="text-white text-3xl font-semibold">Welcome.</h1>
            <p className="text-white/70 text-sm">Enter the secret password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-white/80 text-sm mb-2 block">Choose your fixed username</label>
              <select
                value={selectedUsername}
                onChange={(e) => setSelectedUsername(e.target.value)}
                style={{ height: '60px' }}
                className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {ALLOWED_USERNAMES.map((u) => (
                  <option key={u} value={u} className="bg-indigo-900">{u}</option>
                ))}
              </select>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="w-full rounded-2xl bg-white/10 px-5 py-4 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold py-3 border border-white/20 transition"
            >
              Unlock Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ddd9fc] flex items-center justify-center px-2 md:px-6 py-4">
      {/* Chat shell (rounded like the screenshot) */}
      <div className="relative w-full max-w-[420px] md:max-w-[720px] lg:max-w-[880px] bg-[#5B46F6] rounded-[36px] shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 bg-[#000] md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden">
              {selectedUsername === "Umer" ? (<img 
                src="https://avatar.iran.liara.run/public/boy"  // path to your local image in the public folder
                alt="User avatar"
                className="h-full w-full object-cover"
              />) : (<img 
                src="https://avatar.iran.liara.run/public"  // path to your local image in the public folder
                alt="User avatar"
                className="h-full w-full object-cover"
              />)}
              <img 
                src="https://avatar.iran.liara.run/public/boy"  // path to your local image in the public folder
                alt="User avatar"
                className="h-full w-full object-cover"
              />
              <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#5B46F6]" />
            </div>

            <div className="text-white">
              <p className="font-semibold leading-tight">{selectedUsername}</p>
              <p className="text-xs opacity-80">-</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            
            <button
              onClick={clearAllMessages}
              className="h-10 w-10 rounded-full border border-white/20 bg-red-500/20 grid place-items-center hover:bg-red-500/30 transition"
              title="Clear all"
            >
              <Trash2 className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="px-3 md:px-6 pb-28 pt-2 md:pt-4 space-y-3 md:space-y-4 h-[70vh] overflow-y-auto">
          {/* Example intro (optional) */}
          {messages.length === 0 && (
            <>
              
            </>
          )}

          {messages.map((m) => {
            const isMine = m.user === user;
            const timeText =
              m.timestamp ??
              (m.createdAtIso
                ? new Date(m.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '');

            if (m.type === 'image') {
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {isMine ? (
                    <BubbleOutgoing className="p-1">
                      <img src={m.content} alt="shared" className="rounded-2xl max-w-[240px] md:max-w-[360px] h-auto" />
                      <TimeTag>{timeText}</TimeTag>
                    </BubbleOutgoing>
                  ) : (
                    <BubbleIncoming className="p-1">
                      <img src={m.content} alt="shared" className="rounded-2xl max-w-[240px] md:max-w-[360px] h-auto" />
                      <TimeTag>{timeText}</TimeTag>
                    </BubbleIncoming>
                  )}
                </div>
              );
            }

            if (m.type === 'sticker') {
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {isMine ? (
                    <BubbleOutgoing><span className="text-4xl leading-none">{m.content}</span><TimeTag>{timeText}</TimeTag></BubbleOutgoing>
                  ) : (
                    <BubbleIncoming><span className="text-4xl leading-none">{m.content}</span><TimeTag>{timeText}</TimeTag></BubbleIncoming>
                  )}
                </div>
              );
            }

            if (m.type === 'file') {
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {isMine ? (
                    <FileBubbleOutgoing href={m.content} name={m.fileName || 'File'} size={formatSize(m.fileSize)} />
                  ) : (
                    <FileBubbleIncoming href={m.content} name={m.fileName || 'File'} size={formatSize(m.fileSize)} />
                  )}
                </div>
              );
            }

            // text
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                {isMine ? (
                  <BubbleOutgoing>
                    {m.content}
                    <TimeTag>{timeText}</TimeTag>
                  </BubbleOutgoing>
                ) : (
                  <BubbleIncoming>
                    {m.content}
                    <TimeTag>{timeText}</TimeTag>
                  </BubbleIncoming>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Sticker Picker */}
        {showStickers && (
          <div className="absolute left-0 right-0 bottom-24 md:bottom-28 px-4">
            <div className="mx-auto max-w-[640px] rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-3">
              <div className="grid grid-cols-8 md:grid-cols-12 gap-2 max-h-40 overflow-y-auto">
                {STICKERS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => { sendMessage(s, 'sticker'); setShowStickers(false); }}
                    className="text-2xl hover:bg-white/10 rounded-lg p-2 transition"
                    disabled={isLoading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="absolute left-0 right-0 bottom-0 px-3 md:px-6 py-3 md:py-4 bg-gradient-to-t from-[#5B46F6] via-[#5B46F6]">
          <div className="mx-auto max-w-[720px] flex items-center gap-2">
            <button
              onClick={() => setShowStickers((v) => !v)}
              className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-white/15 grid place-items-center border border-white/20 hover:bg-white/25 transition"
              disabled={isLoading}
              title="Stickers"
            >
              <Smile className="h-5 w-5 text-white" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-white/15 grid place-items-center border border-white/20 hover:bg-white/25 transition"
              disabled={isLoading}
              title="Attach"
            >
              <ImageIcon className="h-5 w-5 text-white" />
            </button>

            <div className="flex-1">
              <div className="flex items-center rounded-full bg-white px-4 md:px-5 py-2 md:py-3 shadow-lg">
                <Mic className="mr-2 h-5 w-5 text-gray-400 hidden sm:block" />
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ok. Let me check"
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none outline-none text-sm md:text-base text-gray-800 placeholder-gray-400 bg-transparent"
                  style={{ maxHeight: 96 }}
                  onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={() => sendMessage(newMessage)}
                  disabled={!newMessage.trim() || isLoading}
                  className="ml-2 h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#6F59FF] hover:bg-[#5c49ff] grid place-items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              onChange={handleImageUpload}
              disabled={isLoading}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers (bubbles) ---------- */

function BubbleIncoming({ children, className = '' }) {
  return (
    <div
      className={`max-w-[78%] md:max-w-[70%] rounded-[22px] rounded-bl-sm bg-white/10 text-white px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.15)] border border-white/15 ${className}`}
    >
      {children}
    </div>
  );
}

function BubbleOutgoing({ children, className = '' }) {
  return (
    <div
      className={`max-w-[78%] md:max-w-[70%] rounded-[22px] rounded-br-sm bg-white text-[#3D3D3D] px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.15)] ${className}`}
    >
      {children}
    </div>
  );
}

function FileBubbleIncoming({ href = '#', name = 'Document', size = '—' }) {
  return (
    <BubbleIncoming className="pl-3 pr-2 py-2">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm leading-tight">{name}</p>
          <p className="text-[11px] opacity-80">{size}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="h-10 w-10 rounded-full bg-white/15 grid place-items-center border border-white/20 hover:bg-white/25 transition"
          title="Download"
        >
          <Download className="h-5 w-5 text-white" />
        </a>
      </div>
    </BubbleIncoming>
  );
}

function FileBubbleOutgoing({ href = '#', name = 'Document', size = '—' }) {
  return (
    <BubbleOutgoing className="pl-3 pr-2 py-2">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[#EEE8FF] grid place-items-center">
          <FileText className="h-5 w-5 text-[#6F59FF]" />
        </div>
        <div className="flex-1">
          <p className="text-sm leading-tight">{name}</p>
          <p className="text-[11px] text-gray-500">{size}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="h-10 w-10 rounded-full bg-[#6F59FF] grid place-items-center hover:bg-[#5c49ff] transition"
          title="Download"
        >
          <Download className="h-5 w-5 text-white" />
        </a>
      </div>
    </BubbleOutgoing>
  );
}

function TimeTag({ children }) {
  if (!children) return null;
  return <div className="text-[10px] md:text-[11px] opacity-60 mt-1 text-right">{children}</div>;
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
