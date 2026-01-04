import { useEffect, useState, useRef } from 'react';
import { 
  Box, VStack, Text, Input, Button, HStack, Avatar, Image, 
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure 
} from '@chakra-ui/react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Chat({ tradeId, userId }: { tradeId: number, userId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image Zoom State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [zoomedImage, setZoomedImage] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    
    // Join the specific trade room
    newSocket.emit('joinTrade', { tradeId });
    
    // Listen for history and new messages
    newSocket.on('previousMessages', (msgs) => setMessages(msgs));
    newSocket.on('newMessage', (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      newSocket.disconnect();
    };
  }, [tradeId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('sendMessage', { 
      tradeId, 
      senderId: userId, 
      content: input, 
      type: 'TEXT' 
    });
    setInput('');
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert Image to Base64 String
    const reader = new FileReader();
    reader.onloadend = () => {
       const base64String = reader.result;
       
       // Send to Backend
       socket.emit('sendMessage', { 
         tradeId, 
         senderId: userId, 
         content: 'Sent an image', // Fallback text
         type: 'IMAGE', 
         imageUrl: base64String 
       });
    };
    reader.readAsDataURL(file);
  };

  return (
    <VStack h="400px" justify="space-between">
      {/* MESSAGE LIST */}
      <VStack w="full" flex={1} overflowY="auto" spacing={3} align="stretch" p={2} bg="#181A20" borderRadius="md">
        {messages.map((msg, i) => {
           const isMe = msg.sender.id === userId;
           return (
             <Box 
                key={i} 
                alignSelf={isMe ? 'flex-end' : 'flex-start'} 
                bg={isMe ? '#FCD535' : 'gray.700'} 
                color={isMe ? 'black' : 'white'}
                p={2} 
                borderRadius="md" 
                maxW="70%"
             >
                <HStack mb={1}>
                    <Avatar size="xs" src="https://bit.ly/broken-link" />
                    <Text fontSize="xs" fontWeight="bold">User {msg.sender.id}</Text>
                </HStack>

                {/* RENDER TEXT OR IMAGE */}
                {msg.type === 'IMAGE' ? (
                   <Image 
                     src={msg.imageUrl} 
                     maxH="150px" 
                     borderRadius="md" 
                     cursor="pointer" 
                     border="2px solid white"
                     onClick={() => { setZoomedImage(msg.imageUrl); onOpen(); }} 
                   />
                ) : (
                   <Text fontSize="sm">{msg.content}</Text>
                )}
             </Box>
           )
        })}
      </VStack>
      
      {/* INPUT AREA */}
      <HStack w="full" pt={2}>
        {/* Hidden File Input */}
        <Input 
          type="file" 
          display="none" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileUpload} 
        />
        
        {/* Camera Button */}
        <Button size="sm" bg="gray.600" onClick={() => fileInputRef.current?.click()}>
            📷
        </Button>

        <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Type a message..." 
            bg="gray.700" 
            border="none" 
            color="white"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button onClick={sendMessage} bg="#FCD535" color="black">Send</Button>
      </HStack>

      {/* IMAGE ZOOM MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" bg="rgba(0,0,0,0.5)" borderRadius="full" />
          <ModalBody p={0} display="flex" justifyContent="center">
             <Image src={zoomedImage} maxH="80vh" borderRadius="md" />
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}