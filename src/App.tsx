import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  MapPin, 
  RefreshCw, 
  Calendar, 
  BookOpen, 
  FileText, 
  Coffee, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  User,
  Bot
} from 'lucide-react';
import { ChatMessage, CalendarEvent, ScraperStatus, ChatSession } from './types';

// Hot sample suggestions
const SUGGESTED_QUESTIONS = [
  { text: "When is course registration?", label: "Registration 📝" },
  { text: "When does the mid-semester break start?", label: "Mid-Term Break 🌴" },
  { text: "When are the final exams for Group A?", label: "Group A Exams 📝" },
  { text: "What is the semester break duration?", label: "Semester Break ✈️" }
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Calendar and Scraper states
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus>({
    status: 'idle',
    message: 'Loading UiTM database context...'
  });
  
  // App UI preference states
  const [selectedGroup, setSelectedGroup] = useState<'A' | 'B'>('B');
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming'>('current');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isScraperExpanded, setIsScraperExpanded] = useState(false);
  const [activeSession, setActiveSession] = useState<string>('default');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // June 7, 2026 relative-time context
  const CURRENT_DATE_STRING = "2026-06-07";
  const currentDate = new Date(CURRENT_DATE_STRING);

  // Load calendar database and status dynamically on start
  useEffect(() => {
    fetchCalendarData();
    
    // Add a welcome response representing the AI assistant
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Selamat datang! I am your **UiTM Academic Calendar AI Copilot**.\n\nToday is **Sunday, June 7, 2026**, which places us in **Week 10 of Lectures Part II** (for Semester II March - August 2026).\n\nAsk me anything about UiTM registration deadlines, mid-term recesses, exam dates, revision periods, or semester breaks! How can I help you plan your schedule today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Clear scroll-to-bottom wrapper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchCalendarData = async () => {
    try {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) throw new Error("Could not fetch calendar parameters");
      const data = await res.json();
      
      setEvents(data.events || []);
      if (data.scraper) {
        setScraperStatus({
          status: data.scraper.status,
          message: data.scraper.status === 'success' 
            ? 'Synced successfully with official hea.uitm.edu.my portals.' 
            : data.scraper.error || 'Using canonical fallback offline calendar cache.',
          lastUpdated: data.scraper.lastUpdated ? new Date(data.scraper.lastUpdated).toLocaleTimeString() : undefined,
          scrapedUrl: data.scraper.scrapedUrl
        });
      }
    } catch (err: any) {
      console.error(err);
      setScraperStatus({
        status: 'failed',
        message: 'Unable to communicate with the local portal endpoint. Running locally cached database.'
      });
    }
  };

  const triggerManualScrape = async () => {
    setScraperStatus(prev => ({ ...prev, status: 'scraping', message: 'Triggering live crawler on HEA servers...' }));
    try {
      const res = await fetch('/api/calendar/scrape', { method: 'POST' });
      if (!res.ok) throw new Error("Server crawling trigger failed");
      const data = await res.json();
      setScraperStatus({
        status: data.status,
        message: data.status === 'success' ? 'Portal crawled and parsed successfully in real-time.' : data.error || 'Server rejected crawls.',
        lastUpdated: new Date().toLocaleTimeString()
      });
      fetchCalendarData();
    } catch (err: any) {
      setScraperStatus({
        status: 'failed',
        message: err.message || 'Scraping timed out or is geoblocked by external servers.'
      });
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setApiError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg),
          userQuestion: textToSend
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "An error occurred during Gemini prediction.");
      }

      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to contact academic intelligence. Is the backend offline?");
    } finally {
      setIsTyping(false);
    }
  };

  // Determine current active, past vs future events
  const getEventState = (event: CalendarEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    // Add margins for end-of-day offsets
    end.setHours(23, 59, 59);

    if (currentDate >= start && currentDate <= end) {
      return 'active';
    } else if (currentDate > end) {
      return 'completed';
    } else {
      return 'upcoming';
    }
  };

  const filterCurrentUpcoming = (event: CalendarEvent) => {
    const isSemester2_2026 = event.semester.includes("Semester II");
    if (activeTab === 'current') {
      return isSemester2_2026;
    } else {
      return !isSemester2_2026;
    }
  };

  const currentTabEvents = events.filter(filterCurrentUpcoming);

  // Group selector descriptions
  const getGroupExplanation = () => {
    if (selectedGroup === 'A') {
      return "Group A branches start academic weeks on Sundays (Johor, Kedah, Kelantan, Terengganu).";
    }
    return "Group B branches start academic weeks on Mondays (Selangor, Melaka, Perak, Penang, Sarawak, etc.).";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased font-sans text-[#121212]" id="main_app_layout">
      
      {/* Heavy Typography Styled Brand Top Bar */}
      <header className="bg-white border-b-2 border-[#E0E0E0] sticky top-0 z-40" id="navbar_header">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-[#5F259F] rounded-full flex items-center justify-center text-white font-black text-xl tracking-tight shadow-sm" id="brand_badge">
              U
            </div>
            <div>
              <h1 className="text-xl font-black text-[#121212] tracking-tighter flex items-center gap-1.5 uppercase">
                UiTM.Helper Academics
              </h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Intelligence Engine</p>
            </div>
          </div>

          {/* Bold visual navigation menu */}
          <div className="flex items-center space-x-6">
            <span className="text-xs font-black tracking-widest uppercase text-[#5F259F] bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg hidden sm:inline-block">
              Assistant Node
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400 hidden md:inline-block">
              Schedules
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400 hidden md:inline-block">
              Resources
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid View Container */}
      <main className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch" id="app_primary_grid">
        
        {/* Full-width Typographic Hero Intro Block */}
        <div className="lg:col-span-12 mb-2 border-b-2 border-[#E0E0E0] pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="text-[10px] font-black text-[#5F259F] uppercase tracking-[0.25em] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#5F259F] rounded-full animate-pulse"></span>
                Official Knowledge-Base Terminal
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.8] tracking-tighter text-[#121212] mb-3 uppercase">
                ACADEMIC<br/>
                <span className="text-[#5F259F]">ASSISTANT</span>
              </h1>
              <p className="max-w-xl text-sm font-medium text-slate-500 leading-snug">
                Your high-speed interactive gateway to Universiti Teknologi MARA schedules, course registrations, exam windows, and holiday timelines.
              </p>
            </div>
            
            {/* Status overview container */}
            <div className="bg-slate-50 border-2 border-[#E0E0E0] p-5 rounded-2xl flex items-center space-x-4 max-w-sm w-full">
              <div className="w-12 h-12 bg-[#5F259F] text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                W10
              </div>
              <div>
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Campus Period</div>
                <div className="text-xs font-black text-[#121212] mt-0.5">Sem II (March - August 2026)</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lectures Part II (Ongoing)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Side: Calendar Timeline Feed */}
        <section className="lg:col-span-5 flex flex-col space-y-4" id="calendar_timeline_section">
          <div className="bg-white rounded-2xl border-2 border-[#E0E0E0] overflow-hidden flex flex-col h-full">
            
            {/* Calendar Controls Header */}
            <div className="p-5 border-b-2 border-[#E0E0E0] bg-slate-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-black text-[#121212] uppercase text-sm tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#5F259F]" />
                  Internal Calendars
                </h2>
                
                {/* Semester active selector tabs */}
                <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg text-xs font-bold">
                  <button 
                    onClick={() => setActiveTab('current')}
                    className={`px-3 py-1.5 rounded-md transition duration-150 uppercase tracking-wider text-[10px] ${activeTab === 'current' ? 'bg-[#5F259F] text-white font-black' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    Mar - Aug 2026
                  </button>
                  <button 
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-3 py-1.5 rounded-md transition duration-150 uppercase tracking-wider text-[10px] ${activeTab === 'upcoming' ? 'bg-[#5F259F] text-white font-black' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    Oct '26 - Mar '27
                  </button>
                </div>
              </div>

              {/* Group A / B States Division Switcher */}
              <div className="bg-white p-4 rounded-xl border border-[#E0E0E0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#5F259F]" />
                    Target Branch:
                  </span>
                  <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-md">
                    <button
                      onClick={() => setSelectedGroup('A')}
                      className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded transition ${selectedGroup === 'A' ? 'bg-[#5F259F] text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Group A
                    </button>
                    <button
                      onClick={() => setSelectedGroup('B')}
                      className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded transition  ${selectedGroup === 'B' ? 'bg-[#5F259F] text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Group B
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium" id="group_explanation_line">
                  {getGroupExplanation()}
                </p>
              </div>
            </div>

            {/* Timelines List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[500px] lg:max-h-[640px] bg-white">
              
              <div className="relative border-l-2 border-[#E0E0E0] ml-4 pl-6 space-y-6 py-2">
                <AnimatePresence mode="popLayout">
                  {currentTabEvents.map((ev, index) => {
                    const state = getEventState(ev);
                    const isExpanded = expandedEventId === ev.id;
                    
                    return (
                      <motion.div 
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative"
                        id={`timeline-event-${ev.id}`}
                      >
                        {/* Bullet indicators on left border */}
                        <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                          state === 'active' 
                            ? 'border-[#5F259F] ring-4 ring-purple-100 scale-110 shadow-xs' 
                            : state === 'completed'
                              ? 'border-slate-300 bg-slate-200'
                              : 'border-slate-900'
                        }`}>
                          {state === 'active' && <span className="w-1.5 h-1.5 bg-[#5F259F] rounded-full animate-ping"></span>}
                        </span>

                        {/* Heavy-Typography Styled Event Card Container */}
                        <div 
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            state === 'active'
                              ? 'bg-slate-50 border-[#5F259F] ring-2 ring-purple-100/40'
                              : 'bg-white border-[#E0E0E0] hover:border-slate-400'
                          }`}
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                  ev.category === 'lecture'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : ev.category === 'break'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : ev.category === 'exam'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-purple-50 text-[#5F259F] border-purple-200/50'
                                }`}>
                                  {ev.category}
                                </span>
                                
                                {state === 'active' && (
                                  <span className="bg-[#5F259F] text-white text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase animate-pulse">
                                    LIVE ACTIVITY
                                  </span>
                                )}
                              </div>
                              <h3 className="font-extrabold text-[#121212] text-sm mt-1.5 leading-snug uppercase tracking-tight">
                                {ev.eventName}
                              </h3>
                            </div>
                            <span className="text-slate-400 hover:text-slate-900 transition mt-1">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-[#121212]" /> : <ChevronDown className="w-4 h-4 text-[#121212]" />}
                            </span>
                          </div>

                          {/* Date details */}
                          <div className="mt-2.5 flex flex-col space-y-1 text-xs text-slate-500">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-[#121212]">GROUP {selectedGroup}:</span>
                              <span className="font-medium text-slate-700">{selectedGroup === 'A' ? ev.groupA : ev.groupB}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {ev.startDate} // {ev.endDate}
                            </div>
                          </div>

                          {/* Expanded Info Drawer */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <hr className="my-3 border-dashed border-[#E0E0E0]" />
                                <p className="text-xs text-slate-600 leading-relaxed bg-[#F5F5F5] p-3 rounded-lg border border-[#E0E0E0] font-medium">
                                  {ev.description}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendMessage(`Explain everything about the schedule status and deadlines of ${ev.eventName} for Group ${selectedGroup} campuses.`);
                                  }}
                                  className="mt-2.5 text-xs font-black text-[#5F259F] hover:text-[#4d1e82] inline-flex items-center space-x-1 uppercase tracking-wider"
                                >
                                  <span>Consult Copilot</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

            </div>

            {/* Bottom Scraper Status dashboard monitor */}
            <div className="p-4 border-t-2 border-[#E0E0E0] bg-[#F5F5F5] text-xs">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsScraperExpanded(!isScraperExpanded)}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`w-3 h-3 rounded-full ${
                    scraperStatus.status === 'success' 
                      ? 'bg-green-600 shadow-xs' 
                      : scraperStatus.status === 'scraping'
                        ? 'bg-[#5F259F] animate-spin border-t-2 border-transparent'
                        : 'bg-amber-500'
                  }`}></span>
                  <div className="font-extrabold text-[#121212] uppercase tracking-wider">
                    Crawler Feed: <span className="opacity-65">{scraperStatus.status}</span>
                  </div>
                </div>
                <span className="text-[#121212] hover:text-[#5F259F]">
                  {isScraperExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </div>

              <AnimatePresence>
                {isScraperExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-3 pt-3 border-t border-[#E0E0E0]"
                  >
                    <p className="text-slate-600 leading-relaxed text-[11px] mb-2.5 font-semibold">
                      {scraperStatus.message}
                    </p>
                    {scraperStatus.scrapedUrl && (
                      <div className="text-[10px] text-slate-400 font-mono truncate mb-2.5">
                        Source: <a href={scraperStatus.scrapedUrl} target="_blank" rel="noopener noreferrer" className="text-[#5F259F] hover:underline font-bold">{scraperStatus.scrapedUrl}</a>
                      </div>
                    )}
                    <button
                      onClick={triggerManualScrape}
                      disabled={scraperStatus.status === 'scraping'}
                      className="w-full bg-white hover:bg-slate-100 border-2 border-[#E0E0E0] py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#121212] inline-flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${scraperStatus.status === 'scraping' ? 'animate-spin' : ''}`} />
                      <span>Re-crawl UiTM HEA Portal</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* Right Side: ChatGPT-style Chatbox Layout with BOLD typography accents */}
        <section className="lg:col-span-7 flex flex-col" id="chatbot_container_section">
          <div className="bg-white rounded-2xl border-2 border-[#E0E0E0] overflow-hidden flex flex-col h-full min-h-[550px] lg:min-h-[600px] relative">
            
            {/* Copilot Header */}
            <div className="px-6 py-5 border-b-2 border-[#E0E0E0] flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#5F259F] text-white rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-[#121212] text-sm md:text-base uppercase tracking-tight">UiTM Assistant Copilot</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                    State Engine: <span>gemini-3.5-flash</span>
                  </p>
                </div>
              </div>

              {/* Reset session link */}
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: 'welcome_reset',
                      role: 'assistant',
                      content: `Academic session reset! Active time context is **June 7, 2026** (Week 10 of Lectures II).\n\nWhat would you like to check next about your semesters?`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                }}
                className="text-[10px] text-[#5F259F] hover:text-[#4d1e82] font-black uppercase tracking-widest transition flex items-center space-x-1 bg-white border border-[#E0E0E0] px-2.5 py-1 rounded-md hover:border-[#5F259F]"
                title="Reset conversation state"
              >
                <span>Clear Conversation</span>
              </button>
            </div>

            {/* API Warning if missing key */}
            <AnimatePresence>
              {apiError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border-b-2 border-red-200 px-6 py-4 text-red-800 text-xs flex items-start space-x-3.5"
                  id="api_error_banner"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold mb-1 uppercase tracking-wider">Secrets Error</p>
                    <p className="leading-relaxed font-semibold text-slate-700">Please configure your **GEMINI_API_KEY** inside AI Studio’s **Settings &gt; Secrets** panel to converse with the smart university AI assistant.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable messages context */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white" id="chat_messages_viewport">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start space-x-3.5 max-w-[88%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar badges */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs ${
                      msg.role === 'user' 
                        ? 'bg-[#5F259F] text-white shadow-xs' 
                        : 'bg-slate-200 text-[#121212]'
                    }`}>
                      {msg.role === 'user' ? 'ME' : 'AI'}
                    </div>

                    {/* Chat Bubble contents */}
                    <div>
                      <div className={`p-4 rounded-2xl leading-relaxed text-sm ${
                        msg.role === 'user'
                          ? 'bg-[#5F259F] text-white rounded-tr-none font-bold'
                          : 'bg-[#F5F5F5] border border-[#E0E0E0] text-[#121212] rounded-tl-none font-semibold'
                      }`}>
                        {/* Custom minimal Markdown rendering parser for list blocks & bold markers */}
                        <div className="whitespace-pre-wrap space-y-1.5 font-sans">
                          {msg.content.split('\n').map((line, lIdx) => {
                            // Render bullet lists
                            if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                              const listContent = line.replace(/^[-*]\s+/, '');
                              return (
                                <li key={lIdx} className="ml-4 list-disc pl-1 text-[13px] md:text-sm leading-normal">
                                  {parseBoldMarkers(listContent)}
                                </li>
                              );
                            }
                            return (
                              <p key={lIdx} className="text-[13px] md:text-sm leading-normal">
                                {parseBoldMarkers(line)}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Message bottom status */}
                      <span className={`text-[9px] text-[#A0A0A0] mt-1 block px-1 font-mono uppercase tracking-wider ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Bot typing loader state */}
              {isTyping && (
                <div className="flex items-start space-x-3.5 mr-auto max-w-[80%] animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 font-black text-xs text-[#121212]">
                    AI
                  </div>
                  <div className="p-3.5 bg-[#F5F5F5] border border-[#E0E0E0] rounded-2xl rounded-tl-none flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-[#5F259F] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#5F259F] rounded-full animate-bounce [animation-delay:0.15s]"></div>
                    <div className="w-2 h-2 bg-[#5F259F] rounded-full animate-bounce [animation-delay:0.3s]"></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Footer suggestions area with Pill UI elements */}
            <div className="px-6 py-3 border-t-2 border-[#E0E0E0] bg-[#F5F5F5]" id="suggestion_hub">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2.5">
                Quick Schedule Enquiries
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.text)}
                    disabled={isTyping}
                    className="bg-white hover:bg-[#5F259F] hover:text-white border-2 border-[#E0E0E0] hover:border-[#5F259F] text-[10px] font-black uppercase tracking-wider text-[#121212] px-4 py-2 rounded-full transition duration-150 shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Master User Input Bar form with the huge bold layout feel */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="p-5 border-t-2 border-[#E0E0E0] bg-white text-right"
              id="input_form_bar"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isTyping}
                  placeholder="Query registrations, breaks, revision, or exams. Be as specific as you like..."
                  className="w-full bg-[#F5F5F5] border-2 border-[#E0E0E0] focus:border-[#5F259F] focus:bg-white py-5 pl-6 pr-16 text-sm font-bold rounded-xl placeholder:text-slate-400 outline-none transition-all text-[#121212]"
                  id="user_text_input_field"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-[#5F259F] text-white p-3 rounded-lg hover:bg-[#4d1e82] transition disabled:opacity-40 disabled:hover:bg-[#5F259F] flex items-center justify-center shadow-xs"
                  title="Send query"
                  id="submit_message_btn"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-2 block text-center leading-none">
                Compare and verify calendar dates with academic registrar advisories in your local student portal.
              </span>
            </form>

          </div>
        </section>

      </main>

      {/* Magnificent 4-Cell Status Grid Footer reminiscent of the high-impact Bold Typography style layout */}
      <footer className="grid grid-cols-2 md:grid-cols-4 border-t-2 border-[#E0E0E0] bg-white text-left font-sans" id="grid_footer">
        <div className="p-6 border-r-2 border-b-2 md:border-b-0 border-[#E0E0E0]">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Intelligent Core</div>
          <div className="text-sm font-black text-[#121212]">Gemini 3.5 Flash Model</div>
        </div>
        
        <div className="p-6 border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-[#E0E0E0]">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sync Monitor</div>
          <div className="text-sm font-black text-green-600 flex items-center gap-1.5 uppercase">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-ping"></span>
            Real-Time Scraper Live
          </div>
        </div>

        <div className="p-6 border-r-2 border-[#E0E0E0]">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Branch Coverage</div>
          <div className="text-sm font-black text-[#12125f] uppercase">Groups A & B Nationwide</div>
        </div>

        <div className="p-6 flex flex-col justify-center bg-[#5F259F] text-white">
          <span className="text-[9px] font-black uppercase tracking-widest text-purple-200">System Gateway</span>
          <span className="text-sm font-black tracking-tight uppercase">UITM-SHAH-ALAM-01</span>
        </div>
      </footer>
    </div>
  );
}

// Helper to highlight markdown bold segments (**bold text**) inside messages
function parseBoldMarkers(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
}
