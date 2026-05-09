import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Terminal as TerminalIcon, 
  Send, 
  Flag, 
  Clock, 
  Cpu, 
  Network,
  Key,
  FileSearch,
  Binary,
  Bug,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Play,
  Square
} from 'lucide-react';

const CTFTerminal = ({ challenge, isOpen, onClose, onChallengeSolved }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  const categories = {
    web: { icon: Network, color: 'text-blue-400', label: 'WEB EXPLOITATION' },
    crypto: { icon: Key, color: 'text-yellow-400', label: 'CRYPTOGRAPHY' },
    forensics: { icon: FileSearch, color: 'text-orange-400', label: 'DIGITAL FORENSICS' },
    pwn: { icon: Binary, color: 'text-purple-400', label: 'BINARY EXPLOITATION' },
    reverse: { icon: Cpu, color: 'text-green-400', label: 'REVERSE ENGINEERING' },
    misc: { icon: Bug, color: 'text-indigo-400', label: 'MISCELLANEOUS' }
  };

  const CategoryIcon = categories[challenge.category]?.icon || TerminalIcon;
  const categoryColor = categories[challenge.category]?.color || 'text-gray-400';

  // Initialize terminal
  useEffect(() => {
    if (isOpen) {
      initializeTerminal();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Scroll to bottom when output changes
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const initializeTerminal = () => {
    setOutput([
      { type: 'system', text: 'Initializing CTF Terminal v2.1.4...' },
      { type: 'system', text: 'Establishing secure connection to challenge server...' },
      { type: 'success', text: 'Connection established successfully' },
      { type: 'info', text: `Target: ${challenge.title}` },
      { type: 'info', text: `Category: ${categories[challenge.category]?.label}` },
      { type: 'info', text: `Difficulty: ${challenge.difficulty.toUpperCase()}` },
      { type: 'info', text: `Points: ${challenge.points}` },
      { type: 'system', text: 'Type "help" for available commands' },
      { type: 'prompt', text: 'Ready for commands...' }
    ]);
    setSessionActive(true);
  };

  const addOutput = (text, type = 'info') => {
    setOutput(prev => [...prev, { type, text, timestamp: new Date().toLocaleTimeString() }]);
  };

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    addOutput(`$ ${command}`, 'command');

    const args = command.trim().split(' ');
    const cmd = args[0].toLowerCase();

    try {
      switch (cmd) {
        case 'help':
          addOutput(`
Available Commands:
┌─────────────────┬─────────────────────────────────┐
│ Command         │ Description                     │
├─────────────────┼─────────────────────────────────┤
│ help            │ Show this help message          │
│ info            │ Show challenge information      │
│ hint            │ Get a challenge hint            │
│ check <flag>    │ Submit flag for verification    │
│ ls              │ List directory contents         │
│ cat <file>      │ Display file content            │
│ connect         │ Connect to challenge service    │
│ status          │ Show current progress           │
│ clear           │ Clear terminal screen           │
└─────────────────┴─────────────────────────────────┘
          `.trim(), 'info');
          break;

        case 'info':
          addOutput(`
Challenge Information:
┌─────────────────┬─────────────────────────────────┐
│ Title           │ ${challenge.title.padEnd(30)} │
├─────────────────┼─────────────────────────────────┤
│ Category        │ ${categories[challenge.category]?.label.padEnd(30)} │
├─────────────────┼─────────────────────────────────┤
│ Difficulty      │ ${challenge.difficulty.toUpperCase().padEnd(30)} │
├─────────────────┼─────────────────────────────────┤
│ Points          │ ${challenge.points.toString().padEnd(30)} │
├─────────────────┼─────────────────────────────────┤
│ Description     │ ${challenge.description.padEnd(30)} │
└─────────────────┴─────────────────────────────────┘
          `.trim(), 'info');
          break;

        case 'hint':
          if (challenge.hint) {
            addOutput(`💡 Hint: ${challenge.hint}`, 'hint');
          } else {
            addOutput('No hints available for this challenge. Try harder!', 'warning');
          }
          break;

        case 'check':
          if (args.length < 2) {
            addOutput('Usage: check <flag>', 'error');
          } else {
            const submittedFlag = args.slice(1).join(' ');
            addOutput('🔍 Verifying flag...', 'system');
            
            // Simulate verification delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (submittedFlag === challenge.flag) {
              addOutput('🎉 FLAG VERIFIED! Challenge completed!', 'success');
              addOutput(`🏆 Points awarded: ${challenge.points}`, 'success');
              onChallengeSolved(challenge.id, challenge.points, submittedFlag);
            } else {
              addOutput('❌ Incorrect flag. Keep searching!', 'error');
            }
          }
          break;

        case 'ls':
          addOutput('Directory contents:', 'info');
          addOutput('drwxr-xr-x 2 root root 4096 flag.txt', 'file');
          addOutput('-rw-r--r-- 1 root root  123 readme.md', 'file');
          addOutput('-rwxr-xr-x 1 root root 2048 challenge.bin', 'file');
          addOutput('drwxr-xr-x 2 root root 4096 src/', 'file');
          break;

        case 'cat':
          if (args.length < 2) {
            addOutput('Usage: cat <filename>', 'error');
          } else {
            const filename = args[1];
            switch (filename) {
              case 'readme.md':
                addOutput(`
# ${challenge.title}

## Challenge Description
${challenge.description}

## Instructions
- Analyze the provided files and services
- Look for vulnerabilities and misconfigurations
- Find the flag in the format: CTF{...}
- Submit using: check CTF{your_flag_here}

## Tips
- Read all documentation carefully
- Check file permissions and configurations
- Look for hidden data and metadata
                `.trim(), 'file-content');
                break;
              case 'flag.txt':
                addOutput('The flag is not in this file. Look elsewhere!', 'warning');
                break;
              default:
                addOutput(`cat: ${filename}: No such file or directory`, 'error');
            }
          }
          break;

        case 'connect':
          addOutput('🌐 Connecting to challenge service...', 'system');
          await new Promise(resolve => setTimeout(resolve, 2000));
          addOutput('✅ Connected to service on port 1337', 'success');
          addOutput('Service is running. Interact with it to find the flag.', 'info');
          break;

        case 'status':
          addOutput(`
Current Session Status:
┌─────────────────┬─────────────────────────────────┐
│ Challenge       │ ${challenge.solved ? 'SOLVED ✓' : 'ACTIVE ⚡'} │
├─────────────────┼─────────────────────────────────┤
│ Time Elapsed    │ ${Math.floor(Math.random() * 60)} minutes      │
├─────────────────┼─────────────────────────────────┤
│ Attempts        │ ${Math.floor(Math.random() * 10) + 1}           │
├─────────────────┼─────────────────────────────────┤
│ Last Activity   │ Just now                        │
└─────────────────┴─────────────────────────────────┘
          `.trim(), 'info');
          break;

        case 'clear':
          setOutput([]);
          break;

        default:
          addOutput(`Command not found: ${cmd}. Type "help" for available commands.`, 'error');
      }
    } catch (error) {
      addOutput(`Error executing command: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      addOutput('Ready for next command...', 'prompt');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      executeCommand(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const getOutputColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'system': return 'text-cyan-400';
      case 'command': return 'text-purple-400';
      case 'hint': return 'text-yellow-300';
      case 'file': return 'text-blue-300';
      case 'file-content': return 'text-gray-300';
      case 'prompt': return 'text-green-300';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-green-500 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl shadow-green-500/20">
        {/* Terminal Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-500/30 bg-gray-800 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full cursor-pointer hover:bg-red-400" onClick={onClose}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
              <span className="font-mono text-sm">CTF_TERMINAL — {challenge.title}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {sessionActive && (
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>ACTIVE</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 overflow-hidden bg-black">
          <div className="h-full overflow-y-auto font-mono text-sm">
            {/* Welcome Banner */}
            <div className="text-center mb-4 p-4 border border-cyan-500 rounded-lg bg-cyan-500 bg-opacity-10">
              <div className="flex items-center justify-center space-x-2 text-cyan-400 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-bold">CYBER ARENA CTF TERMINAL</span>
              </div>
              <div className="text-gray-300 text-xs">
                Secure challenge interface for {challenge.title}
              </div>
            </div>

            {/* Terminal Output */}
            <div className="space-y-1 mb-4">
              {output.map((line, index) => (
                <div key={index} className={`${getOutputColor(line.type)} break-words`}>
                  {line.type === 'prompt' ? (
                    <span className="flex items-center">
                      <span className="text-green-500 mr-2">┌──[cyber@arena]</span>
                      <span className="text-cyan-500 mr-2">[~/challenges/{challenge.category}]</span>
                      <span className="text-yellow-500">$</span>
                    </span>
                  ) : (
                    <>
                      {line.timestamp && (
                        <span className="text-gray-600 text-xs mr-2">[{line.timestamp}]</span>
                      )}
                      {line.text}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <div className="flex items-center text-green-500 flex-shrink-0">
                <span className="mr-2">└─</span>
                <span className="text-yellow-500">$</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isProcessing}
                placeholder={isProcessing ? "Processing..." : "Type your command..."}
                className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-600 font-mono"
                autoFocus
              />
              {isProcessing && (
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </form>

            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="p-3 border-t border-green-500/30 bg-gray-800 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>📡 {challenge.category.toUpperCase()}</span>
              <span>⚡ {challenge.difficulty.toUpperCase()}</span>
              <span>🏆 {challenge.points} POINTS</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>TERMINAL v2.1.4</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTFTerminal;