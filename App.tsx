import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, DeploymentStatus } from './types';
import { generateTextResponse, generateImageResponse, generateGroundedResponse, generateWebsiteAnalysis, generateCodeModification } from './services/geminiService';
import { fetchWebsiteContent } from './services/websiteService';
import { deployApp, getProjectFiles } from './services/deploymentService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';

const STORAGE_KEY = 'alfreyaa_chat_history';
const INITIAL_MESSAGE: Message = {
  id: 'alfreyaa-init',
  text: "Greetings, Kaarthi. Alfreyaa is operational.",
  sender: 'ai',
  type: 'text',
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        setMessages(JSON.parse(storedHistory));
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      setMessages([INITIAL_MESSAGE]);
    }
  }, []);

  useEffect(() => {
    try {
        if(messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
    scrollToBottom();
  }, [messages]);
  
  const handleClearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire chat history? This action cannot be undone.")) {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([INITIAL_MESSAGE]);
    }
  }, []);

  const handleSendMessage = async (prompt: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      sender: 'user',
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const lowerCasePrompt = prompt.toLowerCase();
      const urlRegex = /(https?:\/\/\S+)/;
      const urlMatch = prompt.match(urlRegex);

      const searchKeywords = ["search for", "what is", "who is", "find out", "latest", "look up", "tell me about", "what's new"];
      const deployKeywords = ["deploy", "publish", "go live"];
      const modificationKeywords = ["change your", "modify the", "update the", "add a feature", "implement a", "rewrite the"];

      if (modificationKeywords.some(keyword => lowerCasePrompt.startsWith(keyword))) {
        const files = await getProjectFiles();
        const modificationPayload = await generateCodeModification(prompt, files);
        
        const aiModificationMessage: Message = {
            id: Date.now().toString() + '-ai-mod',
            text: modificationPayload.explanation, // Fallback text
            sender: 'ai',
            type: 'code_modification',
            codeModification: modificationPayload
        };
        setMessages(prev => [...prev, aiModificationMessage]);

      } else if (lowerCasePrompt.includes('generate image') || lowerCasePrompt.includes('show me a picture')) {
        const imageUrl = await generateImageResponse(prompt);
        const aiImageMessage: Message = {
          id: Date.now().toString() + '-ai-img',
          text: "As you wish, Kaarthi. Here is the generated image.",
          sender: 'ai',
          type: 'image',
          imageUrl: imageUrl,
        };
        setMessages(prev => [...prev, aiImageMessage]);
      } else if (urlMatch) {
          const url = urlMatch[0];
          const content = await fetchWebsiteContent(url);
          const analysisText = await generateWebsiteAnalysis(prompt, content);
          const aiAnalysisMessage: Message = {
            id: Date.now().toString() + '-ai-web',
            text: analysisText,
            sender: 'ai',
            type: 'website_analysis',
            analyzedUrl: url,
          };
          setMessages(prev => [...prev, aiAnalysisMessage]);
      } else if (searchKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
        const { text, sources } = await generateGroundedResponse(prompt);
        const aiGroundedMessage: Message = {
          id: Date.now().toString() + '-ai-grd',
          text,
          sender: 'ai',
          type: 'grounded_text',
          sources,
        };
        setMessages(prev => [...prev, aiGroundedMessage]);
      } else if (deployKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
          const deploymentMessageId = Date.now().toString() + '-ai-deploy';
          const onProgress = (update: { status: DeploymentStatus; message: string; url?: string }) => {
            setMessages(prev => {
                const existingMsgIndex = prev.findIndex(m => m.id === deploymentMessageId);
                if (existingMsgIndex > -1) {
                    const updatedMessages = [...prev];
                    updatedMessages[existingMsgIndex] = {
                        ...updatedMessages[existingMsgIndex],
                        text: update.message,
                        deploymentStatus: update.status,
                        deploymentUrl: update.url
                    };
                    return updatedMessages;
                } else {
                    const newDeploymentMessage: Message = {
                        id: deploymentMessageId,
                        text: update.message,
                        sender: 'ai',
                        type: 'deployment',
                        deploymentStatus: update.status,
                        deploymentUrl: update.url,
                    };
                    return [...prev, newDeploymentMessage];
                }
            });
          };
          await deployApp(onProgress);
      }
      else {
        const aiResponseText = await generateTextResponse(prompt);
        const aiTextMessage: Message = {
          id: Date.now().toString() + '-ai-txt',
          text: aiResponseText,
          sender: 'ai',
          type: 'text',
        };
        setMessages(prev => [...prev, aiTextMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-err',
        text: error instanceof Error ? error.message : "An unknown error occurred.",
        sender: 'ai',
        type: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
       <style>{`
        :root {
          --tw-color-deep-purple-400: #a78bfa;
          --tw-color-deep-purple-500: #8b5cf6;
          --tw-color-deep-purple-600: #7c3aed;
          --tw-color-light-blue-300: #93c5fd;
          --tw-color-light-blue-400: #60a5fa;
          --tw-color-light-blue-600: #2563eb;
        }
        .bg-deep-purple-400 { background-color: var(--tw-color-deep-purple-400) }
        .bg-deep-purple-500 { background-color: var(--tw-color-deep-purple-500) }
        .bg-deep-purple-600 { background-color: var(--tw-color-deep-purple-600) }
        .bg-light-blue-400 { background-color: var(--tw-color-light-blue-400) }
        .bg-light-blue-600 { background-color: var(--tw-color-light-blue-600) }
        .text-deep-purple-400 { color: var(--tw-color-deep-purple-400) }
        .text-light-blue-300 { color: var(--tw-color-light-blue-300) }
        .text-light-blue-400 { color: var(--tw-color-light-blue-400) }
        .focus\\:ring-deep-purple-500:focus { --tw-ring-color: var(--tw-color-deep-purple-500) }
        .hover\\:bg-deep-purple-500:hover { background-color: var(--tw-color-deep-purple-500) }
        .hover\\:text-light-blue-300:hover { color: var(--tw-color-light-blue-300) }
       `}</style>
      <Header onClearHistory={handleClearHistory} />
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>
      </main>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;