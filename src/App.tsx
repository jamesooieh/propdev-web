import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Pages */
import Home from './pages/Home';
import Login from './pages/auth/Login';

/* Context */
import { AuthProvider, useAuth } from './context/AuthContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';
import DeveloperList from './pages/developer/DeveloperList';
import DeveloperForm from './pages/developer/DeveloperForm';

setupIonicReact();

/**
 * Helper Component: Private Route
 * Checks if user is logged in. If yes, show component. If no, redirect to login.
 */
const PrivateRoute: React.FC<{ component: React.FC; path: string; exact?: boolean }> = ({ component: Component, ...rest }) => {
  const { user, isLoading } = useAuth();

  // Show a spinner while checking storage for token
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={props =>
        user ? <Component /> : <Redirect to="/login" />
      }
    />
  );
};

/**
 * Inner Component to handle Routing
 * Must be separated so it can access the useAuth() context
 */
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <IonRouterOutlet>
      
      {/* Login Route */}
      <Route exact path="/login">
        {/* If already logged in, kick them to Home */}
        {user ? <Redirect to="/home" /> : <Login />}
      </Route>

      {/* Protected Dashboard Route (Your Home Page) */}
      <PrivateRoute path="/home" component={Home} />

      {/* Developer Routes */}
      {/* Note: We rely on the Backend (403 Forbidden) for strict security, 
         but you can also wrap these in a check like: 
         {isSystemRoot(user) && <PrivateRoute ... />} 
         if you want to completely block the client-side route.
      */}
      <PrivateRoute exact path="/developers" component={DeveloperList} />
      <PrivateRoute exact path="/developers/create" component={DeveloperForm} />
      <PrivateRoute exact path="/developers/edit/:id" component={DeveloperForm} />

      {/* Default Redirect */}
      <Route exact path="/">
        <Redirect to="/home" />
      </Route>

    </IonRouterOutlet>
  );
};

/**
 * Main App Component
 */
const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      {/* We must wrap the router content in AuthProvider */}
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;