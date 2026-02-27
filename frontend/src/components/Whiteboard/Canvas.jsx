import React, { useEffect, useCallback, forwardRef, useRef } from 'react';
import { useDraw } from '../../hooks/useDraw';

const Canvas = forwardRef(({ socket, roomId, color, brushSize, tool, drawHistory, setDrawHistory, setUndoneActions }, forwardedRef) => {

    const historyRef = useRef(drawHistory);
    historyRef.current = drawHistory;

    const drawLine = useCallback(({ currentPoint, prevPoint, color: lineColor, brushSize: lineSize }) => {
        const canvas = canvasRefInternal.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const startPoint = prevPoint ?? currentPoint;

        ctx.beginPath();
        ctx.lineWidth = lineSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = lineColor;
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
    }, []);

    // Internal ref for canvas element
    const canvasRefInternal = useRef(null);

    const redrawAll = useCallback((actions) => {
        const canvas = canvasRefInternal.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        actions.forEach(action => drawLine(action));
    }, [drawLine]);

    const onDraw = useCallback(({ currentPoint, prevPoint }) => {
        const action = {
            currentPoint,
            prevPoint,
            color: tool === 'eraser' ? '#FFFFFF' : color,
            brushSize: tool === 'eraser' ? brushSize * 2 : brushSize,
            tool
        };

        drawLine(action);

        const newHistory = [...historyRef.current, action];
        setDrawHistory(newHistory);
        setUndoneActions([]);

        if (socket) {
            socket.emit('draw-action', { roomId, action });
        }
    }, [color, brushSize, tool, socket, roomId, drawLine, setDrawHistory, setUndoneActions]);

    const { canvasRef, onMouseDown } = useDraw(onDraw);

    // Sync internal ref
    canvasRefInternal.current = canvasRef.current;

    // Forward the canvas ref to parent (for Save & Recording)
    React.useImperativeHandle(forwardedRef, () => canvasRef.current);

    // Initialize canvas with white background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvasRefInternal.current = canvas;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [canvasRef]);

    // Redraw when drawHistory changes (triggered by undo/redo/clear)
    useEffect(() => {
        redrawAll(drawHistory);
    }, [drawHistory, redrawAll]);

    // Socket listeners for remote actions
    useEffect(() => {
        if (!socket) return;

        const handleRemoteDraw = (action) => {
            drawLine(action);
            setDrawHistory(prev => [...prev, action]);
        };

        const handleRemoteUndo = ({ history: remoteHistory }) => {
            setDrawHistory(remoteHistory);
        };

        const handleClearBoard = () => {
            setDrawHistory([]);
            setUndoneActions([]);
        };

        socket.on('draw-action', handleRemoteDraw);
        socket.on('undo-action', handleRemoteUndo);
        socket.on('clear-board', handleClearBoard);

        return () => {
            socket.off('draw-action', handleRemoteDraw);
            socket.off('undo-action', handleRemoteUndo);
            socket.off('clear-board', handleClearBoard);
        };
    }, [socket, drawLine, setDrawHistory, setUndoneActions]);

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
            width={1200}
            height={800}
            className={`whiteboard-canvas cursor-${tool}`}
        />
    );
});

export default Canvas;
