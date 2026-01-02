import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Text, VStack, Badge, Flex, 
  Button, Input, FormControl, FormLabel, useToast,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, 
  Tabs, TabList, TabPanels, Tab, TabPanel, Avatar, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  Select, HStack
} from '@chakra-ui/react';
import axios from 'axios';

// --- CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

function App() {
  // --- STATE ---
  const [user, setUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [ads, setAds] = useState<any[]>([]);
  const [myTrades, setMyTrades] = useState<any[]>([]);
  
  // Post Ad Form
  const [adPrice, setAdPrice] = useState('');
  const [adAmount, setAdAmount] = useState('');
  const [adMin, setAdMin] = useState('');
  const [adMax, setAdMax] = useState('');
  const [adPayment, setAdPayment] = useState('UPI');
  
  // Buy Form
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [buyAmount, setBuyAmount] = useState(''); // In USDT

  const { isOpen: isAdOpen, onOpen: onAdOpen, onClose: onAdClose } = useDisclosure();
  const { isOpen: isBuyOpen, onOpen: onBuyOpen, onClose: onBuyClose } = useDisclosure();
  
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // --- ACTIONS ---
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

  // 1. POST A NEW AD
  const handlePostAd = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/ads`, {
        sellerId: user.id,
        price: Number(adPrice),
        amount: Number(adAmount),
        minLimit: Number(adMin),
        maxLimit: Number(adMax),
        paymentMethod: adPayment
      });
      toast({ title: 'Ad Posted', status: 'success' });
      onAdClose();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message, status: 'error' });
    }
    setIsLoading(false);
  };

  // 2. CREATE TRADE (BUY)
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

  // 3. TRADE ACTIONS (Pay / Release / Cancel)
  const handleAction = async (tradeId: number, action: string) => {
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
      // Refresh User Balance
      const u = await axios.get(`${API_URL}/users/${user.id}`);
      setUser(u.data);

      // Get Order Book (Ads)
      const adsRes = await axios.get(`${API_URL}/ads`);
      setAds(adsRes.data);

      // Get My Active Trades (Where I am buyer OR seller)
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
      const interval = setInterval(fetchData, 3000); // Live Updates
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- AUTH SCREEN ---
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

  // --- MAIN DASHBOARD ---
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
        
        {/* TOP ACTION BAR */}
        <Flex justify="space-between" align="center" mb={6}>
           <Heading size="lg">P2P Markets</Heading>
           <Button bg="#FCD535" color="black" onClick={onAdOpen}>+ Post New Ad</Button>
        </Flex>

        {/* ACTIVE ORDERS SECTION (IF ANY) */}
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
                          {/* BUYER ACTIONS */}
                          {isBuyer && trade.status === 'PENDING_PAYMENT' && (
                             <Button size="xs" colorScheme="yellow" onClick={() => handleAction(trade.id, 'pay')}>I Have Paid</Button>
                          )}
                          {/* SELLER ACTIONS */}
                          {isSeller && trade.status === 'PAID' && (
                             <Button size="xs" colorScheme="green" onClick={() => handleAction(trade.id, 'release')}>Release Crypto</Button>
                          )}
                          {/* CANCEL */}
                          {trade.status !== 'COMPLETED' && (
                             <Button ml={2} size="xs" colorScheme="red" variant="outline" onClick={() => handleAction(trade.id, 'cancel')}>Cancel</Button>
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* MARKETPLACE TABLE (ADS) */}
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
                      <Flex align="center" gap={2}>
                        <Avatar size="sm" bg="gray.600" />
                        <Box>
                          <Text color="#FCD535" fontWeight="bold">User #{ad.seller.id}</Text>
                          <Badge fontSize="10px" colorScheme={ad.seller.tier === 'Gold' ? 'yellow' : 'gray'}>{ad.seller.tier || 'Bronze'}</Badge>
                        </Box>
                      </Flex>
                    </Td>
                    <Td>
                      <Text fontSize="xl" fontWeight="bold">₹ {ad.price}</Text>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" color="gray.400">Avail: <Text as="span" color="white">{ad.currentAmount} USDT</Text></Text>
                        <Text fontSize="xs" color="gray.500">Limit: ₹{ad.minLimit} - ₹{ad.maxLimit}</Text>
                      </VStack>
                    </Td>
                    <Td>
                       <Badge bg="#E6FFFA" color="#319795">{ad.paymentMethod}</Badge>
                    </Td>
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
      </Container>

      {/* MODAL 1: POST AD */}
      <Modal isOpen={isAdOpen} onClose={onAdClose}>
        <ModalOverlay />
        <ModalContent bg="#2B3139" color="white">
          <ModalHeader>Post New Ad</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Price (INR)</FormLabel>
                <Input bg="#181A20" border="none" value={adPrice} onChange={e => setAdPrice(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Total Amount (USDT)</FormLabel>
                <Input bg="#181A20" border="none" value={adAmount} onChange={e => setAdAmount(e.target.value)} />
              </FormControl>
              <HStack w="full">
                <FormControl>
                  <FormLabel>Min Limit (₹)</FormLabel>
                  <Input bg="#181A20" border="none" value={adMin} onChange={e => setAdMin(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Max Limit (₹)</FormLabel>
                  <Input bg="#181A20" border="none" value={adMax} onChange={e => setAdMax(e.target.value)} />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Payment Method</FormLabel>
                <Select bg="#181A20" border="none" value={adPayment} onChange={e => setAdPayment(e.target.value)}>
                   <option value="UPI" style={{color:'black'}}>UPI</option>
                   <option value="IMPS" style={{color:'black'}}>IMPS</option>
                   <option value="NEFT" style={{color:'black'}}>NEFT</option>
                   <option value="RTGS" style={{color:'black'}}>RTGS</option>
                   <option value="Digital Rupee" style={{color:'black'}}>Digital Rupee</option>
                </Select>
              </FormControl>
              <Button w="full" bg="#FCD535" color="black" onClick={handlePostAd} isLoading={isLoading}>Post Ad</Button>
            </VStack>
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

    </Box>
  );
}

export default App;