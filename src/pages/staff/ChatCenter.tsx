import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { RoleBadge } from '../../components/dashboard/RoleBadge';
import { logout, getSession, getAuthToken, Role, StaffAccount } from '../../lib/auth';
import { Plus, X, Lock, Paperclip, Image, FileText, Download, Trash2, Search, Hash, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SOCKET_URL = API_BASE_URL.replace('/api', '');

interface Attachment {
  name: string;
  type: string;
  url: string;
  size: number;
}

interface Message {
  id: string;
  roomId: string;
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

function mapBackendMessage(msg: any): Message {
  return {
    id: msg.id,
    roomId: msg.roomId || 'broadcast',
    senderId: msg.senderId,
    sender: msg.sender?.name || 'Unknown',
    role: msg.sender?.role as Role,
    text: msg.text || '',
    timestamp: new Date(msg.createdAt),
    attachment: msg.attachmentUrl ? {
      url: msg.attachmentUrl,
      name: msg.attachmentName || 'Attachment',
      type: msg.attachmentType || 'application/octet-stream',
      size: msg.attachmentSize || 0,
    } : undefined
  };
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
    ? Role.MANAGER
    : location.pathname.includes('/accountant/')
    ? Role.ACCOUNTANT
    : location.pathname.includes('/auditor/')
    ? Role.AUDITOR
    : Role.ADMIN;

  const session = getSession();
  const currentUser = { id: session?.id ?? role, name: session?.name ?? 'Unknown' };
  const isAdmin = role === Role.ADMIN;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('broadcast');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [attachError, setAttachError] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);

  // 1. Fetch Staff List
  useEffect(() => {
    api.get('/users').then(users => {
      setStaffList(users);
    }).catch(console.error);
  }, []);

  // 2. Build Conversations once Staff List is available
  useEffect(() => {
    const result: Conversation[] = [
      {
        id: 'broadcast',
        type: 'broadcast',
        name: 'All Staff',
        online: true,
        unread: 0,
        messages: [],
      },
    ];

    const isStaffDMAllowed = role === Role.ADMIN || role === Role.ACCOUNTANT || role === Role.AUDITOR;

    if (isStaffDMAllowed) {
      staffList.forEach(staff => {
        if (staff.id !== currentUser.id) {
          const sortedIds = [currentUser.id, staff.id].sort();
          const roomId = `dm-${sortedIds[0]}_${sortedIds[1]}`;
          result.push({
            id: roomId,
            type: 'direct',
            name: staff.name,
            role: staff.role,
            online: false,
            unread: 0,
            messages: [],
          });
        }
      });
    } else if (role === Role.MANAGER) {
      // Managers see DMs with Admin, Accountants, and Auditors
      staffList.forEach(staff => {
        if (staff.role === Role.ADMIN || staff.role === Role.ACCOUNTANT || staff.role === Role.AUDITOR) {
          const sortedIds = [currentUser.id, staff.id].sort();
          const roomId = `dm-${sortedIds[0]}_${sortedIds[1]}`;
          result.push({
            id: roomId,
            type: 'direct',
            name: staff.role === Role.ADMIN ? 'Administrator' : staff.name,
            role: staff.role,
            online: false,
            unread: 0,
            messages: [],
          });
        }
      });
    }
    
    // Preserve messages if they exist
    setConversations(prev => result.map(newConv => {
      const existing = prev.find(p => p.id === newConv.id);
      if (existing) {
        return { ...newConv, messages: existing.messages, unread: existing.unread };
      }
      return newConv;
    }));
  }, [staffList, role, currentUser.id]);

  // Fetch Last Messages for Previews & dynamically load other active rooms (like monitored chats for Admin)
  useEffect(() => {
    if (conversations.length === 0) return;
    
    api.get('/chat/conversations/last-messages')
      .then((lastMsgs: any[]) => {
        setConversations(prev => {
          const updated = [...prev];
          
          lastMsgs.forEach(m => {
            const existingIdx = updated.findIndex(c => c.id === m.roomId);
            const mappedMsg = mapBackendMessage(m.message);
            
            if (existingIdx !== -1) {
              if (updated[existingIdx].messages.length === 0) {
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  messages: [mappedMsg],
                };
              }
            } else {
              // This is a room not in our pre-populated list!
              // For Admin, it's likely a monitored conversation between other users.
              let roomName = 'Monitored Room';
              let roomRole: Role | undefined = undefined;
              
              if (m.roomId.startsWith('dm-')) {
                const ids = m.roomId.replace('dm-', '').split('_');
                const participants = ids.map(id => staffList.find(s => s.id === id)).filter(Boolean);
                if (participants.length === 2) {
                  roomName = `${participants[0]?.name} & ${participants[1]?.name}`;
                } else if (participants.length === 1) {
                  roomName = `Chat: ${participants[0]?.name}`;
                } else {
                  roomName = `Private DM (${ids.join(', ')})`;
                }
              }
              
              updated.push({
                id: m.roomId,
                type: 'direct',
                name: roomName,
                role: roomRole,
                online: false,
                unread: 0,
                messages: [mappedMsg],
              });
            }
          });
          
          return updated;
        });
      })
      .catch(console.error);
  }, [conversations.length, staffList]);

  // 3. Setup Socket.IO
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const newSocket = io(`${SOCKET_URL}/chat`, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('join-room', activeId);
    });

    newSocket.on('room-history', (msgs: any[]) => {
      const mapped = msgs.map(mapBackendMessage);
      setConversations(prev => prev.map(c => 
        c.id === activeId ? { ...c, messages: mapped, unread: 0 } : c
      ));
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    newSocket.on('new-message', (msg: any) => {
      const mapped = mapBackendMessage(msg);
      setConversations(prev => {
        const exists = prev.some(c => c.id === mapped.roomId);
        if (!exists) {
          let roomName = 'Monitored Room';
          if (mapped.roomId.startsWith('dm-')) {
            const ids = mapped.roomId.replace('dm-', '').split('_');
            const participants = ids.map(id => staffList.find(s => s.id === id)).filter(Boolean);
            if (participants.length === 2) {
              roomName = `${participants[0]?.name} & ${participants[1]?.name}`;
            } else if (participants.length === 1) {
              roomName = `Chat: ${participants[0]?.name}`;
            }
          }
          return [...prev, {
            id: mapped.roomId,
            type: 'direct',
            name: roomName,
            online: false,
            unread: mapped.roomId !== activeId ? 1 : 0,
            messages: [mapped],
          }];
        }
        
        return prev.map(c => {
          if (c.id === mapped.roomId) {
            const isAtBottom = messagesEndRef.current && 
              messagesEndRef.current.scrollHeight - messagesEndRef.current.scrollTop <= messagesEndRef.current.clientHeight + 100;
            
            if (mapped.roomId === activeId && isAtBottom) {
               setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }

            return {
              ...c,
              messages: [...c.messages, mapped],
              unread: mapped.roomId !== activeId ? c.unread + 1 : 0
            };
          }
          return c;
        });
      });
    });

    newSocket.on('message-deleted', (data: { roomId: string; messageId: string }) => {
      setConversations(prev => prev.map(c => 
        c.id === data.roomId ? { ...c, messages: c.messages.filter(m => m.id !== data.messageId) } : c
      ));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [activeId]);

  // Handle room changes
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('join-room', activeId);
    }
  }, [activeId, socket]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const isMonitoredReadOnly = role === Role.ADMIN && 
    activeConv?.type === 'direct' && 
    activeConv.id.includes('_') && 
    !activeConv.id.includes(currentUser.id);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setAttachError('File too large. Maximum size is 10 MB.');
      e.target.value = '';
      return;
    }

    try {
      setAttachError('Uploading...');
      const formData = new FormData();
      formData.append('file', file);

      // Use standard fetch to avoid api.post automatically stringifying the FormData
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chat/upload`, {
        method: 'POST',
        headers: {
           ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setAttachment({
        name: data.name,
        type: data.type,
        url: data.url,
        size: data.size,
      });
      setAttachError('');
    } catch (error) {
      console.error('File upload failed', error);
      setAttachError('File upload failed. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !attachment) return;

    if (socket) {
      socket.emit('send-message', {
        roomId: activeId,
        content: text,
        attachment
      });

      if (activeId !== 'broadcast' && activeId.startsWith('dm-')) {
        const ids = activeId.replace('dm-', '').split('_');
        const recipientId = ids.find(id => id !== currentUser.id);
        if (recipientId) {
          const preview = text
            ? (text.length > 60 ? text.slice(0, 60) + '…' : text)
            : attachment
            ? (attachment.type.startsWith('image/') ? '📷 Sent an image' : `📎 ${attachment.name}`)
            : '';
          
          api.post('/notifications', {
            recipientId,
            title: `New message from ${currentUser.name}`,
            body: preview,
          }).catch(err => console.error('Failed to send notification:', err));
        }
      }
    }

    setInputText('');
    setAttachment(null);
  };

  const handleDeleteMessage = async (msgId: string, convId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/chat/messages/${msgId}`);
      toast.success("Message deleted");
      setConversations(prev => prev.map(c => 
        c.id === convId ? { ...c, messages: c.messages.filter(m => m.id !== msgId) } : c
      ));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete message");
    }
  };

  const handleStartDM = (staff: StaffAccount) => {
    const sortedIds = [currentUser.id, staff.id].sort();
    const roomId = `dm-${sortedIds[0]}_${sortedIds[1]}`;
    setShowNewDMModal(false);

    if (!conversations.find(c => c.id === roomId)) {
       setConversations(prev => [...prev, {
         id: roomId,
         type: 'direct',
         name: staff.name,
         role: staff.role,
         online: false,
         unread: 0,
         messages: []
       }]);
    }
    setActiveId(roomId);
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
  
  let directs = filteredConversations.filter((c) => c.type === 'direct');
  let monitoredDMs: Conversation[] = [];
  
  if (role === Role.ADMIN) {
    directs = filteredConversations.filter((c) => {
      if (c.type !== 'direct') return false;
      if (!c.id.includes('_')) return true; // Legacy room
      return c.id.includes(currentUser.id); // Composite room containing Admin ID
    });
    
    monitoredDMs = filteredConversations.filter((c) => {
      if (c.type !== 'direct') return false;
      if (!c.id.includes('_')) return false; // Legacy room
      return !c.id.includes(currentUser.id); // Monitored composite room
    });
  }

  const activeStaff = staffList.filter((a) => a.status === 'ACTIVE');
  const existingDMStaffIds = conversations
    .filter((c) => c.type === 'direct' && c.id.startsWith('dm-'))
    .map((c) => {
      const ids = c.id.replace('dm-', '').split('_');
      return ids.find(id => id !== currentUser.id);
    })
    .filter(Boolean);
  const availableStaff = activeStaff.filter((s) => s.id !== currentUser.id && !existingDMStaffIds.includes(s.id));

  const groupedMessages: { date: string; messages: Message[] }[] = [];
  if (activeConv) {
    for (const msg of activeConv.messages) {
      const label = formatDate(msg.timestamp);
      const last = groupedMessages[groupedMessages.length - 1];
      if (last && last.date === label) {
        last.messages.push(msg);
      } else {
        groupedMessages.push({ date: label, messages: [msg] });
      }
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
              {(role === Role.ADMIN || role === Role.ACCOUNTANT || role === Role.AUDITOR) && (
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
                {role === Role.MANAGER ? 'No private messages yet' : 'Click + to start a private message'}
              </p>
            )}
          </div>

          {/* Monitored Conversations (Admins Only) */}
          {role === Role.ADMIN && monitoredDMs.length > 0 && (
            <div>
              <p className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Monitored Conversations
              </p>
              {monitoredDMs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  isPrivate
                />
              ))}
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">No conversations found</div>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center gap-3 flex-shrink-0">
          {activeConv?.type === 'broadcast' ? (
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-primary" />
            </div>
          ) : (
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                {activeConv?.name.charAt(0) || '?'}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                  activeConv?.online ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {activeConv && (
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold truncate">{activeConv.name}</h3>
                {activeConv.role && <RoleBadge role={activeConv.role.toLowerCase() as any} size="sm" />}
                {activeConv.type === 'direct' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    Private
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400">
              {activeConv?.type === 'broadcast'
                ? `${conversations.length} members`
                : 'Only you and the other person can see this conversation'}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {groupedMessages.map((group) => (
            <div key={group.date}>
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
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {msg.sender.charAt(0)}
                      </div>

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
                                target="_blank"
                                rel="noreferrer"
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
                          {msg.text && <p className="px-4 py-2.5">{msg.text}</p>}
                        </div>
                        <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
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
          <div ref={messagesEndRef} />

          {activeConv && activeConv.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
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
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

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
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isMonitoredReadOnly}
              title={isMonitoredReadOnly ? "Disabled in read-only mode" : "Attach image or document"}
              className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isMonitoredReadOnly}
              placeholder={
                isMonitoredReadOnly
                  ? "Read-only monitored conversation..."
                  : activeConv?.type === 'broadcast'
                  ? `Message #All Staff…`
                  : `Private message to ${activeConv?.name}…`
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
              disabled={isMonitoredReadOnly || (!inputText.trim() && !attachment)}
              className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isMonitoredReadOnly ? 'Monitored read-only view' : 'Press Enter to send · Shift+Enter for new line'}
          </p>
        </div>
      </div>

      {showNewDMModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
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

            <div className="p-3 max-h-80 overflow-y-auto">
              {availableStaff.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">
                    {staffList.length === 0
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
                    <RoleBadge role={staff.role.toLowerCase() as any} size="sm" />
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
