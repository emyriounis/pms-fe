import { useEffect, useState } from 'react';
import './App.css';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchAuthSession } from 'aws-amplify/auth';
import { env } from './utils/env';

const MainContent = ({ user, signOut }: { user: any; signOut: any }) => {
  const [apiResponse, setApiResponse] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const { tokens } = await fetchAuthSession();
          const idToken = tokens?.idToken?.toString();

          if (!env.API_URL) {
            setApiResponse('REACT_APP_PMS_BE_DOMAIN is missing in environment variables (.env)');
            return;
          }

          const response = await fetch(`${env.API_URL}/test-auth`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setApiResponse(JSON.stringify(data, null, 2));
        } catch (error: any) {
          setApiResponse(`Error: ${error.message}`);
        }
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="App">
      <main>
        {user && <h1>Hello {user.username}</h1>}
        <button onClick={signOut}>Sign out</button>

        <div
          style={{
            marginTop: '40px',
            textAlign: 'left',
            padding: '20px',
            background: '#282c34',
            borderRadius: '8px',
            color: 'white',
            maxWidth: '600px',
            margin: '40px auto',
          }}
        >
          <h3>API Response (/test-auth):</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {apiResponse || 'Loading...'}
          </pre>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => <MainContent user={user} signOut={signOut} />}
    </Authenticator>
  );
};

export default App;
