import User from '../models/User.js'
import Submission from '../models/Submission.js'
import Hint from '../models/Hint.js'
import UserHint from '../models/UserHint.js'
import achievementService from '../services/achievementService.js'
import socketService from '../services/socketService.js'

export const executeCommand = async (command, challenge, user, sessionData = {}) => {
    const args = command.split(' ');
    const cmd = args[0].toLowerCase();

    // Update session data for time tracking
    if (!sessionData.startTime) {
        sessionData.startTime = new Date();
    }

    try {
        switch (cmd) {
            case 'help':
                return await handleHelpCommand();

            case 'ls':
                return await handleLsCommand(challenge);

            case 'cat':
                return await handleCatCommand(args, challenge);

            case 'check':
                return await handleCheckCommand(args, challenge, user, sessionData);

            case 'hint':
                return await handleHintCommand(args, challenge, user);

            case 'pwd':
                return { output: `/challenges/${challenge._id}` };

            case 'clear':
                return { output: '\n'.repeat(50) + 'Terminal cleared' };

            case 'find':
                return await handleFindCommand(args, challenge);

            case 'download':
                return await handleDownloadCommand(args, challenge);

            case 'status':
                return await handleStatusCommand(challenge, user);

            case 'whoami':
                return { output: `You are: ${user.username} (${user.role})` };

            default:
                return { output: `Command not found: ${cmd}. Type 'help' for available commands.` };
        }
    } catch (error) {
        console.error('Command execution error:', error);
        return { output: 'Error executing command' };
    }
};

const handleHelpCommand = async () => {
    return {
        output: `Enhanced CTF Terminal - Available Commands:
┌─────────────────┬─────────────────────────────────────────────────┐
│ Command         │ Description                                     │
├─────────────────┼─────────────────────────────────────────────────┤
│ ls              │ List directory contents                         │
│ cat <file>      │ Display file content                            │
│ find <pattern>  │ Search for files and content                    │
│ check <flag>    │ Submit flag for verification                    │
│ hint [level]    │ Get a challenge hint (levels 1-3)              │
│ download <file> │ Download challenge files                        │
│ status          │ Show challenge progress and stats               │
│ pwd             │ Show current directory                          │
│ whoami          │ Show current user information                   │
│ clear           │ Clear terminal screen                           │
└─────────────────┴─────────────────────────────────────────────────┘
💡 Tip: Use 'hint 1' for the cheapest hint, 'hint 3' for the most helpful!`
    };
};

const handleLsCommand = async (challenge) => {
    try {
        // Enhanced file listing with challenge-specific files
        let mockFiles = ['flag.txt', 'hint.md', 'readme.txt'];
        
        // Add category-specific files
        const categoryFiles = {
            web: ['index.html', 'server.js', 'config.php', 'database.sql'],
            crypto: ['encrypted.txt', 'key.pem', 'cipher.py', 'instructions.md'],
            forensics: ['image.jpg', 'memory.dmp', 'logfile.log', 'packet.pcap'],
            pwn: ['vulnerable', 'source.c', 'exploit.py', 'flag.bin'],
            reverse: ['binary.exe', 'disassembly.txt', 'strings.txt', 'license.key'],
            misc: ['challenge.zip', 'data.csv', 'script.sh', 'output.log']
        };

        mockFiles = [...mockFiles, ...(categoryFiles[challenge.category] || [])];
        
        // Add attachments if any
        if (challenge.attachments && challenge.attachments.length > 0) {
            challenge.attachments.forEach(att => mockFiles.push(att.name));
        }

        return { 
            output: 'Directory contents:',
            files: mockFiles,
            metadata: {
                totalFiles: mockFiles.length,
                category: challenge.category
            }
        };
    } catch (error) {
        return { output: 'Error reading directory' };
    }
};

const handleCatCommand = async (args, challenge) => {
    if (args.length < 2) {
        return { output: 'Usage: cat <filename>' };
    }

    const filename = args[1];
    
    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return { output: 'Invalid filename' };
    }

    // Enhanced file contents with challenge-specific data
    const fileContents = {
        'flag.txt': 'The flag is hidden somewhere... Use your skills to find it!\n\n💡 Hint: The flag format is CTF{...}',
        'hint.md': challenge.hint || 'Look for vulnerabilities in the system.',
        'readme.txt': `Challenge: ${challenge.title}
Category: ${challenge.category}
Difficulty: ${challenge.difficulty}
Points: ${challenge.points}
Solves: ${challenge.solveCount}

Description:
${challenge.description}

Good luck! 🚀`,
        'instructions.md': `# ${challenge.title}

## Challenge Instructions

${challenge.description}

## Flag Format
The flag follows this pattern: CTF{...}

## Tips
- Read all files carefully
- Look for hidden information
- Check file permissions and metadata
- Use appropriate tools for the challenge category`
    };

    // Add category-specific file contents
    const categoryContents = {
        web: {
            'index.html': `<html>
<head><title>${challenge.title}</title></head>
<body>
    <h1>Welcome to ${challenge.title}</h1>
    <p>Look around for vulnerabilities...</p>
    <!-- TODO: Add actual challenge content -->
</body>
</html>`,
            'config.php': `<?php
// Database configuration
$host = 'localhost';
$dbname = 'ctf_challenge';
$username = 'admin';
$password = 'super_secret_password_123';

// TODO: Add actual challenge logic
?>`
        },
        crypto: {
            'encrypted.txt': 'VmxSQ2ExWXlSWGxTYmxKV1lrZFNWRmx0ZUV0WFJteFpZMGh3VjFadGVIcFdNblF3WVd4S2RGVnRNVk5XYlZGNlZqSjRVMkpHYkZWV2JYaFRZbTFvTkZkclpHOVVSbHB5V2taT2FWSnJOWEZWYkZKWFUxWmFkR1ZGT1ZwaVZscElWakkxVDJOc1duUlVibFpYVWpOb2IxbHNWbmRsYkZwWVpVZDBWMVpzY0RCV01XUXdWakZrYzFkdFJsZGhhMXB5V1ZSR2QxWldXbk5YYlVacVRWWndTRll5ZUdGU01rMTVWVzVhYVZKR1NraFdNV2h2VmpGa2MxZHVUbGRXUlVwaFZtMHhNRmxYVFhoVGJrNXFVbTFvVjFsWGRHRmpNV1IwVTJ0a2FsSlhVbGhXYlRGM1V6RlplRk5yYUZaaVdHaHlWV3BHZDJGV1NuUlNiR1JxVFZkU2VsWlhlR0ZaVmxsNVpFaGtWbUpIVW5aV2FrWmhZekZ3UlZWdGFGZGlSMUo2V1RCV1lWZHRWa2RYYms1cFlrWndjRlZ0ZUhkTk1WcDBUVlZrYUZJd1ZqVldWM0JIVmpGT2RGVnNaRmROYWxaUVZqQmtTMUp0U2tkVGJHeFdZbGhvTTFac1kzaE9SMUpHV2taT2FWSnJOVEJXVjNoclZqRmtWMVp1UmxOaVJscFlWVzAxZDJWc1duRlJiR1JwVjBkb2VsWXhaREJUTVZsNFlVWk9XbFpzY0ROV01qVlBZVlpPZEZac1pGaGlSMUp4VldwR1NtVkdUblJoUm1ScFVqRktkbGxWV25kVFJscHpZMGh3VjJKVVJUQldWRVpoVmpGd1JWSnRSbHBpVmxwSVZrZDRhMkZHU25OalJtaGFWak5OZUZadE1UUlpWMFY1Vkd4a1YxWkZXbFZWTW5SaFl6RndSMVp0Um1wTlYxSklWakkxVDFkR1pGaE5WV1JZVWpCd1NWcFZXbXRqYlVWNVZXeGtWMDF1YUZSV2JURTBWakpHUjFOdVRsWmlSa3BoV1ZSS1UxSXhjRWRhUms1WFVsUnNWMVJYY0VkbGJGcFlUVWhvV0dKc1NsaFdiWEJIVlRKS1IyTkhiRk5OYTFwSVZteGtkMlZzV1hoYVJtUlhZbGhDU0ZkV1dtdFhSa3B6WTBac1dtSkhhRlJXUjNoaFpERlplV1JIT1doTlZXdzJWVzAxUTJJeFduTlhia3BxVWxkU1dGUldXbmRYYkZwR1YyeHdXR0V4Y0U5V1Z6RTBWMnhhZEUxWVFsWk5WbHA2VmpKMGExWnRSWHBSYkdoVFlYcFdWRlpyWkRSWlZteFhVMnhXYVZKR2NGbFdNakZHWlVaa2MyRkhhRk5pUjFKMldWUktORmxYVFhsU2EzQm9VakpvVkZsc2FGTlNNV1JIVjJ0b1ZHSlViRmRaVkVwTFpWWmtjbHBIYkZOV1JYQk1WVEo0YjJGR1NuVlJiR2hvVFRCS1dWbFZhR3RrTVZaSFUyeGtUbFp1UWxoV1J6RjNZekZaZUZkdVpGZGlSMUp4VkZaagplZ3BSYXpsWFYyeGtUMVpzVmpWWk1GcExWMjFXUjFwSGJGTmlSWEJZV1ZkNFQxWXdNVmRqUlhSWFRWWndNRnBGV2s5Vk1rcFpZVVpPVjJKR2NGUldha3B2VmpGU2RGTnJaRmRpVkVaVlZGWmFZVmRHU2xWU2JYUlhUV3R3U0ZadGRHRmpWbVJIVjJ4V1YySllVbGxXYlRCM1pVWmFkR1ZIZUdGU2JIQjVXVEJhVjJSSFZrZFRiR3hwVW01Q1dGbFVTazlqTVZwMFpFVTVWbUpHY0ZoWk1HaExWMnhhVlZGdFJscGhNbWh6VlcweE5GWXhXa2RYYmtaVllrWndjRlZ0TlVOak1XUjFWbXhhVjJKSFVubFhhMXB2VmpBeFNHUkdaR2xTYmtKUFZtMHhORll4VW5OWGJsWllVakZ3V0Zsc2FFTlhiRnBWVW14a2FFMVlRalpYVkVKaFdWWlplV1ZIT1ZkTlZYQkpWbTE0YzJGR1NuTlhiR1JxVFZad01GVnRkSGRYUm14V1YyNUdXR0pIVW5wV01uUlhVMFpzY2xwR1pGTmlSbkJaVjFSS05GVXlTa2RUYmxKV1lXdGFURmw2U2tabFJrNTFZVWRvVGxadVFtRldiVEUwWWpGV2MxcEdaRk5OYldoWlZtMHhORll3TVZoVmEyeFhWbnBHU0ZaWE1UUmlNV1JIVjJ0b2JGSllRbGxXYlhoM1lVWktjbUZHY0ZOV1JUVkdWbTE0YTFkR1duRlNiR1JxVFZac05WVnRlR0ZoTURWSFdrWk9UbFp1UWxoV1J6RjNZekZaZUZkdVpGZGlSWEJZV1ZkNFQxWXdNVmRqUlhSWFRWWndNRnBGV2s5Vk1rcFpZVVpPVjJKR2NGUldha3B2VmpGU2RGTnJaRmRpVkVaVlZGWmFZVmRHU2xWU2JYUlhZa2hDV0Zac1kzZGxSazV6V2taa2FWSnNjR2hWYm5CSFl6RndSMXBIYUZOTlYxSllWVEowYTFZeFdYcFJhMlJZWWtkU2IxVnRNVk5YUmxwMFRWaG9VMkpXU2toV1Z6RTBWVzFHY2xOc2FGZGlXR2h5VmpCV1MxWXhXblJTV0doVVlrWktWMVpYTVRCaE1VbDRXa2hPYUZJeWFESldNRnBoWkVkV1IxUnVUbGROVmtwWlZXMTRkMlZzV25STlNHUlhUVlp3TUZWdGRHRmhNa1pIVjI1S1dHSkhhRlJXYlhCTFZqRk9kV0ZHY0ZkTk1tZ3lWbXRhUzFkR1ZuRlJibFpYWWxob00xcFdXbUZqTVdSMVUyeGtWbUpHU2tsV2JYUlRVakZzVjFkdVRsaGlSMUp4VkZaa2V3cFJiemxYVjJ4a1QxWnNWalZaTUZwTFYyMVdSMXBIYkZOaVJYQllXVmQ0VDFZd01WZGpSWFJYVFZad01GcEZXazlWTWtwWllVWk9WMkpHY0ZSV2FrcHZWakZTZEZOclpGZGlWRVpWVkZaYVlWZEdTbFZTYlhSWFlraENXRlpzWTNkbFJrNXpXa1prYVZKc2NHaFZibkJIWXpGd1IxcEhhRk5OVjFKWVZUSjBhMVl4V1hwUmEyUllZa2RTYjFWdE1WTlhSbHAwVFZob1UySldTa2hXVnpFMFZXMUdjRk5zVWxaTlYzaFlXVlJLUzFVeFduUlRXR2hVWWxaS1dWWnRNVFJaVmxwMFRWUkNWMDFyV25sYVJFWmhZekZ3U0dWR1RsVk5WbkJ5VmpKek5WWXlTa2RqU0d4VVltMVNjRlZ0ZUd0T1JteFhWMjVTVGxKc2JETldNblJoVmpKT2RGSnJaRlJpVjNoVVdXeG9iMVpHYkZobFJyaFhZVEpTV0ZscmFFTlpWbHB4VW14a2FWSnJOVmRWYm5BMVZESkdWbFJxVGxwaE1YQnlXVEJXVDJGc1NuVlJiR1JvVFRCS1dsWXhhRTVUTVZsNVUydG9WbUpHY0ZSV2JYQkhVekZrUjJKSVRtaFNWR3hZV1ZkNFYxZEdXbkphUms1WFVsVnNWMVl5ZERSV01rWnpXa1prYVZkRlNsaFdWRW93VmpBeGNtTkZhRlJTV0VKVVZGVmFZV013TlVkWFdHeHFVbXMxYjFWdE1VZFhiRnBZWlVkR1YwMXJXbnBaVlZwUFZqRmtjbHBIZEZkTlJGWktWbGR3UjFVeFpITmlSbVJwVTBaS1dGWnRNSGRsUm1SWFdrVmthMDFzU2toV2JYUlRWa1pzVjFwRVRsZGlSMUo1V1ZSR1UxSXhjRWRhUm1OTFZGYzFVMlF4V2xkWGJtUlhZa2hDV1ZadE1UQlpWbGw0VjI1U2JGSllVbGxXYlhoM1lVWktjbUZHY0ZOV1JUVkdWbTE0YTFkR1duRlNiR1JxVFZac05WVnRlR0ZoTURWSFdrWk9UbFp1UWxoV1J6RjNZekZaZUZkdVpGZGlSWEJZV1ZkNFQxWXdNVmRqUlhSWFRWWndNRnBGV2s5Vk1rcFpZVVpPVjJKR2NGUldha3B2VmpGU2RGTnJaRmRpVk'
        }
    };

    // Merge base contents with category-specific contents
    const allContents = { ...fileContents, ...categoryContents[challenge.category] };

    if (allContents[filename]) {
        return { output: allContents[filename] };
    } else {
        return { output: `File not found: ${filename}` };
    }
};

