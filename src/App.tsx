import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Text, VStack, Badge, Flex, SimpleGrid, 
  Stat, StatLabel, StatNumber, StatHelpText, Button, Input, FormControl, FormLabel, useToast,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner
} from '@chakra-ui/react';
import axios from 'axios';

// --- TYPES ---
interface UserData {
  id: number;
  email: string;
  usdtBalance: string;
  isKycVerified: boolean;
}

interface TradeData {
  id: number;
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  seller: { id: number };
  buyer: { id: number };
  createdAt: string;
}

function App() {
  // FIX 1: This variable setup is correct
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
  
  const [user, setUser] = useState<UserData | null>(null);
  const [trades, setTrades] = useState<TradeData[]>([]); 
  const [amount, setAmount] = useState('');
  const [buyerId, setBuyerId] = useState('2');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const MY_USER_ID = 1; 

  // --- 1. FETCH DATA (Balance + History) ---
  const fetchData = async () => {
    try {
      // FIX 2: Added backticks ` ` around the URL
      const userRes = await axios.get(`${API_URL}/users/${MY_USER_ID}`);
      setUser(userRes.data);

      // FIX 3: Added backticks AND fixed the endpoint to fetch 'trades', not users again
      const tradeRes = await axios.get(`${API_URL}/trades`);
      
      // Sort by newest first
      const myTrades = tradeRes.data.sort((a: any, b: any) => b.id - a.id);
      setTrades(myTrades);

    } catch (error) {
      console.error("Connection Error:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. CREATE TRADE (Lock Funds) ---
  const handleTrade = async () => {
    if(!amount || isNaN(Number(amount))) return;
    setIsLoading(true);
    try {
      // FIX 4: Fixed the broken structure and added backticks
      await axios.post(`${API_URL}/trades`, {
        sellerId: MY_USER_ID,
        buyerId: Number(buyerId),
        amount: Number(amount)
      });

      toast({ title: 'FUNDS LOCKED', status: 'success', duration: 2000, position: 'top-right' });
      setAmount('');
      fetchData(); 

    } catch (error: any) {
      toast({ title: 'FAILED', description: error.response?.data?.message, status: 'error', position: 'top-right' });
    }
    setIsLoading(false);
  };

  // --- 3. RELEASE FUNDS (Complete Deal) ---
  const handleRelease = async (tradeId: number) => {
    try {
      // FIX 5: Added backticks ` `
      await axios.post(`${API_URL}/trades/${tradeId}/release`);
      
      toast({ title: 'ASSETS RELEASED', description: `Trade #${tradeId} completed.`, status: 'success', position: 'top-right' });
      fetchData(); 

    } catch (error: any) {
      toast({ title: 'ERROR', description: error.response?.data?.message, status: 'error', position: 'top-right' });
    }
  };

  return (
    <Box minH="100vh" bg="gray.900" color="white" py={10}>
      <Container maxW="container.xl"> 
        <VStack spacing={8} align="stretch">
          
          {/* HEADER */}
          <Flex justify="space-between" align="center" borderBottom="1px" borderColor="gray.700" pb={4}>
            <Box>
              <Heading color="white" size="lg" letterSpacing="tight">VIGNEX</Heading>
              <Text fontSize="sm" color="gray.400" fontFamily="monospace">
                INSTITUTIONAL DASHBOARD
              </Text>
            </Box>
            <Flex align="center" gap={3}>
               <Text fontSize="sm" color="gray.400">{user?.email}</Text>
               <Badge colorScheme="green" variant="solid" borderRadius="full" px={3}>VERIFIED</Badge>
            </Flex>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            
            {/* 1. WALLET CARD */}
            <Box p={6} bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700" shadow="xl">
              <Stat>
                <StatLabel color="gray.400" mb={1}>AVAILABLE ASSETS (USDT)</StatLabel>
                <StatNumber fontSize="5xl" fontWeight="bold" color="green.300">
                  {user ? `$ ${Number(user.usdtBalance).toLocaleString()}` : <Spinner />}
                </StatNumber>
                <StatHelpText color="gray.500">
                  Custody Status: Secured 
                </StatHelpText>
              </Stat>
            </Box>

            {/* 2. TRADING TERMINAL */}
            <Box p={6} bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700" shadow="xl">
              <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.200">Create New Sell Order</Text>
              <Flex gap={3}>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500">BUYER ID</FormLabel>
                  <Input bg="gray.900" border="none" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}/>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500">AMOUNT (USDT)</FormLabel>
                  <Input bg="gray.900" border="none" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}/>
                </FormControl>
              </Flex>
              <Button w="full" colorScheme="blue" mt={5} onClick={handleTrade} isLoading={isLoading}>
                LOCK FUNDS IN ESCROW
              </Button>
            </Box>
          </SimpleGrid>

          {/* 3. TRANSACTION HISTORY */}
          <Box p={6} bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.700">
            <Heading size="md" mb={4} color="gray.300">Recent Transactions</Heading>
            
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th color="gray.500">ID</Th>
                    <Th color="gray.500">Role</Th>
                    <Th color="gray.500" isNumeric>Amount</Th>
                    <Th color="gray.500">Counterparty</Th>
                    <Th color="gray.500">Status</Th>
                    <Th color="gray.500">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {trades.map((trade) => (
                    <Tr key={trade.id} _hover={{ bg: 'gray.700' }}>
                      <Td color="gray.400">#{trade.id}</Td>
                      <Td>
                        {trade.seller.id === MY_USER_ID ? 
                          <Badge colorScheme="red">SELLING</Badge> : 
                          <Badge colorScheme="green">BUYING</Badge>
                        }
                      </Td>
                      <Td isNumeric fontWeight="bold" color="white">{trade.amount} USDT</Td>
                      <Td color="gray.400">
                         {trade.seller.id === MY_USER_ID ? `Buyer #${trade.buyer.id}` : `Seller #${trade.seller.id}`}
                      </Td>
                      <Td>
                        <Badge colorScheme={trade.status === 'COMPLETED' ? 'green' : 'yellow'}>
                          {trade.status}
                        </Badge>
                      </Td>
                      <Td>
                        {/* ONLY SHOW RELEASE BUTTON IF: You are the Seller AND it is Pending */}
                        {trade.seller.id === MY_USER_ID && trade.status === 'PENDING' && (
                          <Button 
                            size="sm" colorScheme="green" variant="outline"
                            onClick={() => handleRelease(trade.id)}
                          >
                            RELEASE
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

        </VStack>
      </Container>
    </Box>
  );
}

export default App;