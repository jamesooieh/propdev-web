import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSystemRoot } from '../../services/auth'; // Ensure this path is correct based on previous context
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
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBackButton = false }) => {
    const { user, logout } = useAuth();
    const history = useHistory();
    const { can } = usePermission();

    // --- Menu State Management ---
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    // Open Menu
    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    // Close Menu
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Handle Navigation
    const handleNavigate = (path: string) => {
        history.push(path);
        handleMenuClose();
    };

    // Handle Logout
    const handleLogout = async () => {
        // Close menu if it's open (though logout usually redirects anyway)
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
                        onClick={() => history.goBack()} 
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
                            onClick={handleMenuClick} // Trigger the menu
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Dropdown Menu Component */}
                        <Menu
                            id="basic-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            MenuListProps={{
                                'aria-labelledby': 'basic-button',
                            }}
                        >
                            <MenuItem onClick={() => handleNavigate('/home')}>Home</MenuItem>
                            
                            {/* Root Only: Developers */}
                            {isSystemRoot(user) && (
                                <MenuItem onClick={() => handleNavigate('/developers')}>
                                    Developers
                                </MenuItem>
                            )}

                            {/* Permission Check: Lands */}
                            {can('view-lands') && (
                                <MenuItem onClick={() => handleNavigate('/lands')}>
                                    Land Bank
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