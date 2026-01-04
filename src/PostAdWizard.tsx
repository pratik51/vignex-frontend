import { useState } from 'react';
import { 
  Box, VStack, HStack, Button, Input, FormControl, FormLabel, 
  Select, Text, Radio, RadioGroup, Stack, Textarea, Checkbox 
} from '@chakra-ui/react';

interface PostAdWizardProps {
  onPost: (data: any) => void;
  isLoading: boolean;
}

export default function PostAdWizard({ onPost, isLoading }: PostAdWizardProps) {
  const [step, setStep] = useState(1);

  // --- FORM STATE ---
  const [adType, setAdType] = useState('SELL');
  const [priceType, setPriceType] = useState('FIXED');
  const [price, setPrice] = useState('90.00');
  const [margin, setMargin] = useState('100'); // %
  
  const [amount, setAmount] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['UPI']);
  const [timeLimit, setTimeLimit] = useState('15');

  const [remarks, setRemarks] = useState('');
  const [autoReply, setAutoReply] = useState('');

  // --- HANDLERS ---
  const togglePayment = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter(m => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  const handleFinish = () => {
    // If floating, backend calculates price. We send 0 or user input as base.
    const finalPrice = priceType === 'FIXED' ? Number(price) : 0;

    const payload = {
      type: adType,
      priceType,
      price: finalPrice,
      floatingMargin: Number(margin),
      amount: Number(amount),
      minLimit: Number(minLimit),
      maxLimit: Number(maxLimit),
      paymentMethod: paymentMethods.join(','), // Convert array to string
      paymentTimeLimit: Number(timeLimit),
      remarks,
      autoReply
    };
    onPost(payload);
  };

  return (
    <Box>
      {/* PROGRESS BAR */}
      <HStack mb={6} spacing={2}>
        {[1, 2, 3].map(i => (
           <Box key={i} h="4px" flex={1} bg={step >= i ? "#FCD535" : "gray.600"} borderRadius="full" />
        ))}
      </HStack>

      {/* STEP 1: TYPE & PRICE */}
      {step === 1 && (
        <VStack spacing={5} align="stretch">
          <HStack bg="gray.700" p={1} borderRadius="md">
             <Button flex={1} size="sm" 
               bg={adType === 'BUY' ? 'green.400' : 'transparent'} 
               color={adType === 'BUY' ? 'white' : 'gray.400'}
               _hover={{ bg: adType === 'BUY' ? 'green.500' : 'gray.600' }}
               onClick={() => setAdType('BUY')}>I Want to Buy</Button>
             <Button flex={1} size="sm" 
               bg={adType === 'SELL' ? 'red.400' : 'transparent'} 
               color={adType === 'SELL' ? 'white' : 'gray.400'}
               _hover={{ bg: adType === 'SELL' ? 'red.500' : 'gray.600' }}
               onClick={() => setAdType('SELL')}>I Want to Sell</Button>
          </HStack>

          <FormControl>
            <FormLabel>Price Setting</FormLabel>
            <RadioGroup onChange={setPriceType} value={priceType}>
              <Stack direction='row' spacing={5}>
                <Radio value='FIXED' colorScheme="yellow">Fixed</Radio>
                <Radio value='FLOATING' colorScheme="yellow">Floating</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          {priceType === 'FIXED' ? (
            <FormControl>
              <FormLabel>Price (INR)</FormLabel>
              <Input value={price} onChange={e => setPrice(e.target.value)} bg="gray.900" border="none" />
            </FormControl>
          ) : (
             <FormControl>
              <FormLabel>Floating Margin (%)</FormLabel>
              <Input value={margin} onChange={e => setMargin(e.target.value)} bg="gray.900" border="none" />
              <Text fontSize="xs" color="gray.400" mt={1}>
                Calculated Price: ₹ {(88 * (Number(margin)/100)).toFixed(2)} (Ref Price: 88)
              </Text>
            </FormControl>
          )}

          <Button mt={4} bg="#FCD535" color="black" onClick={() => setStep(2)}>Next</Button>
        </VStack>
      )}

      {/* STEP 2: AMOUNT & PAYMENT */}
      {step === 2 && (
        <VStack spacing={4} align="stretch">
           <FormControl>
              <FormLabel>Total Amount (USDT)</FormLabel>
              <Input value={amount} onChange={e => setAmount(e.target.value)} bg="gray.900" border="none" />
           </FormControl>

           <HStack>
              <FormControl>
                <FormLabel>Min Limit (₹)</FormLabel>
                <Input value={minLimit} onChange={e => setMinLimit(e.target.value)} bg="gray.900" border="none" />
              </FormControl>
              <FormControl>
                <FormLabel>Max Limit (₹)</FormLabel>
                <Input value={maxLimit} onChange={e => setMaxLimit(e.target.value)} bg="gray.900" border="none" />
              </FormControl>
           </HStack>

           <FormControl>
             <FormLabel>Payment Time Limit</FormLabel>
             <Select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} bg="gray.900" border="none">
                <option value="15" style={{color:'black'}}>15 Minutes</option>
                <option value="30" style={{color:'black'}}>30 Minutes</option>
                <option value="45" style={{color:'black'}}>45 Minutes</option>
             </Select>
           </FormControl>

           <FormControl>
             <FormLabel>Payment Methods</FormLabel>
             <Stack spacing={2} direction="row" wrap="wrap">
               {['UPI', 'IMPS', 'Bank Transfer', 'Digital Rupee'].map(m => (
                 <Button 
                   key={m} size="xs" 
                   colorScheme={paymentMethods.includes(m) ? 'yellow' : 'gray'} 
                   variant={paymentMethods.includes(m) ? 'solid' : 'outline'}
                   onClick={() => togglePayment(m)}
                 >
                   {m}
                 </Button>
               ))}
             </Stack>
           </FormControl>

           <HStack mt={4}>
             <Button flex={1} variant="ghost" onClick={() => setStep(1)}>Back</Button>
             <Button flex={1} bg="#FCD535" color="black" onClick={() => setStep(3)}>Next</Button>
           </HStack>
        </VStack>
      )}

      {/* STEP 3: REMARKS & AUTO-REPLY */}
      {step === 3 && (
        <VStack spacing={4} align="stretch">
           <FormControl>
              <FormLabel>Remarks (Terms)</FormLabel>
              <Textarea 
                placeholder="e.g. No third-party payments allowed." 
                value={remarks} onChange={e => setRemarks(e.target.value)} 
                bg="gray.900" border="none" 
              />
           </FormControl>

           <FormControl>
              <FormLabel>Auto-Reply (Sent to Chat)</FormLabel>
              <Textarea 
                placeholder="e.g. I am online! Please send payment." 
                value={autoReply} onChange={e => setAutoReply(e.target.value)} 
                bg="gray.900" border="none" 
              />
           </FormControl>

           <Checkbox colorScheme="yellow" defaultChecked>Client must be registered {'>'} 30 days ago</Checkbox>

           <HStack mt={4}>
             <Button flex={1} variant="ghost" onClick={() => setStep(2)}>Back</Button>
             <Button flex={1} bg="#FCD535" color="black" isLoading={isLoading} onClick={handleFinish}>Post Ad</Button>
           </HStack>
        </VStack>
      )}
    </Box>
  );
}