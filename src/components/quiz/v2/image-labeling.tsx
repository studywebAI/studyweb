'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const ImageLabelingQuestion = ({ question, onAnswerChange, disabled }) => {
    const [answers, setAnswers] = useState({});

    const handleLabelChange = (labelId, value) => {
        const newAnswers = { ...answers, [labelId]: value };
        setAnswers(newAnswers);
        onAnswerChange(newAnswers);
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <img src={question.image_url} alt="Labeling question" className="w-full h-auto rounded-lg" />
            {question.labels.map(label => (
                <motion.div
                    key={label.id}
                    className="absolute" 
                    style={{ top: `${label.y}%`, left: `${label.x}%` }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * label.id }}>
                    <input
                        type="text"
                        placeholder={label.text}
                        onChange={(e) => handleLabelChange(label.id, e.target.value)}
                        disabled={disabled}
                        className="w-32 p-2 text-sm rounded-md border-2 bg-white/80 backdrop-blur-sm border-gray-300 focus:border-primary focus:ring-primary/50 transition-colors duration-300"
                    />
                </motion.div>
            ))}
        </div>
    );
};
