import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.scss';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuClick?: () => void;
  isPublic?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, isPublic = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
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

  // Si el usuario está autenticado, siempre mostrar la versión completa del navbar
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
              <span className={styles.userName}>
                {user.first_name + ' ' + user.last_name || user.email}
              </span>
              <Avatar
                className={styles.avatar}
                onClick={() => navigate('/profile')}
              />
              <Button
                color="inherit"
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                Cerrar Sesión
              </Button>
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