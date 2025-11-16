'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export const TextToAudioQuestion = ({ question, disabled }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(question.text_to_speak);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const cancel = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }

    useEffect(() => {
        return () => {
           cancel(); // Clean up speech synthesis on component unmount
        };
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4">
            <p className="text-lg text-center">Listen to the audio and answer the question.</p>
            <div className="flex items-center space-x-4">
                 <Button onClick={speak} disabled={disabled || isSpeaking}>
                    <Volume2 className="h-6 w-6 mr-2" />
                    Speak
                </Button>
                 <Button onClick={cancel} disabled={disabled || !isSpeaking} variant="destructive">
                    <VolumeX className="h-6 w-6 mr-2" />
                    Stop
                </Button>
            </div>
        </div>
    );
};
