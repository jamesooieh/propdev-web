import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSystemRoot } from '../../services/auth';
import { usePermission } from '../../hooks/usePermission';

import { 
  AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem 
} from '@mui/material';
import { 
  Logout as LogoutIcon, 
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBack?: () => void; // <--- 1. Add optional prop definition
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBackButton = false, onBack }) => { // <--- 2. Destructure it here
    const { user, logout } = useAuth();
    const history = useHistory();
    const { can } = usePermission();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigate = (path: string) => {
        history.push(path);
        handleMenuClose();
    };

    const handleLogout = async () => {
        handleMenuClose(); 
        await logout();
        history.replace('/login');
    };

    return (
        <AppBar position="static" elevation={0}>
            <Toolbar>
                {showBackButton ? (
                    <IconButton 
                        edge="start" 
                        color="inherit" 
                        // 3. Use onBack if provided, otherwise default to history.goBack()
                        onClick={onBack ? onBack : () => history.goBack()} 
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                ) : (
                    <>
                        <IconButton 
                            edge="start" 
                            color="inherit" 
                            aria-label="menu" 
                            onClick={handleMenuClick}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Menu
                            id="basic-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            MenuListProps={{ 'aria-labelledby': 'basic-button' }}
                        >
                            <MenuItem onClick={() => handleNavigate('/home')}>Home</MenuItem>
                            
                            {isSystemRoot(user) && (
                                <MenuItem onClick={() => handleNavigate('/developers')}>
                                    Developers
                                </MenuItem>
                            )}

                            {can('view-lands') && (
                                <MenuItem onClick={() => handleNavigate('/lands')}>
                                    Land Bank
                                </MenuItem>
                            )}

                            {can('view-projects') && (
                                <MenuItem onClick={() => handleNavigate('/projects')}>
                                    Projects
                                </MenuItem>
                            )}
                        </Menu>
                    </>
                )}

                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>

                <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                    Logout
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default PageHeader;