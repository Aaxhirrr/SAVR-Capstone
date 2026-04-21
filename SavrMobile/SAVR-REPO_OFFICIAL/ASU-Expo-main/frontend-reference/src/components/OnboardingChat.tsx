import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IoChatboxOutline } from 'react-icons/io5';
import { BsArrowUpCircleFill } from 'react-icons/bs';
import { LuCamera } from 'react-icons/lu';
import { onboardingChatService, ChatMessage } from '@/services/chatService';
import { useToast } from '@/components/ui/use-toast';
import { compressImage } from '@/utils/imageUtils';
import MarkdownText from '@/components/MarkdownText';
import { cn } from '@/lib/utils';
import heic2any from 'heic2any';

interface OnboardingChatProps {
  /** Called when the user clicks "Check Prices" / "Sign Up to Save" on the list */
  onSignupPrompt?: (sessionId: string) => void;
}

/**
 * Self-contained onboarding chat for the landing page.
 * No auth required. Calls /chat/onboarding/* endpoints.
 */
export default function OnboardingChat({ onSignupPrompt }: OnboardingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem('onboarding-session-id'),
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasUserInteracted = useRef(false);
  const { toast } = useToast();

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Scroll only the chat container (not the page) to bottom
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (hasUserInteracted.current) {
      scrollToBottom();
    }
  }, [messages, streamingMessage, scrollToBottom]);

  // Initialize with welcome message
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);

    (async () => {
      setIsLoading(true);
      try {
        const welcome = await onboardingChatService.getWelcomeMessage();
        if (welcome.session_id && !welcome.session_id.startsWith('error-')) {
          setSessionId(welcome.session_id);
          localStorage.setItem('onboarding-session-id', welcome.session_id);
        }
        setMessages([
          {
            id: 'welcome',
            content: welcome.content,
            is_user: false,
            timestamp: welcome.timestamp,
          },
        ]);
      } catch {
        setMessages([
          {
            id: 'welcome-fallback',
            content:
              "Hey! I'm Savr — the smartest way to plan meals and shop for groceries. I can help with meal ideas, recipes, grocery lists, and more. So — what are you in the mood for? 🍳",
            is_user: false,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isInitialized]);

  const clearSelectedImage = useCallback(() => {
    setSelectedImage(null);
    setImageBase64(null);
    setImagePreviewUrl(null);
    setIsProcessingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setImageBase64(base64String);
      setIsProcessingImage(false);
    };
    reader.onerror = () => {
      toast({ title: 'Error Reading File', description: 'Could not process the selected image.', variant: 'destructive' });
      clearSelectedImage();
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    let processedFile = file;

    // HEIC conversion
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        const conversionResult = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
        const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        processedFile = new File([convertedBlob], `${baseName}.jpg`, { type: 'image/jpeg' });
      } catch (err: any) {
        if (err?.code === 1 && err?.message?.includes('Image is already browser readable')) {
          // File is already readable, use as-is
          if (!file.type?.startsWith('image/')) {
            processedFile = new File([file], file.name, { type: 'image/jpeg' });
          }
        } else {
          toast({ title: 'HEIC Conversion Error', description: 'Could not convert HEIC image. Please try a different format.', variant: 'destructive' });
          clearSelectedImage();
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      }
    }

    if (!processedFile.type.startsWith('image/')) {
      toast({ title: 'Invalid File Type', description: 'Please select an image file.', variant: 'destructive' });
      clearSelectedImage();
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (processedFile.size > 10 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please select an image smaller than 10MB.', variant: 'destructive' });
      clearSelectedImage();
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const compressedFile = await compressImage(processedFile);
      setSelectedImage(compressedFile);

      // Preview
      const previewReader = new FileReader();
      previewReader.onloadend = () => setImagePreviewUrl(previewReader.result as string);
      previewReader.readAsDataURL(compressedFile);

      convertToBase64(compressedFile);
    } catch {
      toast({ title: 'Compression Error', description: 'Error compressing image. Please try a different image.', variant: 'destructive' });
      clearSelectedImage();
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !selectedImage) || isLoading || isProcessingImage) return;
    if (selectedImage && !imageBase64) {
      toast({ title: 'Image Still Processing', description: 'Please wait a moment for the image to be ready.', variant: 'default' });
      return;
    }

    const imageToSend = imageBase64;
    const mediaType = selectedImage?.type;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      content: text,
      is_user: true,
      timestamp: new Date().toISOString(),
      imageBase64: imageToSend || undefined,
      imageMediaType: mediaType || undefined,
    };
    hasUserInteracted.current = true;
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    clearSelectedImage();
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const response = await onboardingChatService.sendMessageStream(
        {
          sessionId: sessionId || undefined,
          message: text || '(image)',
          imageBase64: imageToSend,
          imageMediaType: mediaType,
          context: {},
        },
        (delta) => {
          setStreamingMessage((prev) => {
            if (!prev) {
              return {
                id: 'streaming',
                content: delta,
                is_user: false,
                timestamp: new Date().toISOString(),
              };
            }
            return { ...prev, content: prev.content + delta };
          });
          setIsLoading(false);
        },
      );

      if (response.sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem('onboarding-session-id', response.sessionId);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        content: response.botResponse,
        is_user: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setStreamingMessage(null);
    } catch (err) {
      console.error('Onboarding stream error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Sorry, something went wrong. Let's try again!",
          is_user: false,
          timestamp: new Date().toISOString(),
        },
      ]);
      setStreamingMessage(null);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const sendDisabled = isLoading || isProcessingImage || (!input.trim() && !selectedImage) || !!(selectedImage && !imageBase64);

  return (
    <div className="flex flex-col h-full max-h-[680px] sm:max-h-[800px]">
      {/* Header */}
      <div className="flex items-center space-x-3 px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-t-xl sm:rounded-t-2xl">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <IoChatboxOutline className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Savr Assistant
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try it now — no signup needed
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={cn(
                'max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3',
                msg.is_user
                  ? 'bg-green-500 text-white rounded-br-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md',
              )}
            >
              <div className="text-sm text-left">
                <MarkdownText text={msg.content} />
              </div>
              {msg.imageBase64 && msg.imageMediaType && (
                <div className="mt-2">
                  <img
                    src={`data:${msg.imageMediaType};base64,${msg.imageBase64}`}
                    alt="User uploaded"
                    className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming */}
        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white">
              <div className="text-sm text-left">
                <MarkdownText text={streamingMessage.content} />
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && !streamingMessage && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 text-slate-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Signup prompt - show after a few messages */}
      {messages.length >= 5 && onSignupPrompt && sessionId && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800">
          <button
            onClick={() => onSignupPrompt(sessionId)}
            className="w-full text-center text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            Sign up free to compare prices across stores and save on your list
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-600 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-b-xl sm:rounded-b-2xl">
        {/* Image Preview */}
        {imagePreviewUrl && (
          <div className="mb-2 relative inline-block">
            <div className="relative p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
              <img
                src={imagePreviewUrl}
                alt="Selected preview"
                className="max-h-16 sm:max-h-20 max-w-full rounded-lg object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
                onClick={clearSelectedImage}
                title="Remove image"
                disabled={isLoading}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingImage}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 disabled:opacity-40 flex-shrink-0"
            aria-label="Upload image"
          >
            <LuCamera className="h-5 w-5" />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const ta = e.target;
              ta.style.height = 'auto';
              ta.style.height = `${Math.min(ta.scrollHeight, 72)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendDisabled) handleSend(e as unknown as React.FormEvent);
              }
            }}
            placeholder={
              isProcessingImage
                ? 'Processing image...'
                : selectedImage
                ? 'Add a description for the image...'
                : 'What are you cooking this week?'
            }
            disabled={isLoading && !streamingMessage}
            rows={1}
            className="flex-1 min-h-[40px] max-h-[72px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none resize-none text-sm leading-relaxed placeholder:text-slate-400 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={sendDisabled}
            className="text-green-500 hover:text-green-600 transition-colors disabled:opacity-40 flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading || isProcessingImage ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <BsArrowUpCircleFill className="h-7 w-7" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