const handleCheckCommand = async (args, challenge, user, sessionData) => {
    if (args.length < 2) {
        return { output: 'Usage: check <flag>' };
    }

    const submittedFlag = args.slice(1).join(' '); // Handle flags with spaces
    const isCorrect = submittedFlag === challenge.flag;

    try {
        // Check if already solved
        const existingSubmission = await Submission.findOne({
            user: user._id,
            challenge: challenge._id,
            isCorrect: true
        });

        if (existingSubmission) {
            return { output: '✅ Challenge already completed!' };
        }

        // Calculate time spent
        const timeSpent = Math.floor((new Date() - sessionData.startTime) / 1000);

        if (isCorrect) {
            // Update user progress
            if (!user.solvedChallenges.includes(challenge._id)) {
                user.solvedChallenges.push(challenge._id);
                user.score += challenge.points;
                user.updateStreak();
                await user.save();
            }

            // Record successful submission
            const submission = new Submission({
                user: user._id,
                challenge: challenge._id,
                flagSubmitted: submittedFlag,
                isCorrect: true,
                pointsAwarded: challenge.points,
                timeSpent: timeSpent
            });
            await submission.save();

            // Update challenge solve count
            await challenge.updateOne({ $inc: { solveCount: 1 } });

            // Check for achievements
            await achievementService.checkFirstBlood(challenge._id, user._id);
            await achievementService.checkCategoryMaster(user._id, challenge.category);

            // Send notification
            socketService.broadcastChallengeSolve(user, challenge, submission.solveOrder === 1);

            return {
                output: `🎉 Flag verified! Challenge completed!

🏆 Points awarded: ${challenge.points}
⏱️  Time spent: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s
📊 Solve position: #${submission.solveOrder}

Type 'status' to see your updated progress!`,
                solved: true,
                points: challenge.points,
                solveOrder: submission.solveOrder,
                timeSpent: timeSpent
            };
        } else {
            // Record failed attempt
            const submission = new Submission({
                user: user._id,
                challenge: challenge._id,
                flagSubmitted: submittedFlag,
                isCorrect: false
            });
            await submission.save();

            // Update user statistics
            await user.updateOne({ $inc: { 'statistics.totalAttempts': 1 } });

            return { 
                output: '❌ Incorrect flag. Keep searching!\n💡 Use the hint command if you need help.' 
            };
        }
    } catch (error) {
        console.error('Check command error:', error);
        return { output: 'Error processing flag submission' };
    }
};

