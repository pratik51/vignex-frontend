import { useEffect, useState, useRef } from 'react';
import { 
  Box, VStack, Text, Input, Button, HStack, Flex 
} from '@chakra-ui/react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ChatProps {
  tradeId: number;
  userId: number;
}

export default function Chat({ tradeId, userId }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Connect to WebSocket
    socketRef.current = io(API_URL);

    // 2. Join the Trade Room
    socketRef.current.emit('joinTrade', tradeId);

    // 3. Listen for History
    socketRef.current.on('loadHistory', (history: any[]) => {
      setMessages(history);
      scrollToBottom();
    });

    // 4. Listen for New Messages
    socketRef.current.on('newMessage', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [tradeId]);

  const scrollToBottom = () => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = () => {
    if (!text.trim() || !socketRef.current) return;
    
    const payload = {
      tradeId,
      senderId: userId,
      text
    };

    socketRef.current.emit('sendMessage', payload);
    setText('');
  };

  return (
    <VStack h="400px" bg="#1A202C" borderRadius="md" overflow="hidden" spacing={0}>
      {/* Messages Area */}
      <Box flex={1} w="full" overflowY="auto" p={4} css={{ '&::-webkit-scrollbar': { width: '4px' } }}>
        {messages.map((msg, i) => {
          const isMe = msg.sender?.id === userId || msg.senderId === userId;
          return (
            <Flex key={i} justify={isMe ? 'flex-end' : 'flex-start'} mb={2}>
              <Box 
                bg={isMe ? '#FCD535' : '#2D3748'} 
                color={isMe ? 'black' : 'white'}
                px={3} py={2} 
                borderRadius="lg"
                maxW="80%"
              >
                {!isMe && <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.400">User #{msg.sender?.id || msg.senderId}</Text>}
                <Text fontSize="sm">{msg.text}</Text>
              </Box>
            </Flex>
          );
        })}
        <div ref={endRef} />
      </Box>

      {/* Input Area */}
      <HStack w="full" p={2} bg="#2B3139" borderTop="1px solid #4A5568">
        <Input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Type a message..." 
          bg="#1A202C" 
          border="none"
          color="white"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button bg="#FCD535" color="black" onClick={handleSend}>Send</Button>
      </HStack>
    </VStack>
  );
}