'use client';

import React from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  ChevronDown,
  Sparkles,
  Palette,
  AlignLeft,
  ChevronsUpDown,
} from 'lucide-react';
import type { Tool } from './app-provider';

export interface SummaryOptions {
  detailLevel: number;
  format: 'paragraphs' | 'bullets';
  tone: 'concise' | 'detailed' | 'explanatory';
  animation: boolean;
}

export interface QuizOptions {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FlashcardOptions {
  cardCount: number;
}


interface ToolOptionsBarProps {
  activeTool: Tool;
  summaryOptions?: SummaryOptions;
  onSummaryOptionsChange?: (options: Partial<SummaryOptions>) => void;
  quizOptions?: QuizOptions;
  onQuizOptionsChange?: (options: Partial<QuizOptions>) => void;
  flashcardOptions?: FlashcardOptions;
  onFlashcardOptionsChange?: (options: Partial<FlashcardOptions>) => void;
}

export function ToolOptionsBar({
  activeTool,
  summaryOptions,
  onSummaryOptionsChange,
  quizOptions,
  onQuizOptionsChange,
  flashcardOptions,
  onFlashcardOptionsChange,
}: ToolOptionsBarProps) {
  const renderSummaryOptions = () =>
    summaryOptions &&
    onSummaryOptionsChange && (
      <>
        <div>
          <Label htmlFor="detail-level" className="text-xs font-medium">
            Detail Level
          </Label>
          <Slider
            id="detail-level"
            min={1}
            max={5}
            step={1}
            value={[summaryOptions.detailLevel]}
            onValueChange={([value]) =>
              onSummaryOptionsChange({ detailLevel: value })
            }
            className="w-32"
          />
        </div>
        <Separator orientation="vertical" className="h-8" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <AlignLeft className="mr-2 h-4 w-4" />
              {summaryOptions.format}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => onSummaryOptionsChange({ format: 'paragraphs' })}
            >
              Paragraphs
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSummaryOptionsChange({ format: 'bullets' })}
            >
              Bullets
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="vertical" className="h-8" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Palette className="mr-2 h-4 w-4" />
              {summaryOptions.tone}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => onSummaryOptionsChange({ tone: 'concise' })}
            >
              Concise
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSummaryOptionsChange({ tone: 'detailed' })}
            >
              Detailed
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSummaryOptionsChange({ tone: 'explanatory' })}
            >
              Explanatory
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );

  const renderQuizOptions = () =>
    quizOptions &&
    onQuizOptionsChange && (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              {quizOptions.questionCount} Questions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => onQuizOptionsChange({ questionCount: 5 })}
            >
              5 Questions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onQuizOptionsChange({ questionCount: 10 })}
            >
              10 Questions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onQuizOptionsChange({ questionCount: 20 })}
            >
              20 Questions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );

  const renderFlashcardsOptions = () =>
    flashcardOptions &&
    onFlashcardOptionsChange && (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              {flashcardOptions.cardCount} Cards
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => onFlashcardOptionsChange({ cardCount: 10 })}
            >
              10 Cards
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFlashcardOptionsChange({ cardCount: 20 })}
            >
              20 Cards
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFlashcardOptionsChange({ cardCount: 50 })}
            >
              50 Cards
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );

  const renderContent = () => {
    switch (activeTool) {
      case 'summary':
        return renderSummaryOptions();
      case 'quiz':
        return renderQuizOptions();
      case 'flashcards':
        return renderFlashcardsOptions();
      default:
        return null;
    }
  }

  return (
    <div className="flex h-16 items-center gap-4 border-b bg-card px-6">
      {renderContent()}
    </div>
  );
}
