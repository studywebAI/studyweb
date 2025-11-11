"use client";

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
import { Switch } from './ui/switch';
import {
  ChevronDown,
  Sparkles,
  Palette,
  AlignLeft,
  ChevronsUpDown,
} from 'lucide-react';
import type { Tool } from './app-container';
import type { SummaryOptions } from './tools/summary-tool';

interface ToolOptionsBarProps {
  activeTool: Tool;
  summaryOptions: SummaryOptions;
  onSummaryOptionsChange: (options: Partial<SummaryOptions>) => void;
}

export function ToolOptionsBar({
  activeTool,
  summaryOptions,
  onSummaryOptionsChange,
}: ToolOptionsBarProps) {
  const renderSummaryOptions = () => (
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
       <Separator orientation="vertical" className="h-8" />
      <div className="flex items-center space-x-2">
        <Switch
          id="animation-switch"
          checked={summaryOptions.animation}
          onCheckedChange={(checked) =>
            onSummaryOptionsChange({ animation: checked })
          }
        />
        <Label htmlFor="animation-switch" className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Animation
        </Label>
      </div>
    </>
  );

  const renderQuizOptions = () => (
    <>
      {/* Placeholder for Quiz options */}
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronsUpDown className="mr-2 h-4 w-4" />
            10 Questions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>5 Questions</DropdownMenuItem>
          <DropdownMenuItem>10 Questions</DropdownMenuItem>
          <DropdownMenuItem>20 Questions</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
  
  const renderFlashcardsOptions = () => (
      <>
      {/* Placeholder for Flashcards options */}
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronsUpDown className="mr-2 h-4 w-4" />
            20 Cards
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>10 Cards</DropdownMenuItem>
          <DropdownMenuItem>20 Cards</DropdownMenuItem>
          <DropdownMenuItem>50 Cards</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );


  return (
    <div className="flex h-16 items-center gap-4 border-b bg-card px-6">
      {activeTool === 'summary' && renderSummaryOptions()}
      {activeTool === 'quiz' && renderQuizOptions()}
      {activeTool === 'flashcards' && renderFlashcardsOptions()}
    </div>
  );
}
