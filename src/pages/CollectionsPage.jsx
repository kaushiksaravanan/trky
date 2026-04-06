import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORY_LABELS } from '../data/sampleData';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { toast } from '../components/ui/Toast';
import {
  Plus, FolderOpen, Trash2, X, Star, ChevronRight,
  Heart, Bookmark, Trophy, Flame, Sparkles, ListOrdered, Library, Layers,
} from 'lucide-react';

const COLLECTION_ICONS = [
  { name: 'heart', icon: Heart, label: 'Heart' },
  { name: 'bookmark', icon: Bookmark, label: 'Bookmark' },
  { name: 'trophy', icon: Trophy, label: 'Trophy' },
  { name: 'flame', icon: Flame, label: 'Flame' },
  { name: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { name: 'list', icon: ListOrdered, label: 'List' },
  { name: 'library', icon: Library, label: 'Library' },
  { name: 'layers', icon: Layers, label: 'Layers' },
];

const COLLECTION_COLORS = [
  '#ec4899', '#f43f5e', '#f59e0b', '#34d399', '#60a5fa', '#8b5cf6', '#a78bfa', '#f87171',
];

function getIconComponent(iconName) {
  const found = COLLECTION_ICONS.find(i => i.name === iconName);
  return found ? found.icon : FolderOpen;
}

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getUserCollections, createCollection, deleteCollection, removeFromCollection } = useCollectionStore();
  const { getMediaById } = useTrackingStore();

  const collections = getUserCollections(currentUser?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#ec4899');
  const [newIcon, setNewIcon] = useState('heart');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCollection(currentUser.id, {
      name: newName.trim(),
      description: newDesc.trim(),
      color: newColor,
      icon: newIcon,
    });
    toast.success(`Collection "${newName.trim()}" created!`);
    setNewName('');
    setNewDesc('');
    setNewColor('#ec4899');
    setNewIcon('heart');
    setShowCreate(false);
  };

  const handleDelete = (collectionId, name) => {
    deleteCollection(currentUser.id, collectionId);
    toast.info(`"${name}" deleted`);
    if (expandedId === collectionId) setExpandedId(null);
  };

  const handleRemoveItem = (collectionId, mediaId) => {
    removeFromCollection(currentUser.id, collectionId, mediaId);
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">
          <FolderOpen size={24} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
          Collections
        </div>
        <div className="page-subtitle">
          Organize your media into custom lists -- {collections.length} collection{collections.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 700 }}>
        {/* Create button */}
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ marginBottom: 20 }}
        >
          <Plus size={18} /> New Collection
        </motion.button>

        {/* Create modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              className="card"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Create Collection</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Top 10 Anime, Weekend Binge..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    maxLength={50}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Description (optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="What's this collection about?"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Icon</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {COLLECTION_ICONS.map(({ name, icon: Icon, label }) => (
                      <motion.button
                        key={name}
                        onClick={() => setNewIcon(name)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        title={label}
                        style={{
                          width: 36, height: 36, borderRadius: 'var(--radius-md)',
                          border: newIcon === name ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                          background: newIcon === name ? 'var(--accent-soft)' : 'var(--bg-input)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: newIcon === name ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                      >
                        <Icon size={16} />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Color</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {COLLECTION_COLORS.map(color => (
                      <motion.button
                        key={color}
                        onClick={() => setNewColor(color)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          width: 28, height: 28, borderRadius: 'var(--radius-full)',
                          background: color,
                          border: newColor === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <motion.button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Collection
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collections list */}
        {collections.length > 0 ? (
          <StaggerContainer staggerDelay={0.05}>
            {collections.map((collection) => {
              const Icon = getIconComponent(collection.icon);
              const isExpanded = expandedId === collection.id;

              return (
                <StaggerItem key={collection.id}>
                  <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
                    {/* Collection header */}
                    <motion.div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                        padding: '4px 0',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : collection.id)}
                      whileHover={{ x: 2 }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-md)',
                        background: `${collection.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={20} style={{ color: collection.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{collection.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {collection.items.length} item{collection.items.length !== 1 ? 's' : ''}
                          {collection.description ? ` -- ${collection.description}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <motion.button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => { e.stopPropagation(); handleDelete(collection.id, collection.name); }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ color: 'var(--text-muted)', padding: 6 }}
                          title="Delete collection"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Expanded items */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 12, paddingTop: 12 }}>
                            {collection.items.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {collection.items.map((mediaId, index) => {
                                  const item = getMediaById(mediaId);
                                  if (!item) return null;
                                  return (
                                    <motion.div
                                      key={mediaId}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                      }}
                                      whileHover={{ background: 'var(--bg-hover)', x: 2 }}
                                      onClick={() => navigate(`/media/${mediaId}`)}
                                    >
                                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>
                                        {index + 1}
                                      </span>
                                      <img
                                        src={item.cover}
                                        alt=""
                                        style={{ width: 30, height: 40, borderRadius: 4, objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{CATEGORY_LABELS[item.category]}</div>
                                      </div>
                                      {item.rating > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12 }}>
                                          <Star size={12} fill="#fbbf24" color="#fbbf24" />
                                          {item.rating}
                                        </div>
                                      )}
                                      <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveItem(collection.id, mediaId); }}
                                        style={{ padding: 4, color: 'var(--text-muted)' }}
                                        title="Remove from collection"
                                      >
                                        <X size={12} />
                                      </button>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                                No items yet. Add titles from the media detail page.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon-row">
              <span className="empty-float-icon" style={{ animationDelay: '0s' }}>📚</span>
              <span className="empty-float-icon" style={{ animationDelay: '0.5s' }}>🎬</span>
              <span className="empty-float-icon" style={{ animationDelay: '1s' }}>🎮</span>
            </div>
            <div className="empty-state-title">No Collections Yet</div>
            <div className="empty-state-text">
              Create custom lists to organize your favorite media. Try "Top 10 Anime" or "Weekend Binge"!
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