const handleHintCommand = async (args, challenge, user) => {
    const hintLevel = args.length > 1 ? parseInt(args[1]) : 1;
    
    if (isNaN(hintLevel) || hintLevel < 1 || hintLevel > 3) {
        return { output: 'Usage: hint [level] - where level is 1, 2, or 3' };
    }

    try {
        // Check if hint exists
        const hint = await Hint.findOne({
            challenge: challenge._id,
            level: hintLevel,
            isActive: true
        });

        if (!hint) {
            return { output: `No hint available for level ${hintLevel}` };
        }

        // Check if user already purchased this hint
        const existingUserHint = await UserHint.findOne({
            user: user._id,
            hint: hint._id
        });

        if (existingUserHint) {
            return { 
                output: `Hint #${hintLevel} (Already purchased):\n${hint.content}` 
            };
        }

        // Check if user can afford the hint
        if (user.score < hint.cost) {
            return { 
                output: `Insufficient points! Hint #${hintLevel} costs ${hint.cost} points, but you only have ${user.score}.` 
            };
        }

        // Purchase hint
        const userHint = new UserHint({
            user: user._id,
            hint: hint._id,
            challenge: challenge._id,
            pointsDeducted: hint.cost
        });

        await userHint.save();

        // Deduct points from user
        user.score -= hint.cost;
        await user.save();

        return {
            output: `💡 Hint #${hintLevel} (Cost: ${hint.cost} points):\n${hint.content}\n\nRemaining points: ${user.score}`,
            pointsDeducted: hint.cost,
            newScore: user.score
        };

    } catch (error) {
        console.error('Hint command error:', error);
        return { output: 'Error retrieving hint' };
    }
};

