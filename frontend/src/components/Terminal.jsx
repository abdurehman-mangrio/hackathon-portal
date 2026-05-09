// components/Terminal.jsx
import React, { useState, useRef, useEffect } from 'react';

const Terminal = ({ challengeId, userId, challengeTitle = "Challenge" }) => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const terminalEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [output]);

    // Focus input on mount and when loading finishes
    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    // Initial welcome message
    useEffect(() => {
        setOutput([
            { type: 'system', content: 'Welcome to CTF Terminal! 🚀' },
            { type: 'system', content: 'Type "help" for available commands' },
            { type: 'system', content: `Connected to: ${challengeTitle}` }
        ]);
    }, [challengeTitle]);

    const handleCommand = async (cmd) => {
        const command = cmd.trim();
        if (!command) return;

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
                
                if (data.files) {
                    newOutput.push({ type: 'files', content: data.files, files: data.files });
                }
                
                setOutput(prev => [...prev, ...newOutput]);

                // Check if challenge is solved
                if (data.solved) {
                    setOutput(prev => [...prev, 
                        { type: 'success', content: `🎉 Challenge Solved! Flag: ${data.flag}` }
                    ]);
                }
            } else {
                setOutput(prev => [...prev, 
                    { type: 'error', content: data.error || 'Command failed' }
                ]);
            }
        } catch (error) {
            setOutput(prev => [...prev, 
                { type: 'error', content: `Connection error: ${error.message}` }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCommand(input);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCommand(input);
        }
    };

    const getOutputClass = (type) => {
        const baseClasses = "font-mono text-sm mb-1 break-words";
        switch (type) {
            case 'input':
                return `${baseClasses} text-green-400`;
            case 'output':
                return `${baseClasses} text-white`;
            case 'system':
                return `${baseClasses} text-blue-300`;
            case 'success':
                return `${baseClasses} text-green-300 font-bold`;
            case 'error':
                return `${baseClasses} text-red-400`;
            default:
                return `${baseClasses} text-gray-300`;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-700">
            {/* Terminal Header */}
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-300 text-sm font-medium ml-2">
                        CTF Terminal - {challengeTitle}
                    </span>
                </div>
                <div className="text-gray-400 text-xs">
                    {challengeId}
                </div>
            </div>
            
            {/* Terminal Body */}
            <div className="p-4 h-96 flex flex-col bg-gray-900">
                {/* Output Area */}
                <div className="flex-1 overflow-y-auto mb-3 font-mono text-sm">
                    <div className="space-y-1">
                        {output.map((item, index) => (
                            <div key={index} className={getOutputClass(item.type)}>
                                {item.type === 'input' && (
                                    <span className="text-green-400 mr-2">ctf@challenge:~$</span>
                                )}
                                {item.content}
                                {item.files && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {item.files.map((file, idx) => (
                                            <div key={idx} className="text-cyan-300">
                                                📄 {file}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="text-blue-300 font-mono text-sm mb-1">
                                <span className="animate-pulse">Processing command...</span>
                            </div>
                        )}
                    </div>
                    <div ref={terminalEndRef} />
                </div>
                
                {/* Input Area */}
                <form onSubmit={handleSubmit} className="flex items-center">
                    <span className="text-green-400 font-mono text-sm mr-2 whitespace-nowrap">
                        ctf@challenge:~$
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-green-400 font-mono text-sm outline-none border-none focus:ring-0"
                        placeholder={isLoading ? "Processing..." : "Type your command..."}
                    />
                </form>
            </div>
        </div>
    );
};

export default Terminal;