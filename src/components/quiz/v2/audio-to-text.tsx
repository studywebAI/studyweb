'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause } from 'lucide-react';

export const AudioToTextQuestion = ({ question, onAnswerChange, disabled }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [transcript, setTranscript] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTranscriptChange = (e) => {
        setTranscript(e.target.value);
        onAnswerChange(e.target.value);
    };

    return (
        <div className="space-y-4">
            <audio ref={audioRef} src={question.audio_url} onEnded={() => setIsPlaying(false)} />
            <Button onClick={togglePlay} disabled={disabled}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Textarea
                placeholder="Transcribe the audio here..."
                value={transcript}
                onChange={handleTranscriptChange}
                disabled={disabled}
                className="w-full p-4 text-lg rounded-xl border-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/50 dark:focus:border-primary transition-colors duration-300"
            />
        </div>
    );
};
