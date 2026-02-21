import { createRoot } from 'react-dom/client'
import '@/index.css'
import '@/utils/i18n';
import '@/utils/blockly-global'; // Expose Blockly globally for external plugins
import App from '@/App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
