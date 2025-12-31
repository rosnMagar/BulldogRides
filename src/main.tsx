import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import outputs from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';

Amplify.configure(outputs);

// Bulldog Rides Theme - Purple (Truman State colors)
const bulldogTheme = createTheme({
  primaryColor: 'violet',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  defaultRadius: 'md',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={bulldogTheme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
