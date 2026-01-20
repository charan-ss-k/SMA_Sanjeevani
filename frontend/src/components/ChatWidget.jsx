import React, { useState, useEffect, useRef, useContext } from 'react';
import { playTTS } from '../utils/tts';
import { LanguageContext } from '../main';

// --- SVG Icons ---

// A simple send icon (from chatbot.jsx)
const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

// A simple bot icon (from chatbot.jsx)
const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6"
  >
    <path
      fillRule="evenodd"
      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
      clipRule="evenodd"
    />
  </svg>
);

// The Chat icon (from ChatbotIcon.jsx)
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.836 8.836 0 01-4.43-1.253l-2.434.812a1 1 0 01-1.253-1.253l.812-2.434A8.836 8.836 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
  </svg>
);

// A new 'Close' icon
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- Chatbot Window Component ---
const ChatbotWindow = () => {
  const { language } = useContext(LanguageContext);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi there 👋! I am Sanjeevani, your AI medical assistant powered by advanced medical AI. Ask me any medical questions in any language - about symptoms, diseases, treatments, medicines, health conditions, or any medical concern. I\'m here to help with accurate health information. What can I help you with today?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Function to handle sending a message
  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput === '') return;

    // Add user message to state
    const newUserMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: trimmedInput,
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');
    setError(null);
    setIsTyping(true);

    try {
      // Call backend API for medical Q&A
      const apiBase = window.__API_BASE__ || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiBase}/api/medical-qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedInput,
          language: 'english',
        }),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const botResponseText = data.answer || 'Unable to generate a response. Please try again.';

      const newBotMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: botResponseText,
      };

      setIsTyping(false);
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
      
      // Speak the response using Coqui TTS
      playTTS(botResponseText, language);
    } catch (err) {
      console.error('[ChatWidget] Error:', err);
      setIsTyping(false);
      
      const errorMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: '⚠️ I encountered an error while processing your question. Please check if the backend is running and try again.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      setError(err.message);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isTyping) {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-24 right-8 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200" style={{maxWidth: '400px'}}>
      <div className="flex flex-col h-[70vh] md:h-[600px]">
        {/* Chat Header */}
        <div className="p-4 bg-gradient-to-r from-green-600 to-blue-600 text-white flex items-center space-x-3">
          <div className="relative">
            <img
              className="w-10 h-10 rounded-full"
              src="https://placehold.co/40x40/ffffff/22c55e?text=S"
              alt="Bot Avatar"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-lime-400 border-2 border-green-600 rounded-full"></span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">Sanjeevani AI</h2>
            <p className="text-sm text-green-100">🏥 Medical Assistant (24/7)</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-green-50 to-blue-50 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-3 px-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="p-3 px-4 rounded-2xl max-w-[85%] text-sm bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}

          {/* Empty div to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex p-3 border-t border-gray-200 bg-white items-center">
          <input
            type="text"
            placeholder="Ask about any medical condition..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-none outline-none text-sm p-3 rounded-lg bg-gray-100 focus:ring-2 focus:ring-green-500 transition-all"
          />
          <button
            onClick={handleSend}
            className="bg-green-600 text-white p-3 rounded-lg cursor-pointer ml-2 hover:bg-green-700 transition-colors disabled:bg-gray-400 flex-shrink-0"
            disabled={inputValue.trim() === '' || isTyping}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Chat Widget Component ---
const ChatWidget = () => {
  // State to manage if the chat window is open or not
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Conditionally render the chat window based on 'isOpen' state */}
      {isOpen && <ChatbotWindow />}

      {/* The toggle button, using the icon from ChatbotIcon.jsx */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={toggleChat} 
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all animate-pulse"
        >
          {/* Change the icon based on the 'isOpen' state */}
          {isOpen ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>
    </>
  );
};

export default ChatWidget;