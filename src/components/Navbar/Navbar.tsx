import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.scss';
import { useAuth } from '../../context/AuthContext';
import { getProfilePhotoUrl } from '../../utils/helpers';

interface NavbarProps {
  onMenuClick?: () => void;
  isPublic?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, isPublic = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleUserMenuClose();
    navigate('/perfil');
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/');
    }
  };

  const shouldShowFullNavbar = user || !isPublic;

  return (
    <AppBar position="fixed" className={styles.navbar}>
      <Toolbar>
        {shouldShowFullNavbar && (
          <IconButton
            color="inherit"
            aria-label="go to home"
            onClick={handleLogoClick}
            edge="start"
            className={styles.menuButton}
            id="sidebar-toggle"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography 
          variant="h6" 
          component="div" 
          className={styles.title}
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        >
          MDA
        </Typography>

        {shouldShowFullNavbar && (
          <div className={styles.search}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar..."
              className={styles.searchInput}
            />
          </div>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Box className={styles.actions}>
          {user ? (
            <>
              <IconButton color="inherit">
                <NotificationsIcon />
              </IconButton>
              <Box
                className={styles.userMenuTrigger}
                onClick={handleUserMenuOpen}
                aria-controls={menuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
              >
                <Avatar
                  className={styles.avatar}
                  src={getProfilePhotoUrl(user.profile_photo)}
                >
                  {!user.profile_photo &&
                    (user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase())}
                </Avatar>
                <span className={styles.userName}>
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}
                </span>
                <ArrowDownIcon
                  className={styles.arrowIcon}
                  sx={{ fontSize: 18 }}
                />
              </Box>
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 180,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                  },
                }}
              >
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Mi Perfil</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Cerrar Sesión</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              className={styles.loginButton}
            >
              Iniciar Sesión
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 