import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppConfig } from '../../config'; // <--- IMPORT CONFIG

// Material UI Imports
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const history = useHistory();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const doLogin = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(data);
      history.replace('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setErrorMsg("Invalid email or password.");
      } else {
        setErrorMsg("Unable to sign in. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <Box 
          sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: '#f5f5f5'
          }}
        >
          <Container maxWidth="xs">
            <Paper 
              elevation={3} 
              sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}
            >
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
                  {/* DYNAMIC APP NAME */}
                  {AppConfig.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sign in to your account
                </Typography>
              </Box>

              {errorMsg && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(doLogin)} noValidate sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="email"
                  label="Email Address"
                  autoComplete="email"
                  autoFocus
                  error={!!errors.email}
                  helperText={errors.email ? "Email is required" : ""}
                  {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
                />

                <TextField
                  margin="normal"
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password ? "Password is required" : ""}
                  {...register('password', { required: true })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Button fullWidth size="small" color="secondary">
                  Forgot Password?
                </Button>
              </Box>
            </Paper>

            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
              {/* DYNAMIC COPYRIGHT */}
              © {new Date().getFullYear()} {AppConfig.company}
            </Typography>

          </Container>
        </Box>
      </IonContent>
    </IonPage>
  );
};

export default Login;