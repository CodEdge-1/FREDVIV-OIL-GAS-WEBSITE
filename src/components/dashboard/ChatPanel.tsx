import { useState } from 'react';
import { X, Send, Paperclip, ChevronDown } from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface Message {
  id: string;
  sender: string;
  role: 'admin' | 'manager' | 'accountant' | 'auditor';
  message: string;
  timestamp: string;
  read: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'admin' | 'manager' | 'accountant' | 'auditor';
}

export function ChatPanel({ isOpen, onClose, currentUserRole }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [messages] = useState<Message[]>([]);

  const handleSend = () => {
    if (message.trim()) {
      // Send message logic here
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gray-800 border-l border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">Internal Chat</h3>
          <p className="text-xs text-gray-400">Secure communication</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-2 ${
              msg.role === currentUserRole ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{msg.sender}</span>
              <RoleBadge role={msg.role} size="sm" />
            </div>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === currentUserRole
                  ? 'bg-primary text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
            </div>
            <span className="text-xs text-gray-500">{msg.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
