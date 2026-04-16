import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X, ChevronRight, ChevronDown, MessageSquare, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MindMapNode } from '@/types/note';


const branchColors = [
  'hsl(210, 70%, 55%)',   // blue
  'hsl(25, 90%, 55%)',    // orange
  'hsl(160, 50%, 45%)',   // teal
  'hsl(340, 60%, 55%)',   // pink
  'hsl(270, 50%, 55%)',   // purple
  'hsl(45, 85%, 50%)',    // amber
  'hsl(140, 50%, 45%)',   // green
  'hsl(0, 65%, 55%)',     // red
];

function getColor(depth: number, index: number) {
  return branchColors[(depth + index) % branchColors.length];
}

interface NodeItemProps {
  node: MindMapNode;
  depth: number;
  index: number;
  onUpdate: (updated: MindMapNode) => void;
  onDelete: () => void;
  isRoot?: boolean;
}

function NodeItem({ node, depth, index, onUpdate, onDelete, isRoot }: NodeItemProps) {
  const [editing, setEditing] = useState(!node.text);
  const [editingDesc, setEditingDesc] = useState(false);
  const [showDesc, setShowDesc] = useState(!!node.description);
  const color = node.color || getColor(depth, index);
  const hasChildren = node.children.length > 0;

  const addChild = () => {
    const childColor = getColor(depth + 1, node.children.length);
    const newChild: MindMapNode = {
      id: uuidv4(),
      text: '',
      description: '',
      children: [],
      collapsed: false,
      color: childColor,
    };
    onUpdate({ ...node, children: [...node.children, newChild], collapsed: false });
  };

  const updateChild = (childId: string, updated: MindMapNode) => {
    onUpdate({ ...node, children: node.children.map(c => c.id === childId ? updated : c) });
  };

  const deleteChild = (childId: string) => {
    onUpdate({ ...node, children: node.children.filter(c => c.id !== childId) });
  };

  const toggleCollapse = () => {
    if (hasChildren) onUpdate({ ...node, collapsed: !node.collapsed });
  };

  return (
    <div className="relative">
      <div className="flex items-start gap-0">
        {/* Vertical branch line for non-root */}
        {!isRoot && (
          <div className="flex items-center flex-shrink-0 mt-3">
            <div className="w-6 h-px" style={{ backgroundColor: color, opacity: 0.4 }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Node card */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex items-center gap-1.5"
          >
            {/* Collapse toggle */}
            {hasChildren ? (
              <button
                onClick={toggleCollapse}
                className="w-5 h-5 flex items-center justify-center rounded flex-shrink-0 hover:bg-foreground/5 transition-colors"
              >
                {node.collapsed
                  ? <ChevronRight size={14} style={{ color }} />
                  : <ChevronDown size={14} style={{ color }} />
                }
              </button>
            ) : (
              <div className="w-5" />
            )}

            {/* Node pill */}
            <div
              className="rounded-xl px-3 py-1.5 min-w-[80px] max-w-[260px] flex items-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
              style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}33` }}
              onClick={() => setEditing(true)}
            >
              {editing ? (
                <input
                  autoFocus
                  value={node.text}
                  onChange={e => onUpdate({ ...node, text: e.target.value })}
                  onBlur={() => setEditing(false)}
                  onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); if (!node.text.trim()) onUpdate({ ...node, text: 'New idea' }); } }}
                  placeholder="Type here..."
                  className="bg-transparent text-sm font-heading font-bold outline-none w-full min-w-[60px] placeholder:opacity-50"
                  style={{ color: '#fff' }}
                />
              ) : (
                <span className="text-sm font-heading font-bold truncate" style={{ color: '#fff' }}>
                  {node.text || 'New idea'}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={addChild}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-foreground/5"
                title="Add branch"
              >
                <Plus size={14} style={{ color }} />
              </button>
              <button
                onClick={() => { setShowDesc(!showDesc); if (!showDesc) setEditingDesc(true); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-foreground/5"
                title="Add description"
              >
                <MessageSquare size={12} className="text-muted-foreground" />
              </button>
              {!isRoot && (
                <button
                  onClick={onDelete}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-destructive/10"
                  title="Delete"
                >
                  <X size={12} className="text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Description */}
          <AnimatePresence>
            {showDesc && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="ml-5 mt-1 mb-1">
                  {editingDesc ? (
                    <textarea
                      autoFocus
                      value={node.description}
                      onChange={e => onUpdate({ ...node, description: e.target.value })}
                      onBlur={() => setEditingDesc(false)}
                      placeholder="Add a description..."
                      rows={2}
                      className="w-full max-w-[240px] text-xs font-body bg-foreground/5 rounded-lg px-2.5 py-1.5 outline-none resize-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20 text-foreground"
                    />
                  ) : (
                    <p
                      className="text-xs font-body text-muted-foreground max-w-[240px] cursor-pointer hover:text-foreground transition-colors px-1"
                      onClick={() => setEditingDesc(true)}
                    >
                      {node.description || 'Click to add description...'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Children */}
          <AnimatePresence>
            {!node.collapsed && hasChildren && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-4 mt-0.5 border-l-2 pl-0 space-y-0.5 overflow-hidden"
                style={{ borderColor: `${color}30` }}
              >
                {node.children.map((child, ci) => (
                  <NodeItem
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    index={ci}
                    onUpdate={(updated) => updateChild(child.id, updated)}
                    onDelete={() => deleteChild(child.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Conversion helpers between flat MindMapNode[] (old) and tree MindMapNode (new)
interface MindMapEditorProps {
  nodes: MindMapNode[];
  onChange: (nodes: MindMapNode[]) => void;
}

export default function MindMapEditor({ nodes, onChange }: MindMapEditorProps) {
  // We store the tree as a single root node array
  // Each node in the array is a root-level branch

  const addRootNode = () => {
    const color = getColor(0, nodes.length);
    const newNode: MindMapNode = {
      id: uuidv4(),
      text: '',
      description: '',
      children: [],
      collapsed: false,
      color,
    };
    onChange([...nodes, newNode]);
  };

  const updateNode = (id: string, updated: MindMapNode) => {
    onChange(nodes.map(n => n.id === id ? updated : n));
  };

  const deleteNode = (id: string) => {
    onChange(nodes.filter(n => n.id !== id));
  };

  if (nodes.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <GitBranch size={16} className="text-primary" /> Mind Map
        </h4>
        <button
          onClick={addRootNode}
          className="flex items-center gap-2.5 w-full px-4 py-3 rounded-2xl border border-dashed border-primary/30 text-sm text-primary hover:bg-primary/5 font-body font-semibold transition-all"
        >
          <Plus size={16} /> Start a mind map
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <GitBranch size={16} className="text-primary" /> Mind Map
        </h4>
        <button
          onClick={addRootNode}
          className="flex items-center gap-1.5 text-xs font-body font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
        >
          <Plus size={14} /> Add branch
        </button>
      </div>

      <div className="space-y-1 rounded-2xl border border-border bg-card/50 p-3 overflow-x-auto">
        {nodes.map((node, i) => (
          <NodeItem
            key={node.id}
            node={node}
            depth={0}
            index={i}
            onUpdate={(updated) => updateNode(node.id, updated)}
            onDelete={() => deleteNode(node.id)}
            isRoot
          />
        ))}
      </div>
    </div>
  );
}
