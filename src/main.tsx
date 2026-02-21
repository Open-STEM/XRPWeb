import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import '@/utils/i18n';
import '@/utils/blockly-global'; // Expose Blockly globally for external plugins
import App from '@/App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

function Root() {
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleAuthBackendUrl = 'http://localhost:8001'; // Hardcoded as per previous instruction

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const response = await fetch(`${googleAuthBackendUrl}/google-auth/client-id`);
        if (!response.ok) {
          throw new Error(`Failed to fetch client ID: ${response.statusText}`);
        }
        const data = await response.json();
        setGoogleClientId(data.client_id);
      } catch (error) {
        console.error("Error fetching Google Client ID:", error);
        // Handle error appropriately, e.g., show an error message to the user
      }
    };
    fetchClientId();
  }, []);

  if (!googleClientId) {
    // Optionally render a loading spinner or message
    return <div>Loading Google authentication...</div>;
  }

  return (
    <StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(
  <Root />
)
