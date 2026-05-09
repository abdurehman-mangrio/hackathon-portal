// components/EnhancedTerminal.jsx
import React, { useState, useRef, useEffect } from 'react';

const EnhancedTerminal = ({ challengeId, userId, challengeTitle, onChallengeSolved }) => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const terminalEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll and focus management
    useEffect(() => {
        scrollToBottom();
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [output, isLoading]);

    const scrollToBottom = () => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Initialize terminal
    useEffect(() => {
        setOutput([
            { type: 'system', content: '=== CTF Terminal ===' },
            { type: 'system', content: 'Welcome to the hacking environment!' },
            { type: 'system', content: `Challenge: ${challengeTitle}` },
            { type: 'system', content: 'Type "help" to see available commands' },
            { type: 'system', content: '' }
        ]);
    }, [challengeTitle]);

    const handleCommand = async (cmd) => {
        const command = cmd.trim();
        if (!command) return;

        // Add to history
        setCommandHistory(prev => [command, ...prev]);
        setHistoryIndex(-1);

        // Add user input to output
        setOutput(prev => [...prev, { type: 'input', content: command }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/terminal/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command,
                    challengeId,
                    userId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const newOutput = [{ type: 'output', content: data.output }];
                
                if (data.files && data.files.length > 0) {
                    newOutput.push({ 
                        type: 'files', 
                        content: 'Files in directory:',
                        files: data.files 
                    });
                }
                
                setOutput(prev => [...prev, ...newOutput]);

                if (data.solved) {
                    setOutput(prev => [...prev, 
                        { type: 'success', content: `🎉 Challenge Solved!` },
                        { type: 'success', content: `Flag: ${data.flag}` },
                        { type: 'success', content: `Points: +${data.points}` }
                    ]);
                    onChallengeSolved?.(data.flag, data.points);
                }
            } else {
                setOutput(prev => [...prev, 
                    { type: 'error', content: data.error || 'Command execution failed' }
                ]);
            }
        } catch (error) {
            setOutput(prev => [...prev, 
                { type: 'error', content: `Network error: ${error.message}` }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCommand(input);
    };

    const handleKeyDown = (e) => {
        // Command history with up/down arrows
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        } else if (e.key === 'Enter') {
            handleCommand(input);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Basic tab completion could be added here
        }
    };

    const clearTerminal = () => {
        setOutput([{ type: 'system', content: 'Terminal cleared' }]);
    };

    const getOutputClass = (type) => {
        const baseClasses = "font-mono text-sm mb-1 break-words leading-relaxed";
        switch (type) {
            case 'input':
                return `${baseClasses} text-green-400 font-medium`;
            case 'output':
                return `${baseClasses} text-gray-100`;
            case 'system':
                return `${baseClasses} text-blue-400`;
            case 'success':
                return `${baseClasses} text-green-300 font-bold animate-pulse`;
            case 'error':
                return `${baseClasses} text-red-400`;
            case 'files':
                return `${baseClasses} text-cyan-300`;
            default:
                return `${baseClasses} text-gray-400`;
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-600">
            {/* Terminal Header */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-600">
                <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 cursor-pointer"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 cursor-pointer"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 cursor-pointer"></div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-gray-200 font-semibold text-lg">
                            🚀 CTF Terminal
                        </span>
                        <span className="text-gray-400 text-sm">|</span>
                        <span className="text-cyan-300 text-sm font-medium">
                            {challengeTitle}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={clearTerminal}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                    >
                        Clear
                    </button>
                    <span className="text-gray-400 text-sm font-mono">
                        #{challengeId}
                    </span>
                </div>
            </div>
            
            {/* Terminal Body */}
            <div className="p-6 h-[500px] flex flex-col bg-gray-900">
                {/* Output Area */}
                <div className="flex-1 overflow-y-auto mb-4 pr-2">
                    <div className="space-y-2">
                        {output.map((item, index) => (
                            <div key={index} className={getOutputClass(item.type)}>
                                {item.type === 'input' && (
                                    <span className="text-green-400 mr-3 font-bold">→</span>
                                )}
                                {item.type === 'system' && (
                                    <span className="text-blue-400 mr-3">●</span>
                                )}
                                {item.type === 'error' && (
                                    <span className="text-red-400 mr-3">✗</span>
                                )}
                                {item.type === 'success' && (
                                    <span className="text-green-300 mr-3">✓</span>
                                )}
                                {item.content}
                                {item.files && (
                                    <div className="ml-8 mt-2 space-y-1">
                                        {item.files.map((file, idx) => (
                                            <div key={idx} className="text-cyan-300 flex items-center">
                                                <span className="mr-2">📄</span>
                                                <span className="font-mono">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="text-blue-400 font-mono text-sm flex items-center">
                                <span className="mr-3">⟳</span>
                                <span className="animate-pulse">Executing command...</span>
                            </div>
                        )}
                    </div>
                    <div ref={terminalEndRef} />
                </div>
                
                {/* Input Area */}
                <form onSubmit={handleSubmit} className="flex items-center bg-gray-800 rounded-lg px-4 py-3 border border-gray-600">
                    <span className="text-green-400 font-mono text-sm font-bold mr-3 whitespace-nowrap">
                        ctf@{challengeId}:~$
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-green-400 font-mono text-sm outline-none border-none focus:ring-0 placeholder-gray-500"
                        placeholder={isLoading ? "Processing command..." : "Type command and press Enter..."}
                        spellCheck="false"
                        autoComplete="off"
                        autoCapitalize="off"
                    />
                    {isLoading && (
                        <div className="ml-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                        </div>
                    )}
                </form>

                {/* Quick Help */}
                <div className="mt-3 text-xs text-gray-500 font-mono">
                    💡 Tip: Use ↑↓ arrows for command history • Type 'help' for commands
                </div>
            </div>
        </div>
    );
};

export default EnhancedTerminal;