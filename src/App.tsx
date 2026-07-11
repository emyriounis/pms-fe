import './App.css';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useUserAttributes } from './hooks/useUserAttributes';
import { Header } from './components/Header';
import { SuperAdminScreen } from './components/SuperAdminScreen';
import { TenantAdminScreen } from './components/TenantAdminScreen';
import { NoPermissionsScreen } from './components/NoPermissionsScreen';

const MainContent = ({ user }: { user: any }) => {
  const { attributes, loading, error } = useUserAttributes();

  if (loading) return <p>Loading permissions...</p>;
  if (error) return <p style={{ color: '#ff6b6b' }}>Error: {error.message}</p>;

  const role = attributes?.['custom:role'];
  if (role === 'super_admin') return <SuperAdminScreen />;
  if (role === 'tenant_admin') return <TenantAdminScreen />;
  return <NoPermissionsScreen />;
};

const App = () => {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => (
        <div className="App">
          <Header user={user} signOut={signOut} />
          <main style={{ padding: '0 20px' }}>
            <MainContent user={user} />
          </main>
        </div>
      )}
    </Authenticator>
  );
};

export default App;
