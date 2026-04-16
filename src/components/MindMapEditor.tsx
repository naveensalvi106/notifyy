import { MindMapNode } from '@/types/note';
import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';

interface MindMapEditorProps {
  nodes: MindMapNode[];
  onChange: (nodes: MindMapNode[]) => void;
}

export default function MindMapEditor({ nodes, onChange }: MindMapEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addNode = () => {
    const x = 150 + Math.random() * 200;
    const y = 80 + nodes.length * 60;
    const newNode: MindMapNode = { id: uuidv4(), text: 'New idea', x, y, children: [] };
    onChange([...nodes, newNode]);
    setEditingId(newNode.id);
  };

  const deleteNode = (id: string) => {
    onChange(nodes.filter(n => n.id !== id).map(n => ({ ...n, children: n.children.filter(c => c !== id) })));
  };

  const updateNodeText = (id: string, text: string) => {
    onChange(nodes.map(n => n.id === id ? { ...n, text } : n));
  };

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (connecting) {
      if (connecting !== id) {
        onChange(nodes.map(n => n.id === connecting ? { ...n, children: [...new Set([...n.children, id])] } : n));
      }
      setConnecting(null);
      return;
    }
    e.preventDefault();
    setDragging(id);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onChange(nodes.map(n => n.id === dragging ? { ...n, x, y } : n));
  }, [dragging, nodes, onChange]);

  const handleMouseUp = () => setDragging(null);

  if (nodes.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="font-heading font-bold text-sm text-foreground">Mind Map</h4>
        <button
          onClick={addNode}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-body transition-colors"
        >
          <Plus size={16} /> Start a mind map
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm text-foreground">Mind Map</h4>
        <div className="flex gap-1">
          <button onClick={addNode} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Plus size={14} />
          </button>
          {connecting && <span className="text-xs text-secondary font-body animate-pulse">Click a node to connect</span>}
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full rounded-xl border border-border bg-card/50"
        style={{ height: Math.max(250, nodes.length * 50 + 100) }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {nodes.map(node =>
          node.children.map(childId => {
            const child = nodes.find(n => n.id === childId);
            if (!child) return null;
            return (
              <line
                key={`${node.id}-${childId}`}
                x1={node.x} y1={node.y}
                x2={child.x} y2={child.y}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeOpacity={0.4}
              />
            );
          })
        )}

        {nodes.map(node => (
          <g key={node.id}>
            <rect
              x={node.x - 55} y={node.y - 18}
              width={110} height={36}
              rx={12}
              fill={connecting === node.id ? 'hsl(var(--secondary))' : 'hsl(var(--card))'}
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeOpacity={0.3}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              onDoubleClick={() => setEditingId(node.id)}
            />
            {editingId === node.id ? (
              <foreignObject x={node.x - 50} y={node.y - 12} width={100} height={24}>
                <input
                  autoFocus
                  value={node.text}
                  onChange={e => updateNodeText(node.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                  className="w-full bg-transparent text-xs text-center font-body outline-none"
                  style={{ color: 'hsl(var(--foreground))' }}
                />
              </foreignObject>
            ) : (
              <text
                x={node.x} y={node.y + 4}
                textAnchor="middle"
                className="text-xs font-body pointer-events-none select-none"
                fill="hsl(var(--foreground))"
              >
                {node.text.length > 14 ? node.text.slice(0, 14) + '…' : node.text}
              </text>
            )}
            <g className="opacity-0 hover:opacity-100 transition-opacity">
              <circle
                cx={node.x + 45} cy={node.y - 10} r={8}
                fill="hsl(var(--destructive))" className="cursor-pointer"
                onClick={() => deleteNode(node.id)}
              />
              <text x={node.x + 45} y={node.y - 6} textAnchor="middle" fill="white" className="text-[8px] pointer-events-none">✕</text>
              <circle
                cx={node.x + 45} cy={node.y + 10} r={8}
                fill="hsl(var(--primary))" className="cursor-pointer"
                onClick={() => setConnecting(node.id)}
              />
              <text x={node.x + 45} y={node.y + 14} textAnchor="middle" fill="white" className="text-[8px] pointer-events-none">→</text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