const handleFindCommand = async (args, challenge) => {
    if (args.length < 2) {
        return { output: 'Usage: find <pattern>' };
    }

    const pattern = args.slice(1).join(' ');
    
    // Mock search results
    const searchResults = [
        `Searching for "${pattern}"...`,
        `Found 3 results:`,
        `- /challenges/${challenge._id}/readme.txt (line 5)`,
        `- /challenges/${challenge._id}/instructions.md (line 12)`,
        `- /challenges/${challenge._id}/hidden/secret.txt (line 1)`
    ];

    return { output: searchResults.join('\n') };
};

const handleDownloadCommand = async (args, challenge) => {
    if (args.length < 2) {
        return { output: 'Usage: download <filename>' };
    }

    const filename = args[1];
    
    // Check if file exists in attachments
    if (challenge.attachments && challenge.attachments.some(att => att.name === filename)) {
        return {
            output: `📥 Downloading ${filename}...`,
            download: {
                filename: filename,
                url: `/api/files/download/${challenge._id}/${filename}`,
                message: 'File ready for download'
            }
        };
    } else {
        return { output: `File not found or not available for download: ${filename}` };
    }
};

const handleStatusCommand = async (challenge, user) => {
    try {
        const submissions = await Submission.find({
            user: user._id,
            challenge: challenge._id
        });

        const correctSubmission = submissions.find(sub => sub.isCorrect);
        const attemptCount = submissions.filter(sub => !sub.isCorrect).length;

        const status = correctSubmission ? '✅ SOLVED' : '🔍 IN PROGRESS';
        const pointsInfo = correctSubmission ? 
            `Points earned: ${correctSubmission.pointsAwarded}` : 
            `Potential points: ${challenge.points}`;

        const output = [
            `Challenge: ${challenge.title}`,
            `Status: ${status}`,
            `Category: ${challenge.category}`,
            `Difficulty: ${challenge.difficulty}`,
            pointsInfo,
            `Your attempts: ${attemptCount}`,
            `Total solves: ${challenge.solveCount}`,
            correctSubmission ? `Solved at: ${correctSubmission.createdAt.toLocaleString()}` : 'Keep working on it! 🚀'
        ];

        return { output: output.join('\n') };
    } catch (error) {
        console.error('Status command error:', error);
        return { output: 'Error retrieving status' };
    }
};