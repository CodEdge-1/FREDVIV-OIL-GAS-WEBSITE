import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { RoleBadge } from '../../components/dashboard/RoleBadge';
import { logout, getSession, getAccounts, StaffAccount } from '../../lib/auth';
import { Send, Search, Hash, Plus, X, Lock, Paperclip, Image, FileText, Download, Trash2 } from 'lucide-react';
import { markChatAsRead, addNotification } from '../../lib/store';

type Role = 'admin' | 'manager' | 'accountant' | 'auditor';

interface Attachment {
  name: string;
  type: string; // MIME type
  url: string;  // base64 data URL
  size: number; // bytes
}

interface Message {
  id: string;
  senderId: string;
  sender: string;
  role: Role;
  text: string;
  timestamp: Date;
  attachment?: Attachment;
}

interface Conversation {
  id: string;
  type: 'broadcast' | 'direct';
  name: string;
  role?: Role;
  online: boolean;
  messages: Message[];
  unread: number;
}

// Serialized form stored in localStorage
interface StoredMessage {
  id: string;
  senderId: string;
  sender: string;
  role: Role;
  text: string;
  timestamp: string;
  attachment?: Attachment;
}

interface PrivateChatData {
  staffId: string;
  staffName: string;
  staffRole: Role;
  messages: StoredMessage[];
}

const PRIVATE_CHATS_KEY = 'fredviv_private_chats';
const BROADCAST_MESSAGES_KEY = 'fredviv_broadcast_messages';

