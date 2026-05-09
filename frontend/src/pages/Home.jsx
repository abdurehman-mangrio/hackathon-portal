import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analyticsService';
import {
  Terminal,
  Users,
  Flag,
  Award,
  Clock,
  Shield,
  Zap,
  Lock,
  Server,
  Network,
  Binary,
  FileSearch,
  Key,
  Bug,
  Cpu,
  Eye,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Loader
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const [terminalText, setTerminalText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));

  // Terminal typing effect
  useEffect(() => {
    const fullText = "cyber-arena@ctf:~$ initialize_system --mode=competition";
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTerminalText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  // Fetch analytics data and recent activity
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [overviewData, activityData] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getRecentActivity(10)
        ]);

        setAnalyticsData(overviewData);
        setRecentActivity(activityData.map(activity => ({
          user: activity.user?.username || 'Unknown',
          action: activity.action || 'performed action',
          challenge: activity.challenge?.name || 'Unknown Challenge',
          time: new Date(activity.timestamp).toLocaleString(),
          points: activity.challenge?.points ? `+${activity.challenge.points}` : '+0'
        })));
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setError('Failed to load analytics data');
        // Fallback to static data if API fails
        setRecentActivity([
          { user: 'ne0n', action: 'solved Crypto-100', time: '2 min ago', points: '+100' },
          { user: 'ph0b0s', action: 'solved Web-200', time: '5 min ago', points: '+200' },
          { user: 'zer0c00l', action: 'solved Forensics-150', time: '8 min ago', points: '+150' },
          { user: 'dark_side', action: 'solved Binary-300', time: '12 min ago', points: '+300' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const features = [
    {
      icon: Network,
      title: 'NETWORK PENETRATION',
      description: 'Infiltrate secure networks and bypass enterprise security systems.',
      color: 'from-green-500 to-cyan-500',
      command: 'nmap --stealth',
      difficulty: 'MEDIUM-HARD',
      points: 200
    },
    {
      icon: Binary,
      title: 'BINARY REVERSING',
      description: 'Decompile and analyze malicious software for vulnerabilities.',
      color: 'from-purple-500 to-pink-500',
      command: 'objdump -M intel',
      difficulty: 'HARD',
      points: 300
    },
    {
      icon: FileSearch,
      title: 'DIGITAL FORENSICS',
      description: 'Recover and analyze digital evidence from compromised systems.',
      color: 'from-orange-500 to-red-500',
      command: 'foremost -t all',
      difficulty: 'MEDIUM',
      points: 150
    },
    {
      icon: Key,
      title: 'CRYPTOGRAPHY',
      description: 'Break encryption schemes and decrypt classified communications.',
      color: 'from-yellow-500 to-amber-500',
      command: 'openssl rsautl -decrypt',
      difficulty: 'EASY-MEDIUM',
      points: 100
    },
    {
      icon: Bug,
      title: 'WEB EXPLOITATION',
      description: 'Find and exploit vulnerabilities in web applications and APIs.',
      color: 'from-blue-500 to-indigo-500',
      command: 'sqlmap -u target',
      difficulty: 'MEDIUM',
      points: 250
    },
    {
      icon: Cpu,
      title: 'SYSTEM HACKING',
      description: 'Gain root access and maintain persistence on target systems.',
      color: 'from-red-500 to-pink-500',
      command: 'metasploit exploit',
      difficulty: 'HARD',
      points: 400
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'ESTABLISH CONNECTION',
      description: 'Authenticate and gain system access',
      command: 'ssh ctf@cyber-arena.io'
    },
    {
      step: '02',
      title: 'ANALYZE TARGETS',
      description: 'Select and recon challenge objectives',
      command: './recon --target all'
    },
    {
      step: '03',
      title: 'EXPLOIT VULNERABILITIES',
      description: 'Execute precision attacks on systems',
      command: 'msfconsole -q'
    },
    {
      step: '04',
      title: 'MAINTAIN ACCESS',
      description: 'Submit flags and track persistence',
      command: 'echo $FLAG > /tmp/persistence'
    }
  ];

  const liveStats = [
    { icon: Users, value: analyticsData?.activeUsers || 1247, label: 'ACTIVE HACKERS', change: '+2.4%' },
    { icon: Flag, value: analyticsData?.totalSubmissions || 2843, label: 'CHALLENGES SOLVED', change: '+12' },
    { icon: Award, value: '24/7', label: 'UPTIME', change: '100%' },
    { icon: Clock, value: currentTime, label: 'SERVER TIME', change: 'UTC+0' }
  ];

  const sponsors = [
    { name: 'CYBER_SEC INC', tier: 'PLATINUM' },
    { name: 'SECURE_TECH', tier: 'GOLD' },
    { name: 'HACK_LABS', tier: 'SILVER' },
    { name: 'BYTE_GUARD', tier: 'BRONZE' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-6xl mx-auto text-center">
          {/* Terminal Box */}
          <div className="bg-black border border-green-500 rounded-lg p-6 mb-8 max-w-2xl mx-auto shadow-2xl shadow-green-500/10">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="text-green-400 text-sm ml-2 font-mono">cyber-arena.ctf -- bash</div>
            </div>
            <div className="font-mono text-green-400 text-left">
              <div className="flex items-center">
                <span className="text-cyan-400">└──╼ </span>
                <span className="text-white ml-1">$ </span>
                <span className="ml-1">{terminalText}</span>
                {isTyping && <span className="ml-1 animate-pulse">▋</span>}
              </div>
              
              {!isTyping && (
                <div className="mt-4 space-y-1 text-green-300 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400">[+]</span>
                    <span>System initialized successfully</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400">[+]</span>
                    <span>Security protocols: ACTIVE</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400">[+]</span>
                    <span>Challenge database: ONLINE</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            CYBER_ARENA_CTF
          </h1>
          
          <p className="text-xl text-green-300 mb-8 max-w-2xl mx-auto font-mono">
            <span className="text-cyan-400">&gt;&gt;</span> PENETRATION TESTING PLATFORM
            <span className="text-cyan-400"> &lt;&lt;</span>
            <br />
            Advanced cybersecurity challenges for elite operators
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link
                  to="/challenges"
                  className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-105 border border-green-400 shadow-lg shadow-green-500/25 uppercase tracking-wider flex items-center justify-center"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  ACCESS_CHALLENGES
                </Link>
                <Link
                  to="/leaderboard"
                  className="border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:bg-opacity-10 px-8 py-4 rounded-lg font-bold transition-all uppercase tracking-wider"
                >
                  VIEW_RANKINGS
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-105 border border-green-400 shadow-lg shadow-green-500/25 uppercase tracking-wider flex items-center justify-center"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  INITIATE_SYSTEM_ACCESS
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-green-500 text-green-400 hover:bg-green-500 hover:bg-opacity-10 px-8 py-4 rounded-lg font-bold transition-all uppercase tracking-wider"
                >
                  AUTHENTICATE
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {liveStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-gray-800 border border-green-600/50 rounded-lg p-6 text-center hover:border-cyan-400 transition-all duration-300 group">
                  <Icon className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-green-300 text-sm font-semibold mb-1 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-cyan-400 text-xs font-mono">{stat.change}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wider">
              OPERATION_MODULES
            </h2>
            <p className="text-cyan-300 text-lg max-w-2xl mx-auto font-mono">
              Specialized cyber operation units ready for deployment
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group">
                  <div className="bg-gray-900 border border-green-500 rounded-xl p-6 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 transform hover:-translate-y-2 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} border border-white border-opacity-20 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-green-400 text-xs font-mono bg-green-600 bg-opacity-20 px-2 py-1 rounded border border-green-600">
                          {feature.points} PTS
                        </div>
                        <div className="text-yellow-400 text-xs font-mono bg-yellow-600 bg-opacity-20 px-2 py-1 rounded border border-yellow-600">
                          {feature.difficulty}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">{feature.title}</h3>
                    <p className="text-green-300 leading-relaxed mb-4 text-sm">{feature.description}</p>
                    <div className="text-cyan-400 text-xs font-mono bg-cyan-900/40 px-3 py-2 rounded border border-cyan-500/50 overflow-x-auto">
                      {feature.command}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 border border-cyan-500/50 rounded-xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wider">
                MISSION_PROTOCOL
              </h2>
              <p className="text-cyan-300 text-lg max-w-2xl mx-auto font-mono">
                Standard operating procedure for successful infiltration
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 border-2 border-cyan-400 group-hover:border-green-400 transition-all transform group-hover:scale-105 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">{item.title}</h3>
                  <p className="text-green-300 text-sm mb-3">{item.description}</p>
                  <div className="text-green-400 text-xs font-mono bg-green-900/40 px-3 py-1 rounded border border-green-500/50">
                    {item.command}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900 border border-green-500/50 rounded-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
                LIVE_ACTIVITY
              </h2>
              <div className="flex items-center space-x-2 text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-600">
                <Eye className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-mono">REAL-TIME FEED</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800 border border-green-700/50 rounded-lg hover:border-cyan-400 transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center border border-white/50">
                      <span className="text-white font-bold text-sm">{activity.user[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{activity.user}</div>
                      <div className="text-green-300 text-sm font-mono">{activity.action}</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-4">
                    <div className="text-cyan-400 font-bold bg-cyan-900/30 px-3 py-1 rounded border border-cyan-600/50">
                      {activity.points}
                    </div>
                    <div className="text-green-400 text-sm font-mono">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-wider">
              STRATEGIC PARTNERS
            </h2>
            <p className="text-green-300">Supported by industry leaders in cybersecurity</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sponsors.map((sponsor, index) => (
              <div key={index} className="bg-gray-800 border border-cyan-500/50 rounded-lg p-6 text-center hover:border-green-400 transition-all">
                <div className={`text-lg font-bold mb-2 uppercase ${
                  sponsor.tier === 'PLATINUM' ? 'text-yellow-400' :
                  sponsor.tier === 'GOLD' ? 'text-yellow-300' :
                  sponsor.tier === 'SILVER' ? 'text-gray-300' : 'text-amber-600'
                }`}>
                  {sponsor.name}
                </div>
                <div className="text-green-400 text-xs font-mono bg-green-900/30 px-2 py-1 rounded border border-green-500/50">
                  {sponsor.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-800 border-2 border-green-500 rounded-xl p-8 lg:p-12 relative overflow-hidden">
            <Lock className="w-12 h-12 text-cyan-400 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 uppercase">
              READY FOR DEPLOYMENT?
            </h2>
            <p className="text-green-300 text-lg mb-8 max-w-2xl mx-auto">
              Join the elite cybersecurity operators and test your skills in real-world scenarios
            </p>
            {user ? (
              <Link
                to="/challenges"
                className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white px-10 py-4 rounded-lg font-bold transition-all transform hover:scale-105 border-2 border-cyan-400 shadow-lg shadow-cyan-500/25 uppercase tracking-wider inline-flex items-center"
              >
                <Zap className="w-6 h-6 mr-3" />
                RESUME_OPERATIONS
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white px-10 py-4 rounded-lg font-bold transition-all transform hover:scale-105 border-2 border-cyan-400 shadow-lg shadow-cyan-500/25 uppercase tracking-wider inline-flex items-center"
              >
                <Server className="w-6 h-6 mr-3" />
                COMMENCE_INITIALIZATION
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-green-500/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Terminal className="w-8 h-8 text-cyan-400" />
                <span className="text-2xl font-bold text-white">CYBER_ARENA</span>
              </div>
              <p className="text-green-300 text-sm">
                Advanced cybersecurity training platform for elite operators and penetration testers.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-green-400 hover:text-cyan-400 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-green-400 hover:text-cyan-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-green-400 hover:text-cyan-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-green-400 hover:text-cyan-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest border-b border-cyan-500/30 pb-2">NAVIGATION</h3>
              <div className="space-y-2">
                {['Challenges', 'Leaderboard', 'Rules', 'FAQ'].map((item) => (
                  <Link
                    key={item}
                    to={`/${item.toLowerCase()}`}
                    className="block text-green-300 hover:text-cyan-400 transition-colors text-sm"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest border-b border-cyan-500/30 pb-2">RESOURCES</h3>
              <div className="space-y-2">
                {['Documentation', 'Tutorials', 'Blog', 'Community'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-green-300 hover:text-cyan-400 transition-colors text-sm"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest border-b border-cyan-500/30 pb-2">SECURITY</h3>
              <div className="space-y-2">
                {['Bug Bounty', 'Responsible Disclosure', 'Security Policy', 'Contact'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-green-300 hover:text-cyan-400 transition-colors text-sm"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-green-500/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-green-300 text-sm font-mono">
                &copy; 2024 CYBER_ARENA_CTF. ALL SYSTEMS SECURE.
              </div>
              <div className="flex space-x-6 text-sm text-green-300 font-mono">
                <a href="#" className="hover:text-cyan-400 transition-colors">PRIVACY_POLICY</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">TERMS_OF_SERVICE</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">COOKIES</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;