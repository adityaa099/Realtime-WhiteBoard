import React from 'react';

const Toolbar = ({
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    clearBoard,
    onUndo, onRedo,
    onSave,
    canUndo, canRedo
}) => {
    const colors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];

    return (
        <div className="toolbar">
            <div className="tool-group">
                <label>Tools</label>
                <div className="tool-buttons">
                    <button
                        className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
                        onClick={() => setTool('pencil')}
                        title="Pencil"
                    >
                        ✏️ Pen
                    </button>
                    <button
                        className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                        onClick={() => setTool('eraser')}
                        title="Eraser"
                    >
                        🧹 Erase
                    </button>
                </div>
            </div>

            <div className="tool-group">
                <label>Colors</label>
                <div className="color-picker">
                    {colors.map(c => (
                        <button
                            key={c}
                            className={`color-btn ${color === c && tool !== 'eraser' ? 'active' : ''}`}
                            style={{ backgroundColor: c, border: c === '#ffffff' ? '2px solid #e2e8f0' : undefined }}
                            onClick={() => { setColor(c); setTool('pencil'); }}
                            title={c}
                        />
                    ))}
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => { setColor(e.target.value); setTool('pencil'); }}
                        className="color-input"
                        title="Custom color"
                    />
                </div>
            </div>

            <div className="tool-group">
                <label>Size: {brushSize}px</label>
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={e => setBrushSize(parseInt(e.target.value))}
                    className="brush-range"
                />
            </div>

            <div className="tool-group">
                <label>History</label>
                <div className="tool-buttons">
                    <button
                        className="tool-btn"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        style={{ opacity: canUndo ? 1 : 0.4 }}
                    >
                        ↩ Undo
                    </button>
                    <button
                        className="tool-btn"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                        style={{ opacity: canRedo ? 1 : 0.4 }}
                    >
                        ↪ Redo
                    </button>
                </div>
            </div>

            <div className="tool-group">
                <label>Actions</label>
                <div className="tool-buttons">
                    <button
                        className="tool-btn"
                        onClick={onSave}
                        title="Save as PNG"
                    >
                        💾 Save
                    </button>
                    <button
                        className="tool-btn"
                        onClick={clearBoard}
                        style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                        title="Clear board"
                    >
                        🗑 Clear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
