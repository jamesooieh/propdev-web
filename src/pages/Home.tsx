import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import { isSystemRoot } from '../services/auth'; // <--- Import Helper
import { AppConfig } from '../config';

// MUI Imports (MUI v6/v7)
import {
  AppBar, Toolbar, Typography, Button, Container, Paper, Avatar, Box, IconButton, Grid 
} from '@mui/material';

import { 
  Logout as LogoutIcon, 
  Person as PersonIcon, 
  Menu as MenuIcon,
  Business as BusinessIcon, // Icon for Developers
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await logout();
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Dashboard
            </Typography>
            <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '92vh' }}>
          <Container maxWidth="md">
            
            <Box sx={{ mb: 4, mt: 2 }}>
              <Typography variant="h4" gutterBottom component="div" fontWeight="bold">
                Welcome back, {user?.name?.split(' ')[0]}!
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Here is an overview of your account status.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              
              {/* Card 1: User Profile */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">My Profile</Typography>
                      {/* Show roles cleanly, joined by comma if multiple */}
                      <Typography variant="body2" color="textSecondary">
                        {user?.roles?.map(r => r.title).join(', ') || 'User'}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1">{user?.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{user?.email}</Typography>
                </Paper>
              </Grid>

              {/* Card 2: Developer Management (ROOT ONLY) */}
              {isSystemRoot(user) && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                        p: 3, 
                        borderRadius: 2, 
                        height: '100%', 
                        cursor: 'pointer',
                        transition: '0.3s',
                        '&:hover': { bgcolor: '#f0f7ff', transform: 'translateY(-2px)' }
                    }}
                    onClick={() => history.push('/developers')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">Developers</Typography>
                        <Typography variant="body2" color="textSecondary">Master Data</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                        Manage property developers, registrations, and statuses.
                    </Typography>
                    <Button size="small" sx={{ mt: 2 }} variant="outlined">
                        Manage Developers
                    </Button>
                  </Paper>
                </Grid>
              )}

              {/* Card 3: System Status */}
              <Grid size={{ xs: 12, md: isSystemRoot(user) ? 12 : 6 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6">System Status</Typography>
                   </Box>
                  <Typography variant="body2">
                    Connected to {AppConfig.name}.
                  </Typography>
                </Paper>
              </Grid>

            </Grid>

          </Container>
        </Box>
      </IonContent>
    </IonPage>
  );
};

export default Home;