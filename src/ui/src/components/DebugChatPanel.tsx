import React, { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Paper,
  TextInput,
  ActionIcon,
  ScrollArea,
  Text,
  Loader,
  Group,
  Code,
  Button,
  Avatar,
} from '@mantine/core';
import { Send, Sparkles, User, Bot } from 'lucide-react';
import { ipc } from '../ipc';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DebugChatPanelProps {
  testName: string;
  workspacePath: string;
  onClose?: () => void;
}

const DebugChatPanel: React.FC<DebugChatPanelProps> = ({ testName, workspacePath, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
    };

    // Add user message to state
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call RAG chat service
      const response = await ipc.rag.chat({
        workspacePath,
        testName,
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      if (response.success && response.response) {
        // Add AI response to state
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: response.response,
          },
        ]);
      } else {
        // Show error message
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: `Error: ${response.error || 'Failed to get AI response'}`,
          },
        ]);
      }
    } catch (error: any) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `Error: ${error.message || 'Failed to communicate with AI service'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const formatMessage = (content: string) => {
    // Simple code block detection and formatting
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        content: match[2],
        language: match[1] || 'typescript',
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    // If no code blocks found, return as text
    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }

    return parts;
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
      <Stack gap={0} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper p="md" withBorder style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group justify="space-between">
          <Group gap="xs">
            <Sparkles size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={600} size="lg">AI Debug Assistant</Text>
          </Group>
          {onClose && (
            <Button variant="subtle" size="xs" onClick={onClose}>
              Close
            </Button>
          )}
        </Group>
        <Text size="sm" c="dimmed" mt="xs">
          Ask questions about the test failure. The AI has access to the test code and error logs.
        </Text>
      </Paper>

      {/* Messages Area */}
      <ScrollArea
        ref={scrollAreaRef}
        style={{ flex: 1, minHeight: 0 }}
        p="md"
      >
        {messages.length === 0 ? (
          <Stack gap="md" align="center" justify="center" h="100%" py="xl">
            <Sparkles size={48} color="var(--mantine-color-blue-4)" />
            <Text size="lg" fw={500} ta="center">
              Start debugging with AI
            </Text>
            <Text size="sm" c="dimmed" ta="center" maw={400}>
              Ask questions about why the test failed, request code fixes, or get explanations about the error.
            </Text>
            <Stack gap="xs" mt="md">
              <Button
                variant="light"
                size="sm"
                onClick={() => handleQuickPrompt('Why did this test fail?')}
              >
                Why did this test fail?
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => handleQuickPrompt('What is the root cause of the failure?')}
              >
                What is the root cause of the failure?
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => handleQuickPrompt('Suggest a fix for this error')}
              >
                Suggest a fix for this error
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack gap="lg" p="md">
            {messages.map((message, index) => {
              const parts = formatMessage(message.content);
              const isUser = message.role === 'user';

              return (
                <Group
                  key={index}
                  gap="xs"
                  align="flex-end"
                  justify={isUser ? 'flex-end' : 'flex-start'}
                  style={{ width: '100%' }}
                >
                  {/* Avatar - only show for AI messages */}
                  {!isUser && (
                    <Avatar
                      size="sm"
                      radius="xl"
                      color="blue"
                      style={{ flexShrink: 0 }}
                    >
                      <Bot size={16} />
                    </Avatar>
                  )}

                  {/* Message Bubble */}
                  <Paper
                    p="md"
                    style={{
                      backgroundColor: isUser 
                        ? 'var(--mantine-color-blue-6)' 
                        : 'var(--mantine-color-dark-6)',
                      color: 'white',
                      borderRadius: '16px',
                      maxWidth: '75%',
                      borderTopLeftRadius: isUser ? '16px' : '4px',
                      borderTopRightRadius: isUser ? '4px' : '16px',
                    }}
                  >
                    <Stack gap="xs">
                      {parts.map((part, partIndex) => {
                        if (part.type === 'code') {
                          return (
                            <Code
                              key={partIndex}
                              block
                              style={{
                                fontSize: '0.875rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                color: 'var(--mantine-color-gray-0)',
                                padding: '12px',
                                borderRadius: '8px',
                                overflowX: 'auto',
                                margin: 0,
                              }}
                            >
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {part.content}
                              </pre>
                            </Code>
                          );
                        } else {
                          return (
                            <Text
                              key={partIndex}
                              size="sm"
                              c="white"
                              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                              {part.content}
                            </Text>
                          );
                        }
                      })}
                    </Stack>
                  </Paper>

                  {/* Avatar - only show for user messages */}
                  {isUser && (
                    <Avatar
                      size="sm"
                      radius="xl"
                      color="blue"
                      style={{ flexShrink: 0 }}
                    >
                      <User size={16} />
                    </Avatar>
                  )}
                </Group>
              );
            })}
            
            {/* Typing Indicator */}
            {isLoading && (
              <Group
                gap="xs"
                align="flex-end"
                justify="flex-start"
                style={{ width: '100%' }}
              >
                <Avatar
                  size="sm"
                  radius="xl"
                  color="blue"
                  style={{ flexShrink: 0 }}
                >
                  <Bot size={16} />
                </Avatar>
                <Paper
                  p="md"
                  style={{
                    backgroundColor: 'var(--mantine-color-dark-6)',
                    color: 'white',
                    borderRadius: '16px',
                    borderTopLeftRadius: '4px',
                    maxWidth: '75%',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  <Group gap="xs">
                    <Loader size="sm" color="white" />
                    <Text size="sm" c="white">Thinking...</Text>
                  </Group>
                </Paper>
              </Group>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </ScrollArea>

      {/* Input Area - Footer */}
      <Paper 
        p="md" 
        withBorder 
        style={{ 
          borderTop: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-gray-0)',
        }}
      >
        <TextInput
          placeholder="Ask a question about the test failure..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isLoading}
          rightSection={
            <ActionIcon
              size="lg"
              variant="filled"
              color="blue"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              radius="xl"
            >
              <Send size={18} />
            </ActionIcon>
          }
          styles={{
            input: {
              paddingRight: '50px',
            },
          }}
        />
      </Paper>
      </Stack>
    </>
  );
};

export default DebugChatPanel;

