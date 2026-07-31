import React, { useState, useEffect, useRef } from 'react';
import TabComplete from './TabComplete';
import Neofetch from './Neofetch';
import MusicPage from './MusicPage';
import AdminDashboard from './AdminDashboard';

// Custom hook for typewriter effect on text
const TypewriterText = ({ text, onComplete, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);
    
    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);
  
  return <span className="typewriter-text">{displayedText}</span>;
};

const TerminalEmulator = ({ projects, about, switchMode, fetchData }) => {
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [currentPath, setCurrentPath] = useState('~');
  
  // Tab completion state
  const [tabOptions, setTabOptions] = useState([]);
  const [tabIndex, setTabIndex] = useState(-1);
  const [showTabComplete, setShowTabComplete] = useState(false);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // Available commands for auto-complete and help
  const commands = [
    { name: 'help', desc: 'List available commands' },
    { name: 'ls', desc: 'List directory contents' },
    { name: 'cat', desc: 'Read file contents (e.g., cat whoami)' },
    { name: 'cd', desc: 'Change directory (e.g., cd projects)' },
    { name: 'clear', desc: 'Clear terminal output' },
    { name: 'whoami', desc: 'Display user information' },
    { name: 'neofetch', desc: 'Display system information' },
    { name: 'gui', desc: 'Switch to modern GUI mode' },
    { name: 'uname -a', desc: 'Print system information' }
  ];

  // Auto-scroll to bottom when history changes or typing happens
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isTyping, inputValue]);

  // Initial MOTD
  useEffect(() => {
    const isFirstRun = !sessionStorage.getItem('terminal_motd_shown');
    
    if (isFirstRun) {
      sessionStorage.setItem('terminal_motd_shown', 'true');
      runCommand('neofetch', true);
      
      // Add a tip after neofetch
      setTimeout(() => {
        setHistory(prev => [...prev, {
          id: Date.now() + 1,
          type: 'text',
          content: "💡 Tip: type 'help' for available commands, or click any highlighted text. Press Tab for autocomplete. Arrow ↑↓ for command history."
        }]);
      }, 1000);
    }
  }, []);

  // Ensure input stays focused when clicking around (unless selecting text)
  const handleTerminalClick = (e) => {
    // Don't focus if clicking a button or link or if selecting text
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button')) {
      return;
    }
    if (window.getSelection().toString()) {
      return;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setHistoryIndex(-1);
    
    // Reset tab complete
    setShowTabComplete(false);
    setTabIndex(-1);
  };

  const executeCommand = (cmdStr) => {
    const parts = cmdStr.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    let output = null;

    switch (cmd) {
      case 'help':
        output = {
          type: 'component',
          content: (
            <div className="terminal-help">
              <p>Available commands:</p>
              <table className="help-table">
                <tbody>
                  {commands.map(c => (
                    <tr key={c.name}>
                      <td className="cmd-name clickable" onClick={() => runCommand(c.name)}>{c.name}</td>
                      <td>{c.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        };
        break;
      
      case 'clear':
        setHistory([]);
        return; // Don't add clear command to history output
        
      case 'gui':
        switchMode('gui');
        return;
        
      case 'uname':
        if (args[0] === '-a') {
          output = { type: 'text', content: 'shoegaze-os guest-node 1.0.0 linux/web x86_64 GNU/Linux' };
        } else {
          output = { type: 'text', content: 'shoegaze-os' };
        }
        break;

      case 'neofetch':
        output = { 
          type: 'component', 
          content: <Neofetch projects={projects} about={about} onNavigate={(c) => runCommand(`cd ${c}`)} /> 
        };
        break;

      case 'whoami':
        output = { type: 'component', content: renderWhoami() };
        break;

      case 'ls':
        const target = args[0] || currentPath.replace('~', '').replace(/^\//, '');
        if (!target || target === '') {
          output = {
            type: 'component',
            content: (
              <div className="ls-output">
                <span className="clickable dir" onClick={() => runCommand('ls projects')}>projects/</span>{'  '}
                <span className="clickable file" onClick={() => runCommand('cat whoami')}>whoami</span>{'  '}
                <span className="clickable dir" onClick={() => runCommand('ls music')}>music/</span>
              </div>
            )
          };
        } else if (target === 'projects' || target === 'projects/') {
          output = {
            type: 'component',
            content: (
              <div className="ls-output projects-ls">
                {projects.map(p => {
                  const safeName = p.title.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <div key={p.id} className="clickable file" onClick={() => runCommand(`cat projects/${safeName}`)}>
                      {safeName} <span className="text-muted">— {p.description.substring(0, 50)}...</span>
                    </div>
                  );
                })}
              </div>
            )
          };
        } else if (target === 'music' || target === 'music/') {
          output = {
            type: 'component',
            content: (
              <div className="ls-output">
                <span className="clickable dir" onClick={() => runCommand('cd music')}>open-music-player/</span>
              </div>
            )
          };
        } else {
          output = { type: 'error', content: `ls: cannot access '${target}': No such file or directory` };
        }
        break;

      case 'cd':
        const dir = args[0] || '~';
        if (dir === '..') {
          setCurrentPath('~');
        } else if (dir === '~') {
          setCurrentPath('~');
        } else if (dir === 'projects' || dir === 'projects/') {
          setCurrentPath('~/projects');
        } else if (dir === 'music' || dir === 'music/') {
          output = { type: 'component', content: <MusicPage onBack={() => runCommand('cd ..')} /> };
          setCurrentPath('~/music');
        } else if (dir === 'admin' || dir === 'admin/') {
          output = { type: 'component', content: <AdminDashboard onBack={() => runCommand('cd ..')} onDataChange={fetchData} /> };
          setCurrentPath('~/admin');
        } else {
          output = { type: 'error', content: `bash: cd: ${dir}: No such file or directory` };
        }
        break;

      case 'cat':
        const file = args[0];
        if (!file) {
          output = { type: 'error', content: `cat: missing operand` };
        } else if (file === 'whoami') {
          output = { type: 'component', content: renderWhoami() };
        } else if (file.startsWith('projects/')) {
          const pName = file.replace('projects/', '');
          const project = projects.find(p => p.title.toLowerCase().replace(/\s+/g, '-') === pName);
          if (project) {
            output = { type: 'component', content: renderProject(project) };
          } else {
            output = { type: 'error', content: `cat: ${file}: No such file or directory` };
          }
        } else {
          output = { type: 'error', content: `cat: ${file}: No such file or directory` };
        }
        break;

      case './projects':
      case 'projects':
        runCommand('cd projects');
        return;
      case './music':
      case 'music':
      case './arp':
      case 'arp':
        runCommand('cd music');
        return;
      case './whoami':
        runCommand('cat whoami');
        return;
      case '/admin/qquway/':
      case './admin/qquway/':
        runCommand('cd admin');
        return;

      default:
        output = { type: 'error', content: `bash: ${cmd}: command not found` };
    }

    return output;
  };

  const renderWhoami = () => {
    if (!about) return <div className="error-text">Loading user data...</div>;
    return (
      <div className="terminal-cat-output">
        <h3 className="rgb-split">User: {about.username}</h3>
        <p><strong>Alias:</strong> {about.alias}</p>
        <p><strong>Role:</strong> {about.role}</p>
        <p className="text-muted mt-2">{about.background}</p>
        
        <div className="mt-2">
          <strong>Skills:</strong>
          <div className="skills-grid mt-1">
            {about.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
          </div>
        </div>

        {about.certifications && about.certifications.length > 0 && (
          <div className="mt-2">
            <strong>Certifications:</strong>
            <ul className="mt-1" style={{ listStyleType: 'square', paddingLeft: '20px' }}>
              {about.certifications.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
        
        <div className="mt-2">
          <strong>Contact:</strong>
          <div className="flex gap-4 mt-1">
            <a href="mailto:rifqihabib04@gmail.com" className="clickable">rifqihabib04@gmail.com</a>
            <a href="https://www.linkedin.com/in/rifqi-ur-rahman/" target="_blank" rel="noreferrer" className="clickable">LinkedIn</a>
            {about.cv_path && (
              <a href={about.cv_path.startsWith('/uploads') ? `http://127.0.0.1:3000${about.cv_path}` : about.cv_path} target="_blank" rel="noreferrer" className="clickable">Download CV</a>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProject = (project) => {
    const isStatic = !!import.meta.env.VITE_IS_STATIC;
    const API = isStatic ? '' : (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000');
    
    return (
      <div className="terminal-cat-output project-detail">
        <h2 className="rgb-split">{project.title}</h2>
        {project.link && (
          <a href={project.link} target="_blank" rel="noreferrer" className="clickable d-block mt-1 mb-2">
            View Source / External Link ↗
          </a>
        )}
        <p>{project.content}</p>
        {project.images?.length > 0 && (
          <div className="image-gallery mt-2">
            {project.images.map((img, idx) => (
              <div key={idx} className="image-wrapper">
                <img src={img.startsWith('/uploads') ? `${API}${img}` : img} alt={`${project.title} screenshot ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const runCommand = (cmdStr, silent = false) => {
    if (!cmdStr.trim()) return;
    
    // Add to command history
    if (!silent) {
      setCommandHistory(prev => {
        const newHist = [cmdStr, ...prev.filter(c => c !== cmdStr)].slice(0, 50);
        return newHist;
      });
      setHistoryIndex(-1);
    }
    
    // Record the prompt and command in scrollback
    if (!silent) {
      const promptEntry = {
        id: Date.now(),
        type: 'prompt',
        path: currentPath,
        content: cmdStr
      };
      setHistory(prev => [...prev, promptEntry]);
    }
    
    // Execute
    const output = executeCommand(cmdStr);
    
    // Add output to scrollback
    if (output) {
      setHistory(prev => [...prev, { ...output, id: Date.now() + 1 }]);
    }
    
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showTabComplete && tabIndex >= 0) {
        // Accept tab complete selection
        e.preventDefault();
        setInputValue(tabOptions[tabIndex]);
        setShowTabComplete(false);
      } else {
        runCommand(inputValue);
        setShowTabComplete(false);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showTabComplete) {
        setTabIndex(prev => (prev > 0 ? prev - 1 : tabOptions.length - 1));
      } else if (commandHistory.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showTabComplete) {
        setTabIndex(prev => (prev < tabOptions.length - 1 ? prev + 1 : 0));
      } else if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    } else if (e.key === 'Escape') {
      setShowTabComplete(false);
    }
  };

  const handleTabCompletion = () => {
    const input = inputValue.trimLeft();
    if (!input) return;
    
    const parts = input.split(/\s+/);
    const cmd = parts[0];
    
    if (parts.length === 1) {
      // Completing the command itself
      const matches = commands.filter(c => c.name.startsWith(cmd)).map(c => c.name);
      if (matches.length === 1) {
        setInputValue(matches[0] + ' ');
        setShowTabComplete(false);
      } else if (matches.length > 1) {
        setTabOptions(matches);
        setShowTabComplete(true);
        setTabIndex(0);
      }
    } else if (parts.length === 2 && (cmd === 'cat' || cmd === 'cd' || cmd === 'ls')) {
      // Completing arguments
      const arg = parts[1];
      let matches = [];
      
      if (cmd === 'cat') {
        matches = ['whoami'];
        if (arg.startsWith('projects/')) {
          const pName = arg.replace('projects/', '');
          matches = projects
            .map(p => 'projects/' + p.title.toLowerCase().replace(/\s+/g, '-'))
            .filter(p => p.startsWith(arg));
        } else if ('projects/'.startsWith(arg)) {
          matches.push('projects/');
        }
      } else if (cmd === 'cd' || cmd === 'ls') {
        matches = ['projects/', 'music/'].filter(p => p.startsWith(arg));
      }
      
      if (matches.length === 1) {
        setInputValue(`${cmd} ${matches[0]}`);
        setShowTabComplete(false);
      } else if (matches.length > 1) {
        setTabOptions(matches.map(m => `${cmd} ${m}`));
        setShowTabComplete(true);
        setTabIndex(0);
      }
    }
  };

  return (
    <div className="terminal-emulator" onClick={handleTerminalClick}>
      <div className="scrollback-buffer" ref={scrollRef}>
        {history.map((entry) => (
          <div key={entry.id} className={`scrollback-entry ${entry.type}`}>
            {entry.type === 'prompt' && (
              <div className="prompt-line archived">
                <span className="prompt-user">guest@shoegaze-os</span>
                <span className="text-muted">:</span>
                <span className="prompt-path">{entry.path}</span>
                <span className="prompt-dollar">$</span>
                <span className="archived-command">{entry.content}</span>
              </div>
            )}
            
            {entry.type === 'text' && (
              <div className="output-text">{entry.content}</div>
            )}
            
            {entry.type === 'error' && (
              <div className="output-error">{entry.content}</div>
            )}
            
            {entry.type === 'component' && (
              <div className="output-component">{entry.content}</div>
            )}
          </div>
        ))}
        
        {/* Active Prompt Line */}
        <div className="prompt-line active-prompt">
          <span className="prompt-user">guest@shoegaze-os</span>
          <span className="text-muted">:</span>
          <span className="prompt-path">{currentPath}</span>
          <span className="prompt-dollar">$</span>
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              autoComplete="off"
              autoFocus
            />
            {showTabComplete && (
              <TabComplete 
                options={tabOptions} 
                selectedIndex={tabIndex} 
                onSelect={(opt) => {
                  setInputValue(opt);
                  setShowTabComplete(false);
                  inputRef.current.focus();
                }} 
              />
            )}
            <span className="block-cursor"></span>
          </div>
        </div>
        
        <div ref={bottomRef} className="scroll-anchor" />
      </div>
    </div>
  );
};

export default TerminalEmulator;
