import { useEffect, useRef, useState } from 'react';

export const useDraw = (onDraw) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);
    const prevPoint = useRef(null);

    const onMouseDown = () => setIsDrawing(true);

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    useEffect(() => {
        const handler = (e) => {
            if (!isDrawing) return;
            const currentPoint = computePointInCanvas(e);
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx || !currentPoint) return;

            onDraw({ ctx, currentPoint, prevPoint: prevPoint.current });
            prevPoint.current = currentPoint;
        };

        const mouseUpHandler = () => {
            setIsDrawing(false);
            prevPoint.current = null;
        };

        const canvas = canvasRef.current;

        // Mouse Events
        canvas?.addEventListener('mousemove', handler);
        window.addEventListener('mouseup', mouseUpHandler);

        // Touch Events for mobile
        canvas?.addEventListener('touchmove', (e) => {
            // e.preventDefault();
            handler(e.touches[0]);
        }, { passive: false });
        window.addEventListener('touchend', mouseUpHandler);

        return () => {
            canvas?.removeEventListener('mousemove', handler);
            window.removeEventListener('mouseup', mouseUpHandler);
            canvas?.removeEventListener('touchmove', handler);
            window.removeEventListener('touchend', mouseUpHandler);
        };
    }, [onDraw, isDrawing]);

    const computePointInCanvas = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return { x, y };
    };

    return { canvasRef, onMouseDown, clear };
};
