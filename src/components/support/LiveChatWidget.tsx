'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, PhoneCall } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'agent';
  text: string;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: 'Hi there! 👋 How can we help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isEscalated, setIsEscalated] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const newUserMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');

    // Simulate typing and response
    setTimeout(() => {
      let responseText = '';
      if (isEscalated) {
        responseText = 'Thanks for your message. An agent will reply momentarily.';
      } else {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('order') || lowerText.includes('track')) {
          responseText = 'You can track your orders by visiting your Account Profile and clicking on the "Orders" tab.';
        } else if (lowerText.includes('return') || lowerText.includes('exchange')) {
          responseText = 'Returns and exchanges can be initiated directly from your Order History for up to 30 days after delivery.';
        } else {
          responseText = "I'm a virtual assistant. If you need more specific help, you can escalate to a human agent below.";
        }
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: isEscalated ? 'agent' : 'bot',
        text: responseText
      }]);
    }, 1000);
  };

  const handleEscalate = () => {
    setIsEscalated(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text: 'Transferring you to a human agent now. Please hold...'
    }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: 'Hi, I am Sarah from the support team. How can I assist you further?'
      }]);
    }, 3000);
  };

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-50 flex flex-col items-end">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-surface border border-border w-80 md:w-96 rounded-2xl shadow-2xl overflow-hidden mb-4 flex flex-col"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-foreground text-background p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#8ed500] animate-pulse" />
                <h3 className="font-bold">{isEscalated ? 'Support Agent' : 'Virtual Assistant'}</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-background/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px] flex flex-col gap-4 bg-background/50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-accent text-background' : 'bg-surface-active text-foreground'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${
                    msg.sender === 'user' 
                      ? 'bg-accent text-background rounded-tr-sm' 
                      : 'bg-surface border border-border text-foreground rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (if not escalated) */}
            {!isEscalated && (
              <div className="px-4 pb-2 pt-2 bg-background/50 flex flex-col gap-2 shrink-0">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleSend('Track my order')} className="px-3 py-1.5 text-xs font-medium border border-border rounded-full hover:bg-surface transition-colors">Track Order</button>
                  <button onClick={() => handleSend('Return policy')} className="px-3 py-1.5 text-xs font-medium border border-border rounded-full hover:bg-surface transition-colors">Return Policy</button>
                </div>
                <button 
                  onClick={handleEscalate}
                  className="flex items-center justify-center gap-2 w-full py-2 mt-1 text-xs font-semibold text-accent hover:bg-accent/5 rounded-lg transition-colors border border-accent/20"
                >
                  <PhoneCall className="w-3 h-3" /> Chat with a human
                </button>
              </div>
            )}

            {/* Input Area */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} 
              className="p-4 bg-surface border-t border-border flex gap-2 shrink-0"
            >
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2 bg-accent text-background rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-foreground text-background rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

    </div>
  );
}
