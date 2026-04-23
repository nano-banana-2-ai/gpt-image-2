/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Search, Image as ImageIcon, Loader2, Download, RefreshCw, Send, Sparkles } from 'lucide-react';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface ImageGenerationResult {
  url: string;
  prompt: string;
  timestamp: number;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [history, setHistory] = useState<ImageGenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        const newResult = {
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now(),
        };
        setResult(newResult);
        setHistory(prev => [newResult, ...prev].slice(0, 5));
      } else {
        throw new Error('No image was generated. Please try a different prompt.');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image. Please check your API key or try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-image-${name.slice(0, 20).replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-purple-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl shadow-lg shadow-purple-500/20">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">AI Image Studio</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Powered by Gemini
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center -mt-20">
          <AnimatePresence mode="wait">
            {!result && !isGenerating ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center max-w-md"
              >
                <div className="w-20 h-20 bg-neutral-900/50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-neutral-800">
                  <ImageIcon className="w-10 h-10 text-neutral-500" />
                </div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Imagine anything.</h2>
                <p className="text-neutral-400 leading-relaxed font-light">
                  Describe what you want to see, and AI will create it for you in seconds.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
              >
                <div className="relative group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
                  {isGenerating ? (
                    <div className="aspect-square flex flex-col items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-12 text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin relative" />
                      </div>
                      <p className="text-lg font-medium text-neutral-200 mb-2">Creating your masterpiece...</p>
                      <p className="text-sm text-neutral-500 italic max-w-xs px-4 truncate">"{prompt}"</p>
                    </div>
                  ) : result && (
                    <div className="relative">
                      <img 
                        src={result.url} 
                        alt={result.prompt} 
                        className="w-full h-auto aspect-square object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadImage(result.url, result.prompt)}
                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors text-white"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => generateImage()}
                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors text-white"
                            title="Regenerate"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Input Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <form 
              onSubmit={generateImage}
              className="relative group"
            >
              <div className="absolute inset-0 bg-purple-500/10 blur-2xl group-focus-within:bg-purple-500/20 transition-all rounded-full" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cybernetic garden with neon flowers..."
                className="w-full bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl py-5 pl-7 pr-20 text-lg focus:outline-none focus:ring-1 focus:ring-purple-500/50 shadow-2xl transition-all placeholder:text-neutral-600"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white text-black rounded-xl hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all font-bold"
              >
                {isGenerating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </form>
            
            {/* Examples / Help */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 overflow-hidden h-8">
              {['Cyberpunk city', 'Oil painting of cats', 'Modern architecture', 'Space travel'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-xs px-3 py-1 rounded-full bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 transition-colors hidden sm:block"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
