import './App.css';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import WrappedView from './WrappedView';

interface AppProps {
  instance: PublicClientApplication;
}

const App = ({ instance }: AppProps) => {
  return (
    <MsalProvider instance={instance}>
      <WrappedView />
    </MsalProvider>
  );
};

export default App;
