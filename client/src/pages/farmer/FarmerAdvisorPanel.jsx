import React from 'react';
import { BrainCircuit, AlertTriangle, Send } from 'lucide-react';

const FarmerAdvisorPanel = ({
  user,
  chatMessages,
  sendingChat,
  chatError,
  chatInput,
  setChatInput,
  sendChatMessage,
}) => {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>GenAI Agricultural Advisory</h2>
        <span className="badge badge-premium">Premium Gated</span>
      </div>

      {user.subscription_tier === 'FREE' ? (
        <div className="flex-center" style={{ flexDirection: 'column', gap: 16, padding: '40px 0' }}>
          <BrainCircuit size={48} className="text-muted" />
          <h3>Conversational Advisor Locked</h3>
          <p className="text-secondary" style={{ textAlign: 'center', maxWidth: 450 }}>
            Accessing the interactive context-aware RAG advisor requires upgrading your account to the premium tier.
          </p>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                {msg.text}
                {msg.warning && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} /> {msg.warning}
                  </div>
                )}
              </div>
            ))}
            {sendingChat && (
              <div className="chat-bubble chat-bubble-bot" style={{ display: 'flex', gap: 4 }}>
                <span className="animate-pulse">●</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}
            {chatError && (
              <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.9rem', padding: '8px 12px', alignSelf: 'center' }}>
                {chatError}
              </div>
            )}
          </div>

          <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: 12 }}>
            <input 
              className="input-field" 
              style={{ flex: 1 }} 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              placeholder="Ask about fertilizer split doses, water schedules, or pest safety..." 
              disabled={sendingChat}
            />
            <button className="btn btn-primary" type="submit" disabled={sendingChat}>
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FarmerAdvisorPanel;