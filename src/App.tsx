import Chat from './Chat'; 
import PostAdWizard from './PostAdWizard';
import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Text, VStack, Badge, Flex, 
  Button, Input, FormControl, FormLabel, useToast,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, 
  Tabs, TabList, TabPanels, Tab, TabPanel, Avatar, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  Select, HStack
} from '@chakra-ui/react';
import axios from 'axios';

// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- HELPER: Format Seconds ---
const formatTime = (seconds: number) => {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

function App() {
  // --- STATE ---
  const [user, setUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [ads, setAds] = useState<any[]>([]);       // Public Ads
  const [myAds, setMyAds] = useState<any[]>([]);   // My Merchant Ads
  const [myTrades, setMyTrades] = useState<any[]>([]);

  // Chat 
  const [chatTradeId, setChatTradeId] = useState<number | null>(null);
  const { isOpen: isChatOpen, onOpen: onChatOpen, onClose: onChatClose } = useDisclosure();
  
  // Buy Form
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [buyAmount, setBuyAmount] = useState(''); 

  const { isOpen: isAdOpen, onOpen: onAdOpen, onClose: onAdClose } = useDisclosure();
  const { isOpen: isBuyOpen, onOpen: onBuyOpen, onClose: onBuyClose } = useDisclosure();
  
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // --- AUTH ACTIONS ---
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/users/login`, { email, password });
      setUser(res.data);
    } catch (err) { toast({ title: 'Login Failed', status: 'error' }); }
  };

  const handleSignup = async () => {
    try {
      const res = await axios.post(`${API_URL}/users`, { email, password });
      setUser(res.data);
    } catch (err) { toast({ title: 'Signup Failed', status: 'error' }); }
  };

  // --- AD ACTIONS ---
  
  // 1. Post New Ad (Wizard)
  const handlePostAd = async (adData: any) => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/ads`, {
        sellerId: user.id,
        ...adData
      });
      toast({ title: 'Ad Posted', status: 'success' });
      onAdClose();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, status: 'error' });
    }
    setIsLoading(false);
  };

  // 2. Manage Ads (Pause / Delete)
  const handleAdAction = async (adId: number, action: string) => {
    try {
      if (action === 'toggle') {
        await axios.patch(`${API_URL}/ads/${adId}/toggle`, { userId: user.id });
        toast({ title: 'Status Updated', status: 'success' });
      }
      if (action === 'delete') {
        // Send userId in 'data' for DELETE requests
        await axios.delete(`${API_URL}/ads/${adId}`, { data: { userId: user.id } });
        toast({ title: 'Ad Deleted', status: 'success' });
      }
      fetchData();
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.response?.data?.message, status: 'error' });
    }
  };

  // --- TRADE ACTIONS ---
  const handleBuy = async () => {
    if(!selectedAd) return;
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/trades`, {
        adId: selectedAd.id,
        buyerId: user.id,
        amount: Number(buyAmount)
      });
      toast({ title: 'Order Created', status: 'success' });
      onBuyClose();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Failed', description: error.response?.data?.message, status: 'error' });
    }
    setIsLoading(false);
  };

  const handleTradeAction = async (tradeId: number, action: string) => {
    try {
      if(action === 'pay') await axios.patch(`${API_URL}/trades/${tradeId}/confirm-payment`, { buyerId: user.id });
      if(action === 'release') await axios.patch(`${API_URL}/trades/${tradeId}/release`, { sellerId: user.id });
      if(action === 'cancel') await axios.patch(`${API_URL}/trades/${tradeId}/cancel`, { userId: user.id });
      
      toast({ title: 'Success', status: 'success' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, status: 'error' });
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      // 1. Refresh User
      const u = await axios.get(`${API_URL}/users/${user.id}`);
      setUser(u.data);

      // 2. Public Order Book (Only OPEN ads)
      const adsRes = await axios.get(`${API_URL}/ads`);
      setAds(adsRes.data);

      // 3. My Posted Ads (Merchant Dashboard)
      const myAdsRes = await axios.get(`${API_URL}/ads/my-ads/${user.id}`);
      setMyAds(myAdsRes.data);

      // 4. Active Trades
      const tradesRes = await axios.get(`${API_URL}/trades`);
      const my = tradesRes.data.filter((t: any) => 
        (t.buyer?.id === user.id || t.seller?.id === user.id) && t.status !== 'CANCELLED'
      );
      setMyTrades(my);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 3000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- RENDER: LOGIN SCREEN ---
  if (!user) {
    return (
      <Box minH="100vh" bg="#1E2329" color="white" display="flex" alignItems="center" justifyContent="center">
        <Box bg="#2B3139" p={8} borderRadius="lg" w="full" maxW="md">
          <Heading textAlign="center" mb={6} color="#FCD535">VIGNEX</Heading>
          <Tabs isFitted variant="soft-rounded" colorScheme="yellow">
            <TabList mb={4}><Tab color="gray.400">Log In</Tab><Tab color="gray.400">Sign Up</Tab></TabList>
            <TabPanels>
              <TabPanel>
                <VStack spacing={4}>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" bg="#181A20" border="none" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" bg="#181A20" border="none" />
                  <Button w="full" bg="#FCD535" color="black" onClick={handleLogin}>Log In</Button>
                </VStack>
              </TabPanel>
              <TabPanel>
                <VStack spacing={4}>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" bg="#181A20" border="none" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" bg="#181A20" border="none" />
                  <Button w="full" bg="#FCD535" color="black" onClick={handleSignup}>Register</Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <Box minH="100vh" bg="#181A20" color="white" fontFamily="Arial, sans-serif">
      {/* HEADER */}
      <Flex h="64px" px={6} align="center" justify="space-between" bg="#1E2329" borderBottom="1px solid #2B3139">
        <Heading size="md" color="#FCD535">VIGNEX <Text as="span" color="white" fontSize="xs">P2P</Text></Heading>
        <Flex align="center" gap={4}>
          <Text fontSize="sm">Balance: <Text as="span" fontWeight="bold">{Number(user.usdtBalance).toFixed(2)} USDT</Text></Text>
          <Button size="xs" onClick={() => setUser(null)}>Logout</Button>
        </Flex>
      </Flex>

      <Container maxW="container.xl" py={8}>
        
        <Flex justify="space-between" align="center" mb={6}>
           <Heading size="lg">P2P Markets</Heading>
           <Button bg="#FCD535" color="black" onClick={onAdOpen}>+ Post New Ad</Button>
        </Flex>

        {/* TABS: PUBLIC vs MERCHANT */}
        <Tabs variant="enclosed" colorScheme="yellow">
          <TabList mb={4}>
            <Tab color="gray.300" _selected={{ color: 'white', bg: '#2B3139' }}>Marketplace</Tab>
            <Tab color="gray.300" _selected={{ color: 'white', bg: '#2B3139' }}>My Ads (Merchant)</Tab>
          </TabList>

          <TabPanels>
            {/* PANEL 1: PUBLIC MARKETPLACE */}
            <TabPanel p={0}>
                {/* ACTIVE ORDERS */}
                {myTrades.length > 0 && (
                  <Box mb={8} p={4} bg="#2B3139" borderRadius="lg" border="1px solid #FCD535">
                    <Heading size="md" mb={4} color="#FCD535">My Active Orders</Heading>
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead><Tr><Th color="gray.400">Role</Th><Th color="gray.400">Amount</Th><Th color="gray.400">Status</Th><Th color="gray.400">Action</Th></Tr></Thead>
                        <Tbody>
                          {myTrades.map(trade => {
                            const isBuyer = trade.buyer?.id === user.id;
                            const isSeller = trade.seller?.id === user.id;
                            return (
                              <Tr key={trade.id}>
                                <Td>{isBuyer ? 'I am Buying' : 'I am Selling'}</Td>
                                <Td>{trade.amount} USDT</Td>
                                <Td><Badge colorScheme={trade.status === 'COMPLETED' ? 'green' : 'orange'}>{trade.status}</Badge></Td>
                                <Td>
                                  {isBuyer && trade.status === 'PENDING_PAYMENT' && (
                                    <Button size="xs" colorScheme="yellow" onClick={() => handleTradeAction(trade.id, 'pay')}>I Have Paid</Button>
                                  )}
                                  {isSeller && trade.status === 'PAID' && (
                                    <Button size="xs" colorScheme="green" onClick={() => handleTradeAction(trade.id, 'release')}>Release Crypto</Button>
                                  )}
                                  {trade.status !== 'COMPLETED' && (
                                    <Button ml={2} size="xs" colorScheme="red" variant="outline" onClick={() => handleTradeAction(trade.id, 'cancel')}>Cancel</Button>
                                  )}
                                  <Button size="xs" colorScheme="blue" ml={2} onClick={() => {setChatTradeId(trade.id); onChatOpen(); }}>Chat</Button>
                                </Td>
                              </Tr>
                            )
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* PUBLIC ADS TABLE */}
                <Box bg="#1E2329" borderRadius="xl" overflow="hidden">
                  <TableContainer>
                    <Table variant="simple">
                      <Thead bg="#2B3139">
                        <Tr>
                          <Th color="gray.500">Advertiser</Th>
                          <Th color="gray.500">Price</Th>
                          <Th color="gray.500">Limit / Available</Th>
                          <Th color="gray.500">Payment</Th>
                          <Th color="gray.500">Trade</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {ads.map((ad) => (
                          <Tr key={ad.id} _hover={{ bg: '#2B3139' }}>
                            <Td>
                              <Flex align="center" gap={3}>
                                <Avatar size="sm" bg="gray.600" />
                                <Box>
                                  <Flex align="center" gap={2}>
                                    <Text color="#FCD535" fontWeight="bold">User #{ad.seller.id}</Text>
                                    <Badge fontSize="10px" colorScheme={ad.seller.tier === 'Gold' ? 'yellow' : 'gray'}>
                                      {ad.seller.tier || 'Bronze'}
                                    </Badge>
                                  </Flex>
                                  <Flex align="center" gap={3} mt={1}>
                                    <Text fontSize="xs" color="gray.400">
                                      {Number(ad.seller.completionRate || 0).toFixed(0)}% completion
                                    </Text>
                                    <Text fontSize="xs" color="gray.400">
                                      ⚡ {formatTime(ad.seller.avgReleaseTimeSeconds)} avg
                                    </Text>
                                  </Flex>
                                </Box>
                              </Flex>
                            </Td>
                            <Td><Text fontSize="xl" fontWeight="bold">₹ {ad.price}</Text></Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" color="gray.400">Avail: <Text as="span" color="white">{ad.currentAmount} USDT</Text></Text>
                                <Text fontSize="xs" color="gray.500">Limit: ₹{ad.minLimit} - ₹{ad.maxLimit}</Text>
                              </VStack>
                            </Td>
                            <Td><Badge bg="#E6FFFA" color="#319795">{ad.paymentMethod}</Badge></Td>
                            <Td>
                              {ad.seller.id !== user.id && (
                                <Button size="sm" bg="#0ECB81" color="white" _hover={{ bg: '#06A669' }} 
                                  onClick={() => { setSelectedAd(ad); onBuyOpen(); }}
                                >
                                  Buy USDT
                                </Button>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
            </TabPanel>

            {/* PANEL 2: MY ADS (MERCHANT DASHBOARD) */}
            <TabPanel p={0}>
               <Box bg="#1E2329" borderRadius="xl" overflow="hidden" p={4} border="1px solid #2B3139">
                  <Heading size="md" mb={4} color="gray.300">My Posted Ads</Heading>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead bg="#2B3139"><Tr><Th>Type</Th><Th>Price</Th><Th>Amount</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead>
                      <Tbody>
                        {myAds.map(ad => (
                          <Tr key={ad.id}>
                            <Td>
                              <Badge colorScheme={ad.type === 'BUY' ? 'green' : 'red'}>{ad.type || 'SELL'}</Badge>
                            </Td>
                            <Td>₹{ad.price}</Td>
                            <Td>{ad.currentAmount} / {ad.initialAmount} USDT</Td>
                            <Td>
                              <Badge colorScheme={ad.status === 'OPEN' ? 'green' : 'gray'}>{ad.status}</Badge>
                            </Td>
                            <Td>
                              <Button size="xs" mr={2} onClick={() => handleAdAction(ad.id, 'toggle')}>
                                {ad.status === 'OPEN' ? 'Pause' : 'Activate'}
                              </Button>
                              <Button size="xs" colorScheme="red" onClick={() => handleAdAction(ad.id, 'delete')}>
                                Delete
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                        {myAds.length === 0 && <Tr><Td colSpan={5} textAlign="center" color="gray.500">No ads posted yet.</Td></Tr>}
                      </Tbody>
                    </Table>
                  </TableContainer>
               </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>

      </Container>

      {/* MODAL 1: POST AD */}
      <Modal isOpen={isAdOpen} onClose={onAdClose}>
        <ModalOverlay />
        <ModalContent bg="#2B3139" color="white">
          <ModalHeader>Post New Ad</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <PostAdWizard onPost={handlePostAd} isLoading={isLoading} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL 2: BUY USDT */}
      <Modal isOpen={isBuyOpen} onClose={onBuyClose}>
        <ModalOverlay />
        <ModalContent bg="#2B3139" color="white">
          <ModalHeader>Buy USDT</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4} color="gray.400">
               Price: <b>₹{selectedAd?.price}</b> <br/>
               Limit: ₹{selectedAd?.minLimit} - ₹{selectedAd?.maxLimit}
            </Text>
            <FormControl mb={4}>
              <FormLabel>I want to buy (USDT)</FormLabel>
              <Input bg="#181A20" border="none" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} />
              <Text fontSize="xs" mt={2} color="gray.500">
                 You will pay: ₹ {(Number(buyAmount) * (selectedAd?.price || 0)).toFixed(2)}
              </Text>
            </FormControl>
            <Button w="full" bg="#0ECB81" color="white" onClick={handleBuy} isLoading={isLoading}>Confirm Purchase</Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL 3: CHAT */}
      <Modal isOpen={isChatOpen} onClose={onChatClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="#2B3139" color="white">
          <ModalHeader>Trade Chat #{chatTradeId}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {chatTradeId && user && (
              <Chat tradeId={chatTradeId} userId={user.id} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  );
}

export default App;