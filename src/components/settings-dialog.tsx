'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from './app-provider';
import type { Tool } from './app-provider';
import { Separator } from './ui/separator';

const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
const toolLabels: Record<Tool, string> = {
  summary: 'Summary',
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  answer: 'Answer',
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    globalModel,
    setGlobalModel,
    modelOverrides,
    setModelOverride,
    clearModelOverride,
  } = useApp();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure application settings and model preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Global Model</h3>
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="global-model">Default Model</Label>
              <Select
                value={globalModel}
                onValueChange={(value) => setGlobalModel(value)}
              >
                <SelectTrigger id="global-model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              This model will be used for all tasks unless overridden below.
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold">Tool Specific Models</h3>
            <p className="text-xs text-muted-foreground">
              Optionally, select a different model for a specific tool.
            </p>
            <div className="space-y-4">
              {(Object.keys(toolLabels) as Tool[]).map((tool) => (
                <div
                  key={tool}
                  className="grid grid-cols-2 items-center gap-4"
                >
                  <Label htmlFor={`model-${tool}`}>{toolLabels[tool]}</Label>
                  <Select
                    value={modelOverrides[tool] || 'global'}
                    onValueChange={(value) => {
                      if (value === 'global') {
                        clearModelOverride(tool);
                      } else {
                        setModelOverride(tool, value);
                      }
                    }}
                  >
                    <SelectTrigger id={`model-${tool}`}>
                      <SelectValue placeholder="Use global default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        Use global default ({globalModel})
                      </SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
