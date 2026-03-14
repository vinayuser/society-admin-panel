import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Button,
  Input,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Badge,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { io } from 'socket.io-client';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const getSocketUrl = () => {
  const api = import.meta.env.VITE_API_URL || '';
  if (api && api.startsWith('http')) return api.replace(/\/$/, '');
  return window.location.origin;
};

const Room = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem('accessToken');
  const isAdmin = user?.role === 'society_admin' || user?.role === 'super_admin';

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [readCounts, setReadCounts] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!groupId) return;
    axiosInstance
      .get(ENDPOINTS.CHAT.GROUP(groupId))
      .then((res) => {
        if (res.data?.success) setGroup(res.data.data);
      })
      .catch(() => {
        toast.error('Group not found');
        navigate('/admin/dashboard/chat');
      });
  }, [groupId, navigate]);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.CHAT.MESSAGES, { params: { group_id: groupId, limit: 100, offset: 0 } })
      .then((res) => {
        const data = res.data?.data ?? [];
        setMessages(Array.isArray(data) ? data : []);
        const counts = {};
        (res.data?.data || []).forEach((m) => {
          counts[m.id] = m.readCount;
        });
        setReadCounts(counts);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!token || !groupId) return;
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-group', parseInt(groupId, 10), (ack) => {
        if (ack && !ack.success) toast.error(ack.message || 'Could not join group');
      });
    });

    socket.on('receive-message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setReadCounts((c) => ({ ...c, [msg.id]: msg.readCount || 0 }));
    });

    socket.on('read-receipt', ({ messageId, readCount }) => {
      setReadCounts((c) => ({ ...c, [messageId]: readCount }));
    });

    socket.on('user-typing', ({ userName }) => {
      setTypingUser(userName);
      setTimeout(() => setTypingUser(null), 3000);
    });

    socket.on('connect_error', (err) => {
      toast.error(err.message || 'Connection error');
    });

    return () => {
      socket.emit('leave-group', parseInt(groupId, 10));
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, groupId]);

  const sendMessage = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    if (socketRef.current?.connected) {
      socketRef.current.emit(
        'send-message',
        { groupId: parseInt(groupId, 10), messageText: text, messageType: 'text' },
        (ack) => {
          setSending(false);
          if (ack?.success) setInputText('');
          else toast.error(ack?.message || 'Failed to send');
        }
      );
    } else {
      axiosInstance
        .post(ENDPOINTS.CHAT.SEND_MESSAGE, {
          groupId: parseInt(groupId, 10),
          messageText: text,
          messageType: 'text',
        })
        .then((res) => {
          if (res.data?.success) {
            setMessages((prev) => [...prev, res.data.data]);
            setInputText('');
          }
        })
        .catch(() => toast.error('Failed to send'))
        .finally(() => setSending(false));
    }
  };

  const markRead = (messageId) => {
    axiosInstance.post(ENDPOINTS.CHAT.MESSAGE_READ, { messageId }).catch(() => {});
  };

  const handleDeleteMessage = (msg) => {
    if (!window.confirm('Delete this message?')) return;
    axiosInstance
      .delete(ENDPOINTS.CHAT.MESSAGE_DELETE(msg.id))
      .then(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        toast.success('Message deleted');
      })
      .catch(() => toast.error('Could not delete'));
  };

  const handlePinMessage = (msg, pin) => {
    axiosInstance
      .patch(ENDPOINTS.CHAT.MESSAGE_PIN(msg.id), { pin })
      .then(() => {
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            isPinned: m.id === msg.id ? pin : false,
          }))
        );
        toast.success(pin ? 'Message pinned' : 'Message unpinned');
      })
      .catch(() => toast.error('Failed to update'));
  };

  const onInputFocus = () => {
    const gid = parseInt(groupId, 10);
    if (socketRef.current?.connected) socketRef.current.emit('typing', gid);
  };

  const canPost = group && (!group.adminOnlyPosting || isAdmin);
  const isOwn = (msg) => msg.userId === user?.id;

  if (!group && !loading) return null;

  return (
    <div className="d-flex flex-column" style={{ height: 'calc(100vh - 180px)', minHeight: 400 }}>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap mb-2">
        <div className="d-flex align-items-center gap-2">
          <Button color="secondary" size="sm" onClick={() => navigate('/admin/dashboard/chat')}>
            ← Back
          </Button>
          <h5 className="mb-0">
            {group?.name}
            {group?.adminOnlyPosting && (
              <Badge color="warning" className="ms-2">
                Admin only
              </Badge>
            )}
          </h5>
          <span className="text-muted small">({group?.memberCount || 0} members)</span>
        </div>
        {isAdmin && (
          <Button color="outline-secondary" size="sm" onClick={() => setSettingsOpen(true)}>
            Group settings
          </Button>
        )}
      </div>

      <Card className="flex-grow-1 d-flex flex-column overflow-hidden">
        <CardBody className="d-flex flex-column p-0" style={{ minHeight: 0 }}>
          <div
            className="flex-grow-1 overflow-auto p-3"
            style={{ maxHeight: 400 }}
            onScroll={(e) => {
              const el = e.target;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
              if (nearBottom && messages.length) {
                const last = messages[messages.length - 1];
                if (last?.id) markRead(last.id);
              }
            }}
          >
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <Spinner />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`d-flex mb-2 ${isOwn(msg) ? 'justify-content-end' : ''}`}
                    onMouseEnter={() => setDropdownOpen(msg.id)}
                    onMouseLeave={() => setDropdownOpen(null)}
                  >
                    <div
                      className={`rounded px-3 py-2 position-relative ${
                        isOwn(msg) ? 'bg-primary text-white' : 'bg-light'
                      }`}
                      style={{ maxWidth: '75%' }}
                    >
                      {!isOwn(msg) && (
                        <small className="d-block opacity-75">{msg.userName}</small>
                      )}
                      {msg.isPinned && (
                        <Badge color="warning" className="position-absolute top-0 end-0">Pinned</Badge>
                      )}
                      <div>{msg.messageText}</div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="opacity-75">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                        <small className="ms-2">
                          Read: {readCounts[msg.id] ?? msg.readCount ?? 0}/{group?.members?.length ?? group?.memberCount ?? 0}
                        </small>
                      </div>
                      {(isAdmin || (isOwn(msg) && group?.membersCanDeleteOwn)) && dropdownOpen === msg.id && (
                        <div className="position-absolute end-0 top-0 mt-1 me-1">
                          {isAdmin && (
                            <Button
                              size="sm"
                              color="link"
                              className="text-dark p-1"
                              onClick={() => handlePinMessage(msg, !msg.isPinned)}
                            >
                              {msg.isPinned ? 'Unpin' : 'Pin'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="link"
                            className="text-danger p-1"
                            onClick={() => handleDeleteMessage(msg)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {typingUser && (
                  <div className="text-muted small mb-1">
                    <em>{typingUser} is typing...</em>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-top p-2">
            <form onSubmit={sendMessage} className="d-flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={onInputFocus}
                placeholder={canPost ? 'Type a message...' : 'Only admins can post here'}
                disabled={!canPost}
                className="flex-grow-1"
              />
              <Button type="submit" color="primary" disabled={!inputText.trim() || sending}>
                {sending ? '...' : 'Send'}
              </Button>
            </form>
          </div>
        </CardBody>
      </Card>

      {isAdmin && group && (
        <Modal isOpen={settingsOpen} toggle={() => setSettingsOpen(false)}>
          <ModalHeader toggle={() => setSettingsOpen(false)}>Group settings</ModalHeader>
          <ModalBody>
            <p>
              <strong>{group.name}</strong> · {group.memberCount} members
            </p>
            <p className="text-muted small">
              To edit name, description, posting rules, or members, use the Chat Groups list and update the group
              there. Pin/delete messages from the message dropdown.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};

export default Room;
