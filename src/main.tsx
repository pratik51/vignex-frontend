import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import App from './App' // Matches export in App.tsx

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* This Provider passes the "Dark Theme" tools to App */}
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)