import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { CATEGORIES, CATEGORY_LABELS } from '../data/sampleData';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { toast } from '../components/ui/Toast';
import { Search, Users, Shield, Zap, Lock, Hash, ArrowRight, Plus, X, Trash2 } from 'lucide-react';

const ROOM_COLORS = ['#ff6b9d', '#ff85ab', '#ffa0bc', '#ffb8cc', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24'];

export default function ChatroomsPage() {
  const { currentUser } = useAuthStore();
  const { chatrooms, customChatrooms, searchChatrooms, getAllChatrooms, createChatroom, deleteChatroom } = useChatStore();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', category: 'general', color: '#ff6b9d' });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const navigate = useNavigate();

  const allRooms = search ? searchChatrooms(search) : getAllChatrooms();
  const builtInRooms = allRooms.filter(r => !r.isCustom);
  const userRooms = allRooms.filter(r => r.isCustom);

  const handleCreate = () => {
    if (!newRoom.name.trim()) {
      toast.error('Room name is required');
      return;
    }
    if (newRoom.name.trim().length < 3) {
      toast.error('Room name must be at least 3 characters');
      return;
    }
    const room = createChatroom({ ...newRoom, userId: currentUser?.id });
    toast.success(`Chatroom "${room.name}" created!`);
    setShowCreate(false);
    setNewRoom({ name: '', description: '', category: 'general', color: '#ff6b9d' });
    navigate(`/chat/${room.id}`);
  };

  const handleDelete = (e, roomId, roomName) => {
    e.stopPropagation();
    setDeleteConfirm({ id: roomId, name: roomName });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteChatroom(deleteConfirm.id);
      toast.info(`"${deleteConfirm.name}" has been deleted`);
      setDeleteConfirm(null);
    }
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">Chatrooms</div>
        <div className="page-subtitle">Multi-fandom chatrooms -- no tracking, no rate limits, no servers to join</div>

        <div className="page-toolbar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
            <Search size={16} />
            <input
              type="text"
              className="input"
              placeholder="Search chatrooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <motion.button
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={16} /> Create Room
          </motion.button>
        </div>
      </div>

      <div className="page-body">
        {/* Features banner */}
        <StaggerContainer staggerDelay={0.06} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { icon: Lock, title: 'No Tracking', desc: 'Your privacy is sacred' },
            { icon: Zap, title: 'No Rate Limit', desc: 'Chat as fast as you want' },
            { icon: Shield, title: 'AI Moderation', desc: 'Spam & toxicity detection' },
            { icon: Users, title: 'No Server Login', desc: 'Just click and chat' },
          ].map(({ icon: Icon, title, desc }) => (
            <StaggerItem key={title}>
              <div className="card feature-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14 }}>
                <div className="feature-icon-wrap">
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* User-created rooms */}
        {userRooms.length > 0 && (
          <>
            <div className="section-header">
              <div className="section-title">Your Rooms</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{userRooms.length} rooms</span>
            </div>
            <StaggerContainer className="chatroom-list" staggerDelay={0.05} style={{ marginBottom: 32 }}>
              {userRooms.map(room => (
                <StaggerItem key={room.id}>
                  <motion.div
                    className="chatroom-card"
                    onClick={() => navigate(`/chat/${room.id}`)}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ borderLeft: `3px solid ${room.color}` }}
                  >
                    <div className="chatroom-card-name">
                      <Hash size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: room.color, opacity: 0.9 }} />
                      {room.name}
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--accent-soft)', color: 'var(--text-accent)', marginLeft: 8, fontWeight: 600 }}>Custom</span>
                    </div>
                    <div className="chatroom-card-desc">{room.description || 'No description'}</div>
                    <div className="chatroom-card-meta">
                      <span>{room.category}</span>
                    </div>
                    {room.createdBy === currentUser?.id && (
                      <motion.button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => handleDelete(e, room.id, room.name)}
                        whileHover={{ scale: 1.1 }}
                        style={{ position: 'absolute', top: 12, right: 12, color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    )}
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}

        {/* Built-in chatroom list */}
        <div className="section-header">
          <div className="section-title">{userRooms.length > 0 ? 'Community Rooms' : 'Chatrooms'}</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{builtInRooms.length} rooms</span>
        </div>
        <StaggerContainer className="chatroom-list" staggerDelay={0.05}>
          {builtInRooms.map(room => (
            <StaggerItem key={room.id}>
              <motion.div
                className="chatroom-card"
                onClick={() => navigate(`/chat/${room.id}`)}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="chatroom-card-name">
                  <Hash size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: 'var(--accent)', opacity: 0.7 }} />
                  {room.name}
                </div>
                <div className="chatroom-card-desc">{room.description}</div>
                <div className="chatroom-card-meta">
                  <div className="chatroom-online">
                    {Math.floor(room.members * 0.12)} online
                  </div>
                  <span>{room.members.toLocaleString()} members</span>
                </div>
                <ArrowRight size={16} className="chatroom-card-arrow" />
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 480 }}
            >
              <div className="modal-header">
                <div className="modal-title">Create Chatroom</div>
                <button className="modal-close" onClick={() => setShowCreate(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="auth-form">
                  <div className="input-group">
                    <label className="input-label">Room Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. Elden Ring Fans"
                      value={newRoom.name}
                      onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                      maxLength={50}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea
                      className="input"
                      placeholder="What's this room about?"
                      value={newRoom.description}
                      onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
                      maxLength={200}
                      style={{ minHeight: 60 }}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Category</label>
                    <select
                      className="input"
                      value={newRoom.category}
                      onChange={e => setNewRoom({ ...newRoom, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                      ))}
                      <option value="recommendations">Recommendations</option>
                      <option value="spoilers">Spoiler Zone</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Room Color</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {ROOM_COLORS.map(color => (
                        <motion.button
                          key={color}
                          onClick={() => setNewRoom({ ...newRoom, color })}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-full)',
                            background: color, border: newRoom.color === color ? '3px solid var(--text-primary)' : '2px solid transparent',
                            cursor: 'pointer', transition: 'border 0.2s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <motion.button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus size={16} /> Create Room
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 400 }}
            >
              <div className="modal-header">
                <div className="modal-title">Delete Chatroom</div>
                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? All messages in this room will be permanently removed. This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <motion.button
                  className="btn"
                  onClick={confirmDelete}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ background: 'var(--red-400)', color: 'white', border: 'none' }}
                >
                  <Trash2 size={16} /> Delete Room
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
