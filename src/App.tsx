import Chat from './Chat'; 
import PostAdWizard from './PostAdWizard';
import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Text, VStack, Badge, Flex, 
  Button, Input, FormControl, FormLabel, useToast,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, 
  Tabs, TabList, TabPanels, Tab, TabPanel, Avatar, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure
} from '@chakra-ui/react';
import axios from 'axios';

// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- COMPONENT: Countdown Timer ---
const Countdown = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
       const now = new Date().getTime();
       const distance = new Date(expiresAt).getTime() - now;
       if (distance < 0) { setTimeLeft('EXPIRED'); return; }
       
       const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
       const s = Math.floor((distance % (1000 * 60)) / 1000);
       setTimeLeft(`${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <Badge colorScheme={timeLeft === 'EXPIRED' ? 'red' : 'yellow'}>{timeLeft}</Badge>;
};

function App() {
  const [user, setUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [ads, setAds] = useState<any[]>([]);       
  const [myAds, setMyAds] = useState<any[]>([]);   
  const [myTrades, setMyTrades] = useState<any[]>([]); // User's trades (Buying/Selling)
  const [merchantTrades, setMerchantTrades] = useState<any[]>([]); // Orders on my Ads

  // Chat 
  const [chatTradeId, setChatTradeId] = useState<number | null>(null);
  const { isOpen: isChatOpen, onOpen: onChatOpen, onClose: onChatClose } = useDisclosure();
  
  // Trade Modal
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [amount, setAmount] = useState(''); 
  const { isOpen: isTradeOpen, onOpen: onTradeOpen, onClose: onTradeClose } = useDisclosure();
  
  // Post Ad
  const { isOpen: isAdOpen, onOpen: onAdOpen, onClose: onAdClose } = useDisclosure();

  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // --- AUTH ---
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

  // --- DATA FETCHING ---
  const fetchData = async () => {
    if (!user) return;
    try {
      const u = await axios.get(`${API_URL}/users/${user.id}`);
      setUser(u.data);

      const adsRes = await axios.get(`${API_URL}/ads`);
      setAds(adsRes.data);

      const myAdsRes = await axios.get(`${API_URL}/ads/my-ads/${user.id}`);
      setMyAds(myAdsRes.data);

      const tradesRes = await axios.get(`${API_URL}/trades`);
      // My Trades: Where I am the Buyer OR Seller (but not the Ad Owner - simplifed)
      const my = tradesRes.data.filter((t: any) => 
        (t.buyer?.id === user.id || t.seller?.id === user.id)
      );
      setMyTrades(my);

      // Merchant Trades: Orders ON my ads
      const mTradesRes = await axios.get(`${API_URL}/trades/merchant/${user.id}`);
      setMerchantTrades(mTradesRes.data);

    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 3000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- ACTIONS ---
  const handlePostAd = async (adData: any) => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/ads`, { sellerId: user.id, ...adData });
      toast({ title: 'Ad Posted', status: 'success' });
      onAdClose();
      fetchData();
    } catch (error: any) { toast({ title: 'Error', description: error.response?.data?.message, status: 'error' }); }
    setIsLoading(false);
  };

  const handleCreateTrade = async () => {
    if(!selectedAd) return;
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/trades`, {
        adId: selectedAd.id,
        buyerId: user.id, // I am the "Taker"
        amount: Number(amount)
      });
      toast({ title: 'Order Created', status: 'success' });
      onTradeClose();
      fetchData();
    } catch (error: any) { toast({ title: 'Failed', description: error.response?.data?.message, status: 'error' }); }
    setIsLoading(false);
  };

  const handleTradeAction = async (tradeId: number, action: string, extra?: any) => {
    try {
      if(action === 'verify') await axios.patch(`${API_URL}/trades/${tradeId}/verify`, { userId: user.id });
      if(action === 'pay') await axios.patch(`${API_URL}/trades/${tradeId}/confirm-payment`, { buyerId: user.id });
      if(action === 'release') await axios.patch(`${API_URL}/trades/${tradeId}/release`, { sellerId: user.id });
      if(action === 'cancel') await axios.patch(`${API_URL}/trades/${tradeId}/cancel`, { userId: user.id });
      if(action === 'appeal') await axios.patch(`${API_URL}/trades/${tradeId}/appeal`, { userId: user.id });
      if(action === 'extend') await axios.patch(`${API_URL}/trades/${tradeId}/extend`, { userId: user.id, minutes: extra || 15 });
      
      toast({ title: 'Success', status: 'success' });
      fetchData();
    } catch (error: any) { toast({ title: 'Error', description: error.response?.data?.message, status: 'error' }); }
  };

  const handleAdAction = async (adId: number, action: string) => {
      if (action === 'toggle') await axios.patch(`${API_URL}/ads/${adId}/toggle`, { userId: user.id });
      if (action === 'delete') await axios.delete(`${API_URL}/ads/${adId}`, { data: { userId: user.id } });
      fetchData();
  };

  if (!user) return (
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

  return (
    <Box minH="100vh" bg="#181A20" color="white" fontFamily="Arial, sans-serif">
      {/* HEADER */}
      <Flex h="64px" px={6} align="center" justify="space-between" bg="#1E2329" borderBottom="1px solid #2B3139">
        <Heading size="md" color="#FCD535">VIGNEX</Heading>
        <Flex align="center" gap={4}>
          <Text fontSize="sm">Balance: <b>{Number(user.usdtBalance).toFixed(2)} USDT</b></Text>
          <Button size="xs" onClick={() => setUser(null)}>Logout</Button>
        </Flex>
      </Flex>

      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
           <Heading size="lg">P2P Markets</Heading>
           <Button bg="#FCD535" color="black" onClick={onAdOpen}>+ Post New Ad</Button>
        </Flex>

        <Tabs variant="enclosed" colorScheme="yellow">
          <TabList mb={4}>
            <Tab color="gray.300" _selected={{ color: 'white', bg: '#2B3139' }}>Marketplace</Tab>
            <Tab color="gray.300" _selected={{ color: 'white', bg: '#2B3139' }}>Merchant Dashboard</Tab>
          </TabList>

          <TabPanels>
            {/* --- TAB 1: MARKETPLACE --- */}
            <TabPanel p={0}>
                
                {/* BUY / SELL TOGGLE */}
                <Tabs variant="soft-rounded" colorScheme={selectedAd?.type === 'BUY' ? 'red' : 'green'}>
                    <TabList mb={4}>
                        <Tab color="white" _selected={{ bg: '#0ECB81', color: 'white' }}>I Want to Buy</Tab>
                        <Tab color="white" _selected={{ bg: '#F6465D', color: 'white' }}>I Want to Sell</Tab>
                    </TabList>
                    <TabPanels>
                        
                        {/* VIEW: I WANT TO BUY (Show 'SELL' Ads) */}
                        <TabPanel p={0}>
                           <AdTable ads={ads.filter(a => a.type === 'SELL')} user={user} actionLabel="Buy USDT" onAction={(ad: any) => { setSelectedAd(ad); onTradeOpen(); }} color="#0ECB81" />
                        </TabPanel>

                        {/* VIEW: I WANT TO SELL (Show 'BUY' Ads) */}
                        <TabPanel p={0}>
                           <AdTable ads={ads.filter(a => a.type === 'BUY')} user={user} actionLabel="Sell USDT" onAction={(ad: any) => { setSelectedAd(ad); onTradeOpen(); }} color="#F6465D" />
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                {/* MY ACTIVE TRADES (USER MODE) */}
                {myTrades.length > 0 && (
                  <Box mt={8} p={4} bg="#2B3139" borderRadius="lg" border="1px solid #FCD535">
                    <Heading size="md" mb={4} color="#FCD535">My Active Trades (User)</Heading>
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead><Tr><Th>Type</Th><Th>Amount</Th><Th>Status</Th><Th>Timer</Th><Th>Action</Th></Tr></Thead>
                        <Tbody>
                          {myTrades.map(trade => {
                             const isBuyer = trade.buyer?.id === user.id;
                             return (
                               <Tr key={trade.id}>
                                 <Td><Badge colorScheme={isBuyer ? 'green' : 'red'}>{isBuyer ? 'BUY' : 'SELL'}</Badge></Td>
                                 <Td>{trade.amount} USDT</Td>
                                 <Td><Badge>{trade.status}</Badge></Td>
                                 <Td>
                                    {trade.status === 'WAITING_VERIFICATION' && <Countdown expiresAt={trade.verificationExpiresAt} />}
                                    {trade.status === 'PENDING_PAYMENT' && <Countdown expiresAt={trade.paymentExpiresAt} />}
                                 </Td>
                                 <Td>
                                    {/* USER ACTIONS */}
                                    {isBuyer && trade.status === 'PENDING_PAYMENT' && (
                                       <Button size="xs" colorScheme="yellow" onClick={() => handleTradeAction(trade.id, 'pay')}>I Have Paid</Button>
                                    )}
                                    {/* Only Taker can cancel (Req 3) */}
                                    {trade.status === 'WAITING_VERIFICATION' && (
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
            </TabPanel>

            {/* --- TAB 2: MERCHANT DASHBOARD --- */}
            <TabPanel p={0}>
                <Tabs variant="line" colorScheme="yellow" mt={4}>
                   <TabList>
                      <Tab>Incoming Orders (Pending)</Tab>
                      <Tab>Active Orders</Tab>
                      <Tab>History</Tab>
                      <Tab>My Ads</Tab>
                   </TabList>
                   <TabPanels>
                      
                      {/* 1. PENDING (Waiting Verification) */}
                      <TabPanel>
                         <MerchantOrderTable trades={merchantTrades.filter(t => t.status === 'WAITING_VERIFICATION')} user={user} onAction={handleTradeAction} />
                      </TabPanel>

                      {/* 2. ACTIVE (Pending Payment / Paid) */}
                      <TabPanel>
                         <MerchantOrderTable trades={merchantTrades.filter(t => ['PENDING_PAYMENT', 'PAID', 'IN_APPEAL'].includes(t.status))} user={user} onAction={handleTradeAction} />
                      </TabPanel>

                      {/* 3. HISTORY */}
                      <TabPanel>
                         <MerchantOrderTable trades={merchantTrades.filter(t => ['COMPLETED', 'CANCELLED'].includes(t.status))} user={user} onAction={handleTradeAction} />
                      </TabPanel>

                      {/* 4. MY ADS */}
                      <TabPanel>
                         <MyAdsTable ads={myAds} onAction={handleAdAction} />
                      </TabPanel>

                   </TabPanels>
                </Tabs>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>

      {/* --- MODALS --- */}
      <Modal isOpen={isAdOpen} onClose={onAdClose}>
        <ModalOverlay /><ModalContent bg="#2B3139" color="white"><ModalHeader>Post New Ad</ModalHeader><ModalCloseButton /><ModalBody pb={6}><PostAdWizard onPost={handlePostAd} isLoading={isLoading} /></ModalBody></ModalContent>
      </Modal>

      <Modal isOpen={isTradeOpen} onClose={onTradeClose}>
        <ModalOverlay /><ModalContent bg="#2B3139" color="white">
          <ModalHeader>{selectedAd?.type === 'SELL' ? 'Buy USDT' : 'Sell USDT'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4} color="gray.400">Rate: <b>₹{selectedAd?.price}</b></Text>
            <FormControl mb={4}><FormLabel>Amount (USDT)</FormLabel><Input bg="#181A20" border="none" value={amount} onChange={e => setAmount(e.target.value)} /></FormControl>
            <Button w="full" bg={selectedAd?.type === 'SELL' ? '#0ECB81' : '#F6465D'} color="white" onClick={handleCreateTrade} isLoading={isLoading}>
               {selectedAd?.type === 'SELL' ? 'Confirm Buy' : 'Confirm Sell'}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isChatOpen} onClose={onChatClose} isCentered>
        <ModalOverlay /><ModalContent bg="#2B3139" color="white"><ModalHeader>Chat #{chatTradeId}</ModalHeader><ModalCloseButton /><ModalBody pb={6}>{chatTradeId && user && <Chat tradeId={chatTradeId} userId={user.id} />}</ModalBody></ModalContent>
      </Modal>
    </Box>
  );
}

// --- SUB-COMPONENTS for Cleanliness ---

const AdTable = ({ ads, user, actionLabel, onAction, color }: any) => (
  <Box bg="#1E2329" borderRadius="xl" overflow="hidden">
    <TableContainer>
      <Table variant="simple"><Thead bg="#2B3139"><Tr><Th>Advertiser</Th><Th>Price</Th><Th>Limit</Th><Th>Payment</Th><Th>Action</Th></Tr></Thead>
      <Tbody>{ads.map((ad: any) => (
         <Tr key={ad.id} _hover={{ bg: '#2B3139' }}>
           <Td><Flex align="center" gap={2}><Avatar size="xs" /><Text fontWeight="bold">User {ad.seller.id}</Text></Flex></Td>
           <Td><Text fontWeight="bold">₹ {ad.price}</Text></Td>
           <Td>{ad.minLimit} - {ad.maxLimit} INR</Td>
           <Td><Badge>{ad.paymentMethod}</Badge></Td>
           <Td>{ad.seller.id !== user.id && <Button size="sm" bg={color} color="white" onClick={() => onAction(ad)}>{actionLabel}</Button>}</Td>
         </Tr>
      ))}</Tbody></Table>
    </TableContainer>
  </Box>
);

const MerchantOrderTable = ({ trades, onAction }: any) => (
   <TableContainer>
      <Table variant="simple" size="sm">
         <Thead><Tr><Th>ID</Th><Th>Type</Th><Th>Amount</Th><Th>Status</Th><Th>Timer</Th><Th>Action</Th></Tr></Thead>
         <Tbody>{trades.map((t: any) => (
            <Tr key={t.id}>
               <Td>#{t.id}</Td>
               <Td><Badge>{t.ad.type}</Badge></Td>
               <Td>{t.amount}</Td>
               <Td><Badge>{t.status}</Badge></Td>
               <Td>
                  {t.status === 'WAITING_VERIFICATION' && <Countdown expiresAt={t.verificationExpiresAt} />}
                  {t.status === 'PENDING_PAYMENT' && <Countdown expiresAt={t.paymentExpiresAt} />}
               </Td>
               <Td>
                  {t.status === 'WAITING_VERIFICATION' && <Button size="xs" colorScheme="purple" onClick={() => onAction(t.id, 'verify')}>Verify Order</Button>}
                  {t.status === 'PENDING_PAYMENT' && <Button size="xs" onClick={() => onAction(t.id, 'extend', 15)}>+15m</Button>}
                  {t.status === 'PAID' && <Button size="xs" colorScheme="green" onClick={() => onAction(t.id, 'release')}>Release</Button>}
                  <Button size="xs" ml={2} colorScheme="blue" onClick={() => { /* Chat Logic via Parent is cleaner, but this works */ }}>Chat</Button>
               </Td>
            </Tr>
         ))}</Tbody>
      </Table>
   </TableContainer>
);

const MyAdsTable = ({ ads, onAction }: any) => (
  <TableContainer>
    <Table variant="simple"><Thead><Tr><Th>Type</Th><Th>Price</Th><Th>Status</Th><Th>Action</Th></Tr></Thead>
    <Tbody>{ads.map((ad: any) => (
       <Tr key={ad.id}>
          <Td><Badge colorScheme={ad.type === 'BUY' ? 'green' : 'red'}>{ad.type}</Badge></Td>
          <Td>{ad.price}</Td>
          <Td><Badge>{ad.status}</Badge></Td>
          <Td>
             <Button size="xs" onClick={() => onAction(ad.id, 'toggle')}>{ad.status === 'OPEN' ? 'Pause' : 'Activate'}</Button>
             <Button size="xs" colorScheme="red" ml={2} onClick={() => onAction(ad.id, 'delete')}>Delete</Button>
          </Td>
       </Tr>
    ))}</Tbody></Table>
  </TableContainer>
);

export default App;