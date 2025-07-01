'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSendMessage, disabled, placeholder }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations('chat');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enterで改行、Enterのみで送信
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder || t('typeMessage')}
        disabled={disabled}
        className="resize-none"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        size="icon"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">{t('send')}</span>
      </Button>
    </div>
  );
}