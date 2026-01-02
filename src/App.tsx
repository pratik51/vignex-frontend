import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Text, VStack, Badge, Flex, SimpleGrid, 
  Stat, StatLabel, StatNumber, StatHelpText, Button, Input, FormControl, FormLabel, useToast,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react';
import axios from 'axios';

// --- CONFIG ---
// Automatically detect if we are on Laptop or Cloud
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

function App() {
  // --- STATE ---
  const [user, setUser] = useState<any | null>(null); // If null, show Login Screen
  
  // Login/Signup Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard State
  const [trades, setTrades] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const toast = useToast();

  // --- ACTIONS ---

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Connects to your new backend login function
      const res = await axios.post(`${API_URL}/users/login`, { email, password });
      setUser(res.data); // Login Success!
      toast({ title: 'Welcome back!', status: 'success' });
    } catch (err) {
      toast({ title: 'Login Failed', description: 'Wrong email or password', status: 'error' });
    }
    setIsLoading(false);
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      // Creates a new user in your database
      const res = await axios.post(`${API_URL}/users`, { 
        email, 
        password
      });
      setUser(res.data); // Auto-login after signup
      toast({ title: 'Account Created', description: 'Welcome to Vignex', status: 'success' });
    } catch (err) {
      toast({ title: 'Signup Failed', description: 'Email might be taken', status: 'error' });
    }
    setIsLoading(false);
  };

  const handleTrade = async () => {
    if(!amount || isNaN(Number(amount))) return;
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/trades`, {
        sellerId: user.id, // Uses the logged-in user's ID
        buyerId: Number(buyerId),
        amount: Number(amount)
      });
      toast({ title: 'FUNDS LOCKED', status: 'success' });
      setAmount('');
      fetchData(); 
    } catch (error: any) {
      toast({ title: 'FAILED', description: error.response?.data?.message, status: 'error' });
    }
    setIsLoading(false);
  };

  const handleRelease = async (tradeId: number) => {
    try {
      await axios.post(`${API_URL}/trades/${tradeId}/release`);
      toast({ title: 'RELEASED', status: 'success' });
      fetchData(); 
    } catch (error: any) {
      toast({ title: 'ERROR', description: error.response?.data?.message, status: 'error' });
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      // 1. Refresh User Balance
      const userRes = await axios.get(`${API_URL}/users/${user.id}`);
      setUser(userRes.data);

      // 2. Fetch Trades
      const tradeRes = await axios.get(`${API_URL}/trades`);
      setTrades(tradeRes.data.sort((a: any, b: any) => b.id - a.id));
    } catch (error) {
      console.error(error);
    }
  };

  // Poll for updates every 5 seconds (Real-time feel)
  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- SCREEN 1: AUTH (LOGIN / SIGNUP) ---
  if (!user) {
    return (
      <Box minH="100vh" bg="gray.900" color="white" display="flex" alignItems="center" justifyContent="center">
        <Box bg="gray.800" p={8} borderRadius="xl" shadow="2xl" w="full" maxW="md" border="1px solid" borderColor="gray.700">
          <Heading textAlign="center" mb={6} color="blue.400">VIGNEX</Heading>
          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Login</Tab>
              <Tab _selected={{ color: 'white', bg: 'green.500' }}>Sign Up</Tab>
            </TabList>
            <TabPanels>
              {/* LOGIN FORM */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input value={email} onChange={e => setEmail(e.target.value)} bg="gray.900" placeholder="user@example.com" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} bg="gray.900" placeholder="********" />
                  </FormControl>
                  <Button w="full" colorScheme="blue" onClick={handleLogin} isLoading={isLoading}>
                    Log In
                  </Button>
                </VStack>
              </TabPanel>

              {/* SIGNUP FORM */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input value={email} onChange={e => setEmail(e.target.value)} bg="gray.900" placeholder="New email" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Set Password</FormLabel>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} bg="gray.900" placeholder="Strong password" />
                  </FormControl>
                  <Button w="full" colorScheme="green" onClick={handleSignup} isLoading={isLoading}>
                    Create Account
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    );
  }

  // --- SCREEN 2: DASHBOARD (Real App) ---
  return (
    <Box minH="100vh" bg="gray.900" color="white" py={10}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8}>
           <Heading size="lg">VIGNEX <Badge ml={2} colorScheme="purple">PRO</Badge></Heading>
           <Flex align="center" gap={4}>
             <Text color="gray.400">{user.email}</Text>
             <Button size="sm" colorScheme="red" variant="outline" onClick={() => setUser(null)}>Logout</Button>
           </Flex>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
            {/* WALLET */}
            <Box p={6} bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700">
              <Stat>
                <StatLabel color="gray.400">YOUR BALANCE</StatLabel>
                <StatNumber fontSize="4xl" color="green.300">
                  {/* Handle missing balance gracefully */}
                  $ {user.usdtBalance ? Number(user.usdtBalance).toLocaleString() : '0.00'}
                </StatNumber>
                <StatHelpText>USDT (Tether)</StatHelpText>
              </Stat>
            </Box>

            {/* TRADING FORM */}
            <Box p={6} bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700">
              <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.200">New Trade</Text>
              <Flex gap={3}>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500">BUYER ID</FormLabel>
                  <Input bg="gray.900" value={buyerId} onChange={(e) => setBuyerId(e.target.value)} placeholder="e.g. 2"/>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500">AMOUNT</FormLabel>
                  <Input bg="gray.900" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"/>
                </FormControl>
              </Flex>
              <Button w="full" colorScheme="blue" mt={5} onClick={handleTrade} isLoading={isLoading}>
                LOCK FUNDS
              </Button>
            </Box>
        </SimpleGrid>
        
        {/* HISTORY */}
        <Box p={6} bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700">
            <Heading size="md" mb={4} color="gray.300">Recent Transactions</Heading>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th color="gray.500">ID</Th>
                    <Th color="gray.500">Type</Th>
                    <Th color="gray.500" isNumeric>Amount</Th>
                    <Th color="gray.500">Status</Th>
                    <Th color="gray.500">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {trades.map((trade) => (
                    <Tr key={trade.id} _hover={{ bg: 'gray.700' }}>
                      <Td color="gray.400">#{trade.id}</Td>
                      <Td>
                        {trade.seller.id === user.id ? <Badge colorScheme="red">SELLING</Badge> : <Badge colorScheme="green">BUYING</Badge>}
                      </Td>
                      <Td isNumeric fontWeight="bold" color="white">{trade.amount} USDT</Td>
                      <Td><Badge colorScheme={trade.status === 'COMPLETED' ? 'green' : 'yellow'}>{trade.status}</Badge></Td>
                      <Td>
                        {trade.seller.id === user.id && trade.status === 'PENDING' && (
                          <Button size="sm" colorScheme="green" variant="outline" onClick={() => handleRelease(trade.id)}>RELEASE</Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
      </Container>
    </Box>
  );
}

export default App;