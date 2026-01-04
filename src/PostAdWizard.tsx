import { useState } from 'react';
import { 
  Box, Button, FormControl, FormLabel, Input, Select, VStack, Text, 
  NumberInput, NumberInputField, Textarea, HStack, Badge, Divider, useToast 
} from '@chakra-ui/react';

export default function PostAdWizard({ onPost, isLoading }: { onPost: (data: any) => void, isLoading: boolean }) {
  const [step, setStep] = useState(1);
  const toast = useToast();

  // --- STEP 1: TYPE & PRICE ---
  const [type, setType] = useState('SELL'); // BUY or SELL
  const [asset] = useState('USDT');
  const [fiat] = useState('INR');
  const [priceType, setPriceType] = useState('FIXED'); // FIXED or FLOATING
  const [fixedPrice, setFixedPrice] = useState('');
  const [floatingMargin, setFloatingMargin] = useState('100'); // % market price (100% = market)

  // --- STEP 2: AMOUNT & LIMITS ---
  const [amount, setAmount] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // Default to UPI
  const [paymentTimeLimit, setPaymentTimeLimit] = useState('15');
  const [verifTime, setVerifTime] = useState('10'); // New: Verification Time

  // --- STEP 3: REMARKS & AUTO-REPLY ---
  const [remarks, setRemarks] = useState('');
  const [autoReply, setAutoReply] = useState('');
  const [minRegisterDays, setMinRegisterDays] = useState('0');

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFinish = () => {
    // Basic Validation
    if (!amount || !minLimit || !maxLimit) {
      toast({ title: 'Please fill all required fields', status: 'error' });
      return;
    }

    const price = priceType === 'FIXED' ? Number(fixedPrice) : 0; // Floating handled by backend usually, or calc here
    
    const payload = {
      type,
      priceType,
      price: price,
      floatingMargin: priceType === 'FLOATING' ? Number(floatingMargin) : null,
      amount: Number(amount),
      initialAmount: Number(amount),
      minLimit: Number(minLimit),
      maxLimit: Number(maxLimit),
      paymentMethod,
      paymentTimeLimit: Number(paymentTimeLimit),
      verificationTimeLimit: Number(verifTime), // <--- NEW FIELD
      remarks,
      autoReply,
      minRegisterDays: Number(minRegisterDays)
    };

    onPost(payload);
  };

  return (
    <Box>
      {/* PROGRESS BAR */}
      <HStack mb={6} spacing={0} w="full">
         <Box flex={1} h="4px" bg={step >= 1 ? "#FCD535" : "gray.700"} />
         <Box flex={1} h="4px" bg={step >= 2 ? "#FCD535" : "gray.700"} />
         <Box flex={1} h="4px" bg={step >= 3 ? "#FCD535" : "gray.700"} />
      </HStack>

      {/* STEP 1: ASSET & PRICE */}
      {step === 1 && (
        <VStack spacing={4} align="stretch">
           <Text fontWeight="bold" fontSize="lg">Step 1: Type & Price</Text>
           
           <HStack>
             <Button flex={1} bg={type === 'BUY' ? 'green.400' : 'gray.700'} onClick={() => setType('BUY')}>I Want to BUY</Button>
             <Button flex={1} bg={type === 'SELL' ? 'red.400' : 'gray.700'} onClick={() => setType('SELL')}>I Want to SELL</Button>
           </HStack>

           <FormControl>
             <FormLabel>Asset / Fiat</FormLabel>
             <HStack><Badge fontSize="md">{asset}</Badge><Text color="gray.500">with</Text><Badge fontSize="md">{fiat}</Badge></HStack>
           </FormControl>

           <FormControl>
             <FormLabel>Price Type</FormLabel>
             <Select value={priceType} onChange={e => setPriceType(e.target.value)} bg="gray.900" border="none">
               <option value="FIXED" style={{color:'black'}}>Fixed Price</option>
               <option value="FLOATING" style={{color:'black'}}>Floating (Market %)</option>
             </Select>
           </FormControl>

           {priceType === 'FIXED' ? (
             <FormControl>
               <FormLabel>Fixed Price (INR)</FormLabel>
               <Input type="number" value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} bg="gray.900" border="none" placeholder="88.50" />
             </FormControl>
           ) : (
             <FormControl>
               <FormLabel>Margin (%)</FormLabel>
               <Input type="number" value={floatingMargin} onChange={e => setFloatingMargin(e.target.value)} bg="gray.900" border="none" placeholder="102" />
               <Text fontSize="xs" color="gray.500">100% = Market Price. 105% = 5% above market.</Text>
             </FormControl>
           )}

           <Button colorScheme="yellow" onClick={handleNext}>Next</Button>
        </VStack>
      )}

      {/* STEP 2: AMOUNT & LIMITS */}
      {step === 2 && (
        <VStack spacing={4} align="stretch">
           <Text fontWeight="bold" fontSize="lg">Step 2: Total Amount & Payment</Text>

           <FormControl>
             <FormLabel>Total Amount (USDT)</FormLabel>
             <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} bg="gray.900" border="none" placeholder="1000" />
           </FormControl>

           <HStack>
             <FormControl>
               <FormLabel>Min Limit (INR)</FormLabel>
               <Input type="number" value={minLimit} onChange={e => setMinLimit(e.target.value)} bg="gray.900" border="none" placeholder="500" />
             </FormControl>
             <FormControl>
               <FormLabel>Max Limit (INR)</FormLabel>
               <Input type="number" value={maxLimit} onChange={e => setMaxLimit(e.target.value)} bg="gray.900" border="none" placeholder="50000" />
             </FormControl>
           </HStack>

           <FormControl>
              <FormLabel>Payment Method</FormLabel>
              <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} bg="gray.900" border="none">
                 <option value="UPI" style={{color:'black'}}>UPI</option>
                 <option value="IMPS" style={{color:'black'}}>IMPS</option>
                 <option value="BANK_TRANSFER" style={{color:'black'}}>Bank Transfer</option>
              </Select>
           </FormControl>

           <FormControl>
              <FormLabel>Payment Time Limit (Buyer)</FormLabel>
              <Select value={paymentTimeLimit} onChange={e => setPaymentTimeLimit(e.target.value)} bg="gray.900" border="none">
                 <option value="15" style={{color:'black'}}>15 Minutes</option>
                 <option value="30" style={{color:'black'}}>30 Minutes</option>
                 <option value="45" style={{color:'black'}}>45 Minutes</option>
              </Select>
           </FormControl>

           <FormControl>
              <FormLabel>Merchant Verification Time (You)</FormLabel>
              <Select value={verifTime} onChange={e => setVerifTime(e.target.value)} bg="gray.900" border="none">
                 <option value="5" style={{color:'black'}}>5 Minutes</option>
                 <option value="10" style={{color:'black'}}>10 Minutes</option>
                 <option value="15" style={{color:'black'}}>15 Minutes</option>
              </Select>
              <Text fontSize="xs" color="gray.500">If you don't verify an order within this time, it auto-cancels.</Text>
           </FormControl>

           <HStack pt={4}>
             <Button variant="ghost" onClick={handleBack}>Back</Button>
             <Button colorScheme="yellow" flex={1} onClick={handleNext}>Next</Button>
           </HStack>
        </VStack>
      )}

      {/* STEP 3: REMARKS */}
      {step === 3 && (
        <VStack spacing={4} align="stretch">
           <Text fontWeight="bold" fontSize="lg">Step 3: Remarks & Auto-Reply</Text>

           <FormControl>
             <FormLabel>Remarks (Terms)</FormLabel>
             <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} bg="gray.900" border="none" placeholder="e.g. No third-party payments." />
           </FormControl>

           <FormControl>
             <FormLabel>Auto-Reply (Chat)</FormLabel>
             <Textarea value={autoReply} onChange={e => setAutoReply(e.target.value)} bg="gray.900" border="none" placeholder="e.g. I am online, please pay fast." />
           </FormControl>

           <Divider my={2} />

           <FormControl>
              <FormLabel>Counterparty Conditions</FormLabel>
              <HStack>
                 <Text fontSize="sm">Registered days &gt;</Text>
                 <NumberInput value={minRegisterDays} onChange={val => setMinRegisterDays(val)} min={0} max={365} size="sm" w="80px">
                    <NumberInputField bg="gray.900" border="none" />
                 </NumberInput>
              </HStack>
           </FormControl>

           <HStack pt={4}>
             <Button variant="ghost" onClick={handleBack}>Back</Button>
             <Button colorScheme="yellow" flex={1} onClick={handleFinish} isLoading={isLoading}>Post Ad</Button>
           </HStack>
        </VStack>
      )}
    </Box>
  );
}