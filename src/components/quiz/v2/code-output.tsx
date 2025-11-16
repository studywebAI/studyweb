
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CodeOutputQuestion = ({ question, onAnswerChange, disabled }) => {
    const [output, setOutput] = useState('');

    const handleOutputChange = (e) => {
        setOutput(e.target.value);
        onAnswerChange(e.target.value);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>What is the output of this code?</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-gray-800 text-white p-4 rounded-md">
                        <code>
                            {question.code}
                        </code>
                    </pre>
                </CardContent>
            </Card>
            <Textarea
                placeholder="Enter the output here..."
                value={output}
                onChange={handleOutputChange}
                disabled={disabled}
                className="w-full p-4 text-lg rounded-xl border-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/50 dark:focus:border-primary transition-colors duration-300"
            />
        </div>
    );
};
