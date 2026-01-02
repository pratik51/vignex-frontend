import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Text, VStack, Badge, Flex, 
  Button, Input, FormControl, FormLabel, useToast,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, 
  Tabs, TabList, TabPanels, Tab, TabPanel, Avatar, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure
} from '@chakra-ui/react';
// import { CheckCircleIcon, TimeIcon } from '@chakra-ui/icons'; // Optional: Uncomment if you installed icons
import axios from 'axios';

// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

function App() {
  // --- STATE ---
  const [user, setUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trades, setTrades] = useState<any[]>([]);
  
  // Trade Form State
  const [amount, setAmount] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure(); 
  const toast = useToast();

  // --- ACTIONS ---
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/login`, { email, password });
      setUser(res.data);
    } catch (err) {
      toast({ title: 'Login Failed', status: 'error' });
    }
    setIsLoading(false);
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users`, { email, password });
      setUser(res.data);
    } catch (err) {
      toast({ title: 'Signup Failed', status: 'error' });
    }
    setIsLoading(false);
  };

  const handleTrade = async () => {
    if(!amount || isNaN(Number(amount))) return;
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/trades`, {
        sellerId: user.id,
        buyerId: Number(buyerId),
        amount: Number(amount)
      });
      toast({ title: 'Order Created', status: 'success' });
      setAmount('');
      onClose(); 
      fetchData(); 
    } catch (error: any) {
      toast({ title: 'Failed', description: error.response?.data?.message, status: 'error' });
    }
    setIsLoading(false);
  };

  const handleRelease = async (tradeId: number) => {
    try {
      await axios.post(`${API_URL}/trades/${tradeId}/release`);
      toast({ title: 'Released', status: 'success' });
      fetchData(); 
    } catch (error: any) {
      toast({ title: 'Error', status: 'error' });
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      const userRes = await axios.get(`${API_URL}/users/${user.id}`);
      setUser(userRes.data);
      const tradeRes = await axios.get(`${API_URL}/trades`);
      setTrades(tradeRes.data.sort((a: any, b: any) => b.id - a.id));
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <Box minH="100vh" bg="#1E2329" color="white" display="flex" alignItems="center" justifyContent="center">
        <Box bg="#2B3139" p={8} borderRadius="lg" w="full" maxW="md" border="1px solid #474D57">
          <Heading textAlign="center" mb={6} color="#FCD535">VIGNEX</Heading>
          <Tabs isFitted variant="soft-rounded" colorScheme="yellow">
            <TabList mb="1em">
              <Tab color="gray.400" _selected={{ color: 'black', bg: '#FCD535' }}>Log In</Tab>
              <Tab color="gray.400" _selected={{ color: 'black', bg: '#FCD535' }}>Sign Up</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <VStack spacing={4}>
                  <Input value={email} onChange={e => setEmail(e.target.value)} bg="#1E2329" border="none" placeholder="Email" _placeholder={{ color: 'gray.500' }} />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} bg="#1E2329" border="none" placeholder="Password" _placeholder={{ color: 'gray.500' }} />
                  <Button w="full" bg="#FCD535" color="black" _hover={{ bg: '#E4BD28' }} onClick={handleLogin} isLoading={isLoading}>Log In</Button>
                </VStack>
              </TabPanel>
              <TabPanel>
                <VStack spacing={4}>
                  <Input value={email} onChange={e => setEmail(e.target.value)} bg="#1E2329" border="none" placeholder="Email" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} bg="#1E2329" border="none" placeholder="Password" />
                  <Button w="full" bg="#FCD535" color="black" _hover={{ bg: '#E4BD28' }} onClick={handleSignup} isLoading={isLoading}>Register</Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    );
  }

  // --- BINANCE P2P DASHBOARD ---
  return (
    <Box minH="100vh" bg="#181A20" color="white" fontFamily="Arial, sans-serif">
      {/* HEADER */}
      <Flex h="64px" px={6} align="center" justify="space-between" bg="#1E2329" borderBottom="1px solid #2B3139">
        <Flex align="center" gap={8}>
          <Heading size="md" color="#FCD535" letterSpacing="-1px">VIGNEX <Text as="span" color="white" fontSize="xs" fontWeight="normal">P2P</Text></Heading>
          <Flex gap={6} display={{ base: 'none', md: 'flex' }} fontSize="sm" fontWeight="500">
            <Text color="white">Buy Crypto</Text>
            <Text color="gray.400">Markets</Text>
            <Text color="gray.400">Trade</Text>
          </Flex>
        </Flex>
        <Flex align="center" gap={4}>
          <Flex align="center" gap={2} bg="#2B3139" px={3} py={1} borderRadius="full">
            <Text fontSize="xs" color="gray.400">Balance:</Text>
            <Text fontSize="sm" fontWeight="bold">{Number(user.usdtBalance).toLocaleString()} USDT</Text>
          </Flex>
          <Avatar size="xs" bg="#FCD535" />
          <Button size="xs" variant="ghost" color="gray.400" onClick={() => setUser(null)}>Log Out</Button>
        </Flex>
      </Flex>

      <Container maxW="container.xl" py={8}>
        
        {/* ACTION HEADER */}
        <Flex justify="space-between" align="center" mb={6}>
           <Heading size="lg" fontWeight="semibold">P2P: Buy & Sell USDT</Heading>
           <Button bg="#FCD535" color="black" _hover={{ bg: '#E4BD28' }} onClick={onOpen}>
              + Post New Ad
           </Button>
        </Flex>

        {/* TABS (BUY / SELL) */}
        <Tabs variant="unstyled" defaultIndex={0} mb={6}>
          <TabList>
            <Tab 
              fontSize="lg" fontWeight="bold" px={0} mr={6} 
              color="gray.500" _selected={{ color: '#0ECB81' }}
            >
              Buy
            </Tab>
            <Tab 
              fontSize="lg" fontWeight="bold" px={0} 
              color="gray.500" _selected={{ color: '#F6465D' }}
            >
              Sell
            </Tab>
          </TabList>
          <Divider borderColor="#2B3139" mb={6} />
        </Tabs>

        {/* ORDER BOOK TABLE */}
        <Box bg="#1E2329" borderRadius="xl" overflow="hidden">
          <TableContainer>
            <Table variant="simple">
              <Thead bg="#2B3139">
                <Tr>
                  <Th color="gray.500" borderBottom="none" textTransform="none">Advertiser</Th>
                  <Th color="gray.500" borderBottom="none" textTransform="none">Price</Th>
                  <Th color="gray.500" borderBottom="none" textTransform="none">Limit/Available</Th>
                  <Th color="gray.500" borderBottom="none" textTransform="none">Payment</Th>
                  <Th color="gray.500" borderBottom="none" textTransform="none">Trade</Th>
                </Tr>
              </Thead>
              <Tbody>
                {trades.map((trade) => {
                  const isSeller = trade.seller.id === user.id;
                  
                  // MOCK DATA TO LOOK LIKE BINANCE
                  const price = 89.45; // Hardcoded INR Price for visuals
                  const limitMin = 5000;
                  const limitMax = 500000;
                  
                  return (
                    <Tr key={trade.id} _hover={{ bg: '#2B3139' }}>
                      {/* 1. ADVERTISER */}
                      <Td borderBottom="1px solid #2B3139">
                        <Flex align="center" gap={2}>
                          <Avatar size="sm" name={`User ${trade.seller.id}`} bg="gray.600" />
                          <Box>
                            <Text color="#FCD535" fontWeight="bold">
                               {isSeller ? 'Me (Seller)' : `User #${trade.seller.id}`}
                            </Text>
                            <Flex align="center" gap={1}>
                               <Text fontSize="xs" color="gray.400">120 orders</Text>
                               <Divider orientation="vertical" h="10px" />
                               <Text fontSize="xs" color="gray.400">98% completion</Text>
                            </Flex>
                          </Box>
                        </Flex>
                      </Td>

                      {/* 2. PRICE */}
                      <Td borderBottom="1px solid #2B3139">
                        <Text fontSize="xl" fontWeight="bold" color="white">
                          ₹ {price}
                        </Text>
                      </Td>

                      {/* 3. LIMITS */}
                      <Td borderBottom="1px solid #2B3139">
                        <VStack align="start" spacing={0}>
                          <Flex fontSize="sm" gap={2}>
                             <Text color="gray.400">Available</Text>
                             <Text fontWeight="bold">{trade.amount} USDT</Text>
                          </Flex>
                          <Flex fontSize="sm" gap={2}>
                             <Text color="gray.400">Limit</Text>
                             <Text fontWeight="bold">₹{limitMin.toLocaleString()} - ₹{limitMax.toLocaleString()}</Text>
                          </Flex>
                        </VStack>
                      </Td>

                      {/* 4. PAYMENT */}
                      <Td borderBottom="1px solid #2B3139">
                         <Flex gap={2}>
                           <Badge bg="#FFF2CC" color="#F0B90B" textTransform="none" borderRadius="sm">IMPS</Badge>
                           <Badge bg="#E6FFFA" color="#319795" textTransform="none" borderRadius="sm">UPI</Badge>
                         </Flex>
                      </Td>

                      {/* 5. ACTION BUTTON */}
                      <Td borderBottom="1px solid #2B3139">
                        <Flex align="center" gap={4}>
                           <Badge 
                              fontSize="xs" 
                              colorScheme={trade.status === 'COMPLETED' ? 'green' : 'yellow'} 
                              variant="subtle"
                           >
                             {trade.status}
                           </Badge>
                           
                           {/* RELEASE BUTTON (Only for Seller) */}
                           {isSeller && trade.status === 'PENDING' && (
                             <Button 
                               size="sm" bg="#0ECB81" color="white" _hover={{ bg: '#06A669' }}
                               onClick={() => handleRelease(trade.id)}
                             >
                               Release USDT
                             </Button>
                           )}
                           
                           {/* VIEW BUTTON */}
                           {!isSeller && (
                              <Button size="sm" variant="outline" colorScheme="gray">
                                View Details
                              </Button>
                           )}
                        </Flex>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Container>

      {/* NEW TRADE MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter='blur(5px)' />
        <ModalContent bg="#2B3139" color="white">
          <ModalHeader>Create P2P Order</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="gray.400">Buyer ID</FormLabel>
                <Input bg="#1E2329" border="none" value={buyerId} onChange={(e) => setBuyerId(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400">Amount (USDT)</FormLabel>
                <Input bg="#1E2329" border="none" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </FormControl>
              <Button w="full" bg="#0ECB81" color="white" _hover={{ bg: '#06A669' }} onClick={handleTrade} isLoading={isLoading}>
                Post Order
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  );
}

export default App;