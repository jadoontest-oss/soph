'use client';
import { useState, useEffect, useRef } from 'react';
import { Heart, Send, Image, Smile, Lock, Users, Trash2 } from 'lucide-react';

const HARDCODED_PASSWORD = 'secret2024';
const POLL_INTERVAL = 1000; // Poll every second for new messages

const STICKERS = [
  '❤️', '💕', '💖', '💘', '💝', '💗', '💓', '💞', '💟', '♥️',
  '😍', '🥰', '😘', '💋', '😊', '😄', '😆', '🤗', '😇', '🥺', '😭',
  '🔥', '✨', '🌟', '💫', '🦋', '🌈', '☀️', '🌙', '⭐',
  '🎉', '🎊', '🥳', '🎈','👑', '💎', '💐', '🍀', '🦄',
  '🐱', '😺', '😸', '😻', '😽', '🙀', '😹', '😿', '🐾', '🐈', '🐈‍⬛',
  '🍓', '🍒', '🍉', '🍑', '🍯', '🥛', '🍦', '🥞', '🍪',
  '🧸', '🌙', '⭐', '🌷', '🪻', '🛌', '☕', '📖', '🎶',
  '🍎', '🍊', '🍌', '🍉', '🍓', '🍒', '🍍', '🥭', '🍑', '🥝', '🍇', '🥑', '🥕', '🍟', '🍕', '🍔', '🌭', '🍣', '🍱', '🍜', '🍦', '🍪', '🍩', '🧁', '🍫', '🍯', '🥛', '☕', '🥤',
  '🌹', '🌸', '🌷', '🌼', '🌻', '💐', '🪻', '🌺', '🥀', '🌱', '🍀', '🌿', '🍃', '🌴', '🌲', '🌳', '🌵', '🌾', '🪴', '🤗', '🥰', '😍', '😘', '😚', '😙', '😽', '😻', '🫂', '💏', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💞', '💓', '💗', '💖'

  
];

const ALLOWED_USERNAMES = ['Person 1', 'Person 2'];
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

  // Load previously chosen username (if any)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null;
    if (saved && ALLOWED_USERNAMES.includes(saved)) {
      setSelectedUsername(saved);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
        if (data.messages.length > 0) {
          setLastMessageId(data.messages[data.messages.length - 1].id);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Poll for new messages
  const pollForMessages = async () => {
    try {
      const url = lastMessageId
        ? `/api/poll?lastMessageId=${lastMessageId}`
        : '/api/poll';

      const response = await fetch(url);
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => [...prev, ...data.messages]);
        setLastMessageId(data.messages[data.messages.length - 1].id);
      }
    } catch (error) {
      console.error('Failed to poll messages:', error);
    }
  };

  // Start/stop polling
  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();

      pollIntervalRef.current = setInterval(pollForMessages, POLL_INTERVAL);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated, lastMessageId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === HARDCODED_PASSWORD) {
      // Fix the username to the selected value
      setUser(selectedUsername);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(USER_STORAGE_KEY, selectedUsername);
      } catch {}
    } else {
      alert('Incorrect password!');
    }
  };

  const sendMessage = async (content, type = 'text') => {
    if ((type === 'text' && !content.trim()) || !user || isLoading) return;

    setIsLoading(true);

    try {
      const message = {
        user,
        content,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        const data = await response.json();
        // Message will be picked up by polling, but add immediately for better UX
        setMessages((prev) => [...prev, data.message]);
        setLastMessageId(data.message.id);

        if (type === 'text') {
          setNewMessage('');
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/') || isLoading) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        await sendMessage(data.url, 'image');
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllMessages = async () => {
    if (!confirm('Are you sure you want to clear all messages?')) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
        setLastMessageId(null);
      }
    } catch (error) {
      console.error('Failed to clear messages:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-white/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Lock className="text-white text-3xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Private Chat</h1>
            <p className="text-white/80">Enter the secret password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white/80 mb-2 text-sm">Choose your fixed username</label>
              <select
                value={selectedUsername}
                onChange={(e) => setSelectedUsername(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
              >
                {ALLOWED_USERNAMES.map((u) => (
                  <option key={u} value={u} className="bg-indigo-800">
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-4 px-6 rounded-2xl transition duration-300 flex items-center justify-center space-x-2 backdrop-blur-sm border border-white/20"
            >
              <Lock className="w-5 h-5" />
              <span>Unlock Chat</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-full p-2">
              <Heart className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Private Chat</h1>
              <p className="text-white/70 text-sm">You are: {user}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white/80">
              <Users className="w-5 h-5" />
              <span className="text-sm">2 People Only</span>
            </div>
            <button
              onClick={clearAllMessages}
              className="bg-red-500/20 hover:bg-red-500/30 text-white p-2 rounded-lg transition duration-200"
              title="Clear all messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white/10 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Heart className="text-white/60 w-12 h-12" />
              </div>
              <p className="text-white/60 text-lg">Start your private conversation...</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user === user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-6 py-3 rounded-3xl ${
                  message.user === user
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto'
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs opacity-70 mb-1">{message.user}</span>
                  {message.type === 'text' ? (
                    <span className="break-words">{message.content}</span>
                  ) : message.type === 'sticker' ? (
                    <span className="text-4xl">{message.content}</span>
                  ) : (
                    <img
                      src={message.content}
                      alt="Shared image"
                      className="rounded-2xl max-w-full h-auto"
                    />
                  )}
                  <span className="text-xs opacity-50 mt-1 text-right">{message.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticker Picker */}
      {showStickers && (
        <div className="bg-white/10 backdrop-blur-lg border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto">
              {STICKERS.map((sticker, index) => (
                <button
                  key={index}
                  onClick={() => {
                    sendMessage(sticker, 'sticker');
                    setShowStickers(false);
                  }}
                  disabled={isLoading}
                  className="text-2xl hover:bg-white/10 rounded-lg p-2 transition duration-200 disabled:opacity-50"
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/10 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition duration-200 border border-white/20 disabled:opacity-50"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowStickers(!showStickers)}
                disabled={isLoading}
                className={`${showStickers ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'} text-white p-3 rounded-2xl transition duration-200 border border-white/20 disabled:opacity-50`}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-3 pr-12 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm resize-none disabled:opacity-50"
                rows="1"
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>

            <button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim() || isLoading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition duration-200 shadow-lg"
            >
              <Send className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isLoading}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