function loadPrivateChats(): Record<string, PrivateChatData> {
  try {
    return JSON.parse(localStorage.getItem(PRIVATE_CHATS_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePrivateChats(chats: Record<string, PrivateChatData>) {
  localStorage.setItem(PRIVATE_CHATS_KEY, JSON.stringify(chats));
}

function loadBroadcastMessages(): StoredMessage[] {
  try {
    return JSON.parse(localStorage.getItem(BROADCAST_MESSAGES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveBroadcastMessages(messages: StoredMessage[]) {
  localStorage.setItem(BROADCAST_MESSAGES_KEY, JSON.stringify(messages));
}

function deserializeMessages(stored: StoredMessage[]): Message[] {
  return stored.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
}

function serializeMessage(msg: Message): StoredMessage {
  return { ...msg, timestamp: msg.timestamp.toISOString() };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getLastMessage(conv: Conversation): string {
  if (conv.messages.length === 0) return 'No messages yet';
  const last = conv.messages[conv.messages.length - 1];
  if (!last.text && last.attachment) {
    return last.attachment.type.startsWith('image/') ? '📷 Image' : `📎 ${last.attachment.name}`;
  }
  return last.text.length > 45 ? last.text.slice(0, 45) + '…' : last.text;
}

function getLastMessageTime(conv: Conversation): string {
  if (conv.messages.length === 0) return '';
  return formatTime(conv.messages[conv.messages.length - 1].timestamp);
}

export function ChatCenter() {
  const navigate = useNavigate();
  const location = useLocation();

  const role: Role = location.pathname.includes('/manager/')
    ? 'manager'
    : location.pathname.includes('/accountant/')
    ? 'accountant'
    : location.pathname.includes('/auditor/')
    ? 'auditor'
    : 'admin';

  const session = getSession();
  const currentUser = { id: session?.id ?? role, name: session?.name ?? 'Unknown' };
  const isAdmin = role === 'admin';

  function buildConversations(): Conversation[] {
    const broadcastMsgs = deserializeMessages(loadBroadcastMessages());
    const result: Conversation[] = [
      {
        id: 'broadcast',
        type: 'broadcast',
        name: 'All Staff',
        online: true,
        unread: 0,
        messages: broadcastMsgs,
      },
    ];

    const privateChats = loadPrivateChats();

    if (isAdmin) {
      // Admin sees all private conversations
      for (const [convId, data] of Object.entries(privateChats)) {
        result.push({
          id: convId,
          type: 'direct',
          name: data.staffName,
          role: data.staffRole,
          online: false,
          unread: 0,
          messages: deserializeMessages(data.messages),
        });
      }
    } else {
      // Staff sees only their own private conversation with admin
      const myConvId = `dm-${currentUser.id}`;
      if (privateChats[myConvId]) {
        const data = privateChats[myConvId];
        result.push({
          id: myConvId,
          type: 'direct',
          name: 'Administrator',
          role: 'admin',
          online: false,
          unread: 0,
          messages: deserializeMessages(data.messages),
        });
      }
    }

    return result;
  }

  const [conversations, setConversations] = useState<Conversation[]>(() => buildConversations());
  const [activeId, setActiveId] = useState<string>('broadcast');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [attachError, setAttachError] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark chat as read when this page is open
  useEffect(() => {
    markChatAsRead(currentUser.id);
  }, [currentUser.id]);

  const activeConv = conversations.find((c) => c.id === activeId)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConv?.messages.length]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAttachError('File too large. Maximum size is 5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({ name: file.name, type: file.type, url: reader.result as string, size: file.size });
      setAttachError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !attachment) return;

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      senderId: currentUser.id,
      sender: currentUser.name,
      role,
      text,
      timestamp: new Date(),
      ...(attachment ? { attachment } : {}),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMessage] }
          : c
      )
    );

    // Persist to localStorage
    if (activeId === 'broadcast') {
      const stored = loadBroadcastMessages();
      saveBroadcastMessages([...stored, serializeMessage(newMessage)]);
    } else {
      const privateChats = loadPrivateChats();
      if (privateChats[activeId]) {
        privateChats[activeId].messages.push(serializeMessage(newMessage));
      } else {
        // Staff sending first message creates the entry
        privateChats[activeId] = {
          staffId: currentUser.id,
          staffName: currentUser.name,
          staffRole: role,
          messages: [serializeMessage(newMessage)],
        };
      }
      savePrivateChats(privateChats);

      // Notify the other person in this DM
      const conv = conversations.find((c) => c.id === activeId);
      if (conv) {
        // recipient is either admin (for staff) or the staff member (for admin)
        const recipientId = isAdmin
          ? activeId.replace('dm-', '')   // admin messaging staff → staff's ID
          : 'admin';                       // staff messaging admin
        const preview = text
          ? (text.length > 60 ? text.slice(0, 60) + '…' : text)
          : attachment
          ? (attachment.type.startsWith('image/') ? '📷 Sent an image' : `📎 ${attachment.name}`)
          : '';
        addNotification({
          recipientId,
          title: `New message from ${currentUser.name}`,
          body: preview,
        });
      }
    }

    setInputText('');
    setAttachment(null);
  };

  const handleDeleteMessage = (msgId: string, convId: string) => {
    // Update state
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: c.messages.filter((m) => m.id !== msgId) }
          : c
      )
    );
    // Persist to localStorage
    if (convId === 'broadcast') {
      saveBroadcastMessages(loadBroadcastMessages().filter((m) => m.id !== msgId));
    } else {
      const chats = loadPrivateChats();
      if (chats[convId]) {
        chats[convId].messages = chats[convId].messages.filter((m) => m.id !== msgId);
        savePrivateChats(chats);
      }
    }
    setHoveredMsgId(null);
  };

  // Admin opens a new private DM with a staff member
  const handleStartDM = (staff: StaffAccount) => {
    const convId = `dm-${staff.id}`;
    setShowNewDMModal(false);

    // If already open, just switch to it
    const existing = conversations.find((c) => c.id === convId);
    if (existing) {
      setActiveId(convId);
      return;
    }

    // Create entry in localStorage so staff can also see it
    const privateChats = loadPrivateChats();
    if (!privateChats[convId]) {
      privateChats[convId] = {
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        messages: [],
      };
      savePrivateChats(privateChats);
    }

    const newConv: Conversation = {
      id: convId,
      type: 'direct',
      name: staff.name,
      role: staff.role,
      online: false,
      unread: 0,
      messages: [],
    };

    setConversations((prev) => [...prev, newConv]);
    setActiveId(convId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() || attachment) handleSend();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const broadcast = filteredConversations.filter((c) => c.type === 'broadcast');
  const directs = filteredConversations.filter((c) => c.type === 'direct');

  // Staff list for new DM modal (active staff not already in a DM)
  const staffAccounts = getAccounts().filter((a) => a.status === 'active');
  const existingDMStaffIds = conversations
    .filter((c) => c.type === 'direct')
    .map((c) => c.id.replace('dm-', ''));
  const availableStaff = staffAccounts.filter((s) => !existingDMStaffIds.includes(s.id));

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  for (const msg of activeConv.messages) {
    const label = formatDate(msg.timestamp);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === label) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date: label, messages: [msg] });
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Sidebar role={role} onLogout={handleLogout} />

      {/* Conversations Panel */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg mb-3">Chat Center</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Broadcast Channels */}
          {broadcast.length > 0 && (
            <div>
              <p className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Channels
              </p>
              {broadcast.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                />
              ))}
            </div>
          )}

          {/* Direct Messages */}
          <div>
            <div className="px-4 pt-4 pb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Direct Messages
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowNewDMModal(true)}
                  title="New Direct Message"
                  className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {directs.length > 0 ? (
              directs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  isPrivate
                />
              ))
            ) : (
              <p className="px-4 py-2 text-xs text-gray-600 italic">
                {isAdmin ? 'Click + to start a private message' : 'No private messages yet'}
              </p>
            )}
          </div>

          {filteredConversations.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">No conversations found</div>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Conversation Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center gap-3 flex-shrink-0">
          {activeConv.type === 'broadcast' ? (
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-primary" />
            </div>
          ) : (
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                {activeConv.name.charAt(0)}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                  activeConv.online ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold truncate">{activeConv.name}</h3>
              {activeConv.role && <RoleBadge role={activeConv.role} size="sm" />}
              {activeConv.type === 'direct' && (
                <span className="flex items-center gap-1 text-xs text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {activeConv.type === 'broadcast'
                ? `${conversations.length} members`
                : 'Only you and the other person can see this conversation'}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500 font-medium">{group.date}</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              <div className="space-y-4">
                {group.messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isHovered = hoveredMsgId === msg.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                      onMouseEnter={() => setHoveredMsgId(msg.id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {msg.sender.charAt(0)}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[65%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs text-gray-400 font-medium">{msg.sender}</span>
                          <RoleBadge role={msg.role} size="sm" />
                        </div>
                        <div
                          className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${
                            isMine
                              ? 'bg-primary text-white rounded-tr-sm'
                              : 'bg-gray-700 text-gray-200 rounded-tl-sm'
                          }`}
                        >
                          {/* Attachment */}
                          {msg.attachment && (
                            msg.attachment.type.startsWith('image/') ? (
                              <img
                                src={msg.attachment.url}
                                alt={msg.attachment.name}
                                className="max-w-full max-h-60 object-cover w-full"
                              />
                            ) : (
                              <a
                                href={msg.attachment.url}
                                download={msg.attachment.name}
                                className={`flex items-center gap-3 px-4 py-3 border-b ${isMine ? 'border-white/20 hover:bg-white/10' : 'border-gray-600 hover:bg-gray-600'} transition-colors`}
                              >
                                <FileText className="w-8 h-8 flex-shrink-0 opacity-80" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-xs">{msg.attachment.name}</p>
                                  <p className="text-xs opacity-60">{(msg.attachment.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <Download className="w-4 h-4 flex-shrink-0 opacity-70" />
                              </a>
                            )
                          )}
                          {/* Text */}
                          {msg.text && <p className="px-4 py-2.5">{msg.text}</p>}
                        </div>
                        <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                          {/* Delete button — only own messages, visible on hover */}
                          {isMine && isHovered && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id, activeId)}
                              title="Delete message"
                              className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {activeConv.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                {activeConv.type === 'direct' ? (
                  <Lock className="w-8 h-8 text-gray-500" />
                ) : (
                  <Hash className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <p className="text-gray-400 font-medium">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">
                {activeConv.type === 'direct'
                  ? 'This is a private conversation — only you and the other person can see it'
                  : 'Be the first to say something'}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Attachment preview */}
          {attachment && (
            <div className="mb-3 flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-xl px-3 py-2">
              {attachment.type.startsWith('image/') ? (
                <Image className="w-5 h-5 text-blue-400 flex-shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-orange-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{attachment.name}</p>
                <p className="text-gray-400 text-xs">{(attachment.size / 1024).toFixed(1)} KB</p>
              </div>
              {attachment.type.startsWith('image/') && (
                <img src={attachment.url} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
              )}
              <button
                onClick={() => setAttachment(null)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {attachError && (
            <p className="text-red-400 text-xs mb-2">{attachError}</p>
          )}

          <div className="flex gap-2 items-end">
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or document"
              className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors flex-shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeConv.type === 'broadcast'
                  ? `Message #All Staff…`
                  : `Private message to ${activeConv.name}…`
              }
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() && !attachment}
              className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* New DM Modal — Admin only */}
      {showNewDMModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h3 className="text-white font-bold text-lg">New Direct Message</h3>
                <p className="text-gray-400 text-sm mt-0.5">Select a staff member to message privately</p>
              </div>
              <button
                onClick={() => setShowNewDMModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staff List */}
            <div className="p-3 max-h-80 overflow-y-auto">
              {availableStaff.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">
                    {staffAccounts.length === 0
                      ? 'No staff accounts exist yet.'
                      : 'You already have a direct message open with every staff member.'}
                  </p>
                </div>
              ) : (
                availableStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleStartDM(staff)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{staff.name}</p>
                      <p className="text-gray-400 text-xs truncate">{staff.email}</p>
                    </div>
                    <RoleBadge role={staff.role} size="sm" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
  isPrivate?: boolean;
}

function ConversationItem({ conv, isActive, onClick, isPrivate }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${
        isActive ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-gray-700/50'
      }`}
    >
      {/* Avatar / Icon */}
      {conv.type === 'broadcast' ? (
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Hash className="w-4 h-4 text-primary" />
        </div>
      ) : (
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
            {conv.name.charAt(0)}
          </div>
          {isPrivate && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border border-gray-800">
              <Lock className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`text-sm font-medium truncate ${
              isActive ? 'text-white' : 'text-gray-300'
            }`}
          >
            {conv.type === 'broadcast' ? `# ${conv.name}` : conv.name}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-1">
            {getLastMessageTime(conv)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate">{getLastMessage(conv)}</p>
          {conv.unread > 0 && (
            <span className="ml-1 flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
