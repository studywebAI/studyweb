
'use client';

import { useState, useEffect } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemType = 'answer';

const DraggableAnswer = ({ answer, index }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemType,
        item: { id: answer.id, index },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`p-4 my-2 rounded-lg shadow-md cursor-grab ${isDragging ? 'opacity-50 bg-blue-100' : 'bg-white'}`}>
            {answer.text}
        </div>
    );
};

const DropTarget = ({ onDrop, children, isOccupied }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemType,
        drop: (item: any) => onDrop(item.id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div ref={drop} className={`p-4 border-2 border-dashed rounded-lg ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} ${isOccupied ? 'bg-green-50' : ''}`}>
            {children}
        </div>
    );
};

export const DragAndDropQuestion = ({ question, onAnswerChange, disabled }) => {
    const [answers, setAnswers] = useState(question.answers);
    const [targets, setTargets] = useState(question.targets);
    const [droppedAnswers, setDroppedAnswers] = useState({});

    const handleDrop = (targetId, answerId) => {
        setDroppedAnswers(prev => ({
            ...prev,
            [targetId]: answerId
        }));
    };

    useEffect(() => {
        onAnswerChange(droppedAnswers);
    }, [droppedAnswers, onAnswerChange]);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold text-lg mb-4">Answers</h3>
                    {answers.map((answer, index) => (
                        <DraggableAnswer key={answer.id} answer={answer} index={index} />
                    ))}
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-4">Targets</h3>
                    {targets.map(target => (
                        <DropTarget key={target.id} onDrop={(answerId) => handleDrop(target.id, answerId)} isOccupied={!!droppedAnswers[target.id]}>
                            {target.text}
                            {droppedAnswers[target.id] && (
                                <div className="mt-2 p-2 bg-green-100 rounded-lg">
                                    {answers.find(a => a.id === droppedAnswers[target.id])?.text}
                                </div>
                            )}
                        </DropTarget>
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};
