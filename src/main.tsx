import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize TensorFlow.js early
import { tensorflowConfig } from './services/ml/tensorflowConfig';

// Initialize TensorFlow.js in the background
tensorflowConfig.initialize().catch(error => {
  console.warn('TensorFlow.js initialization failed:', error);
});

// Enable React 18 concurrent features
ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);