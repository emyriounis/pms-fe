import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Amplify } from 'aws-amplify';
import { I18n } from 'aws-amplify/utils';
import { translations } from '@aws-amplify/ui-react';
import { env } from './utils/env';

// Load all default translations provided by Amplify
I18n.putVocabularies(translations);

// Example: Add a custom language (Greek in this case)
I18n.putVocabulariesForLanguage('el', {
  'Sign In': 'Σύνδεση',
  'Sign in to your account': 'Συνδεθείτε στον λογαριασμό σας',
  Username: 'Όνομα χρήστη',
  Password: 'Κωδικός πρόσβασης',
  'Forgot your password?': 'Ξεχάσατε τον κωδικό σας;',
  'Enter your Username': 'Εισάγετε το όνομα χρήστη σας',
  'Enter your username': 'Εισάγετε το όνομα χρήστη σας',
  'Enter your Password': 'Εισάγετε τον κωδικό σας',
  'Sign in': 'Σύνδεση',
  'Reset Password': 'Επαναφορά κωδικού πρόσβασης',
  'Send code': 'Αποστολή κωδικού',
  'Back to Sign In': 'Επιστροφή στη Σύνδεση',
  'Confirmation Code': 'Κωδικός επιβεβαίωσης',
  'Enter your Confirmation Code': 'Εισάγετε τον κωδικό επιβεβαίωσης',
  'New password': 'Νέος κωδικός πρόσβασης',
  'Enter your new password': 'Εισάγετε τον νέο σας κωδικό',
  Submit: 'Υποβολή',
  'Please fill out this field.': 'Παρακαλώ συμπληρώστε το πεδίο',
});

// Set the default language to Greek (or change to 'fr', 'es', etc.)
I18n.setLanguage('el');

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: env.COGNITO_USER_POOL_ID,
      userPoolClientId: env.COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: env.COGNITO_DOMAIN,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: env.COGNITO_REDIRECT_SIGNIN,
          redirectSignOut: env.COGNITO_REDIRECT_SIGNOUT,
          responseType: 'code',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
