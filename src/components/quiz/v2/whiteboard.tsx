'use client';

import { useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { Button } from '@/components/ui/button';

export const WhiteboardQuestion = ({ onAnswerChange, disabled }) => {
    const canvasRef = useRef(null);

    const handleClear = () => {
        canvasRef.current.clearCanvas();
    };

    const handleUndo = () => {
        canvasRef.current.undo();
    }

    const handleRedo = () => {
        canvasRef.current.redo();
    }

    const handleDrawingChange = async () => {
        const paths = await canvasRef.current.exportPaths();
        onAnswerChange(paths);
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-gray-300 rounded-md overflow-hidden">
                 <ReactSketchCanvas
                    ref={canvasRef}
                    strokeWidth={4}
                    strokeColor="black"
                    onUpdate={handleDrawingChange}
                    canvasColor="white"
                    height="400px"
                    width="100%"
                    disabled={disabled}
                />
            </div>
            <div className="flex justify-center space-x-4">
                <Button onClick={handleUndo} disabled={disabled} variant="outline">Undo</Button>
                <Button onClick={handleRedo} disabled={disabled} variant="outline">Redo</Button>
                <Button onClick={handleClear} disabled={disabled} variant="destructive">Clear</Button>
            </div>
        </div>
    );
};
