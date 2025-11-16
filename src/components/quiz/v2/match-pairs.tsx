'use client';

import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';

const ItemType = 'pair';

const PairItem = ({ item, onSelect, isSelected, isPaired }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemType,
        item: { id: item.id, type: item.type },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <motion.div
            ref={drag}
            onClick={() => onSelect(item)}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
                opacity: isPaired ? 0.5 : 1, 
                scale: isSelected ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={`p-4 my-2 rounded-lg shadow-md cursor-pointer ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'} ${isPaired ? 'bg-gray-200' : ''} ${isDragging ? 'opacity-50' : ''}`}>
            {item.text}
        </motion.div>
    );
};

export const MatchPairsQuestion = ({ question, onAnswerChange, disabled }) => {
    const [premises, setPremises] = useState(question.premises);
    const [responses, setResponses] = useState(question.responses);
    const [selectedPremise, setSelectedPremise] = useState(null);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [pairs, setPairs] = useState({});

    useEffect(() => {
        if (selectedPremise && selectedResponse) {
            const newPairs = { ...pairs, [selectedPremise.id]: selectedResponse.id };
            setPairs(newPairs);
            onAnswerChange(newPairs);
            setSelectedPremise(null);
            setSelectedResponse(null);
        }
    }, [selectedPremise, selectedResponse, pairs, onAnswerChange]);

    const handleSelect = (item) => {
        if (disabled) return;
        if (item.type === 'premise') {
            setSelectedPremise(item);
        } else {
            setSelectedResponse(item);
        }
    };

    const isPaired = (item) => {
        if (item.type === 'premise') return !!pairs[item.id];
        return Object.values(pairs).includes(item.id);
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold text-lg mb-4">Premises</h3>
                    {premises.map(item => (
                        <PairItem 
                            key={item.id} 
                            item={{...item, type: 'premise'}} 
                            onSelect={handleSelect} 
                            isSelected={selectedPremise?.id === item.id} 
                            isPaired={isPaired({...item, type: 'premise'})} 
                        />
                    ))}
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-4">Responses</h3>
                    {responses.map(item => (
                        <PairItem 
                            key={item.id} 
                            item={{...item, type: 'response'}} 
                            onSelect={handleSelect} 
                            isSelected={selectedResponse?.id === item.id} 
                            isPaired={isPaired({...item, type: 'response'})} 
                        />
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};
