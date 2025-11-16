'use client';

import { useState, useTransition, ChangeEvent, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getHint, getExplanation } from '@/app/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, BookText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DragAndDropQuestion } from './drag-and-drop';
import { MatchPairsQuestion } from './match-pairs';
import { ImageLabelingQuestion } from './image-labeling';
import { AudioToTextQuestion } from './audio-to-text';
import { TextToAudioQuestion } from './text-to-audio';
import { CodeOutputQuestion } from './code-output';
import { WhiteboardQuestion } from './whiteboard';

export function QuestionCardV2({ question, onAnswer, mode, isAnswered: isExternallyAnswered }) {
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [isInternallyAnswered, setIsInternallyAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hint, setHint] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [fillInTheBlankAnswers, setFillInTheBlankAnswers] = useState<string[]>([]);
  
  const isAnswered = isExternallyAnswered || isInternallyAnswered;

  useEffect(() => {
    if (question.type === 'fill_in_the_blank') {
      const blankCount = (question.question_text.match(/___/g) || []).length;
      setFillInTheBlankAnswers(Array(blankCount).fill(''));
    }
  }, [question]);

  const handleGetHint = async () => {
    startTransition(async () => {
        const result = await getHint(question);
        if(result.success) setHint(result.content);
    });
  }

  const handleGetExplanation = async () => {
    startTransition(async () => {
        const result = await getExplanation(question, isCorrect, selectedAnswer);
        if(result.success) setExplanation(result.content);
    });
  }

  const handleSubmit = async () => {
    if (selectedAnswer !== null) {
      const result = await onAnswer(selectedAnswer);
      setIsInternallyAnswered(true);
      setIsCorrect(result.is_correct);
    }
  };

  const handleFillInTheBlankChange = (index: number, value: string) => {
    const newAnswers = [...fillInTheBlankAnswers];
    newAnswers[index] = value;
    setFillInTheBlankAnswers(newAnswers);
    setSelectedAnswer({ answers: newAnswers });
  };

  const handleDragAndDropChange = useCallback((answers: any) => {
    setSelectedAnswer({ answers });
  }, []);

  const handleMatchPairsChange = useCallback((pairs: any) => {
    setSelectedAnswer({ pairs });
  }, []);

  const handleImageLabelingChange = useCallback((labels: any) => {
    setSelectedAnswer({ labels });
  }, []);

  const handleAudioToTextChange = useCallback((transcript: string) => {
    setSelectedAnswer({ transcript });
  }, []);

  const handleCodeOutputChange = useCallback((output: string) => {
    setSelectedAnswer({ output });
  }, []);

  const handleWhiteboardChange = useCallback((drawing: any) => {
    setSelectedAnswer({ drawing });
  }, []);

  const renderInput = () => {
    const isDisabled = isAnswered || isPending;
    switch (question.type) {
        case 'multiple_choice':
          return (
            <RadioGroup onValueChange={(value) => setSelectedAnswer({ key: value })} disabled={isDisabled} className="space-y-3">
                {Object.entries(question.answers).map(([key, value], index) => (
                    <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="flex items-center space-x-3"
                    >
                        <RadioGroupItem value={key} id={key} className="peer sr-only" />
                        <Label htmlFor={key} className="w-full flex items-center justify-between px-6 py-4 text-lg font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition-all duration-300 ease-in-out peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary dark:peer-data-[state=checked]:bg-primary/20 dark:peer-data-[state=checked]:text-primary">
                            {value as string}
                        </Label>
                    </motion.div>
                ))}
            </RadioGroup>
          );
        case 'true_false':
            return (
                <RadioGroup onValueChange={(value) => setSelectedAnswer({ is_true: value === 'true' })} disabled={isDisabled} className="space-y-3">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="flex items-center space-x-3">
                        <RadioGroupItem value="true" id="true" className="peer sr-only" />
                        <Label htmlFor="true" className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition-all duration-300 ease-in-out peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary dark:peer-data-[state=checked]:bg-primary/20 dark:peer-data-[state=checked]:text-primary">
                            True
                        </Label>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex items-center space-x-3">
                        <RadioGroupItem value="false" id="false" className="peer sr-only" />
                        <Label htmlFor="false" className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition-all duration-300 ease-in-out peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary dark:peer-data-[state=checked]:bg-primary/20 dark:peer-data-[state=checked]:text-primary">
                            False
                        </Label>
                    </motion.div>
                </RadioGroup>
            );
        case 'open_answer':
            return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Textarea 
                        placeholder="Type your answer here..."
                        onChange={(e) => setSelectedAnswer({ text: e.target.value })}
                        disabled={isDisabled}
                        className="w-full p-4 text-lg rounded-xl border-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/50 dark:focus:border-primary transition-colors duration-300"
                    />
                </motion.div>
            );
        case 'fill_in_the_blank':
            const parts = question.question_text.split('___');
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-wrap items-center justify-center text-lg md:text-xl font-medium">
                {parts.map((part, index) => (
                  <span key={index}>
                    {part}
                    {index < parts.length - 1 && (
                      <Input
                        type="text"
                        value={fillInTheBlankAnswers[index] || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFillInTheBlankChange(index, e.target.value)}
                        disabled={isDisabled}
                        className="inline-block w-32 md:w-48 mx-2 p-2 text-lg rounded-md border-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/50 dark:focus:border-primary transition-colors duration-300"
                      />
                    )}
                  </span>
                ))}
              </motion.div>
            );
        case 'drag_and_drop':
            return <DragAndDropQuestion question={question} onAnswerChange={handleDragAndDropChange} disabled={isDisabled} />;
        case 'match_pairs':
            return <MatchPairsQuestion question={question} onAnswerChange={handleMatchPairsChange} disabled={isDisabled} />;
        case 'image_labeling':
            return <ImageLabelingQuestion question={question} onAnswerChange={handleImageLabelingChange} disabled={isDisabled} />;
        case 'audio_to_text':
            return <AudioToTextQuestion question={question} onAnswerChange={handleAudioToTextChange} disabled={isDisabled} />;
        case 'text_to_audio':
            return <TextToAudioQuestion question={question} disabled={isDisabled} />;
        case 'code_output':
            return <CodeOutputQuestion question={question} onAnswerChange={handleCodeOutputChange} disabled={isDisabled} />;
        case 'whiteboard':
            return <WhiteboardQuestion onAnswerChange={handleWhiteboardChange} disabled={isDisabled} />;
        default:
          return <p className="text-center text-red-500">Unsupported question type.</p>;
      }
  };

  const renderQuestionText = () => {
      if (['fill_in_the_blank', 'drag_and_drop', 'match_pairs', 'image_labeling'].includes(question.type)) {
          return null; 
      }
      return question.question_text;
  }

  return (
    <Card className="w-full max-w-4xl rounded-2xl shadow-lg border-none bg-transparent">
      <CardContent className="p-0 space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <p className="text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">{renderQuestionText()}</p>
        </motion.div>
        {renderInput()}
        {hint && 
            <Alert className="rounded-xl bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700 mt-6">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                <AlertTitle className="font-bold text-blue-800 dark:text-blue-300">Hint</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">{hint}</AlertDescription>
            </Alert>
        }
        {isAnswered && 
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1}} transition={{ duration: 0.5, type: 'spring' }} className="mt-6">
                <Alert variant={isCorrect ? 'default' : 'destructive'} className={`rounded-xl ${isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700' : 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700'}`}>
                    <AlertTitle className={`font-bold ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>{isCorrect ? "Correct!" : "Incorrect"}</AlertTitle>
                    <AlertDescription className={`${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                        {explanation ? explanation : (mode === 'practice' && <Button variant="link" onClick={handleGetExplanation} disabled={isPending} className="p-0 h-auto text-current hover:underline"> {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BookText className="h-4 w-4 mr-2"/> Explain Answer</>}</Button>)}
                    </AlertDescription>
                </Alert>
            </motion.div>
        }
      </CardContent>
      {!isAnswered && 
        <CardFooter className="p-8 flex justify-center">
            <Button onClick={handleSubmit} size="lg" disabled={selectedAnswer === null || isPending} className="rounded-full px-12 py-6 text-xl font-bold shadow-lg hover:shadow-xl transition-shadow duration-300">{isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit"}</Button>
        </CardFooter>
      }
    </Card>
  );
}
