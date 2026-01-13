import React, { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText, Tooltip, Collapse } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import BuildIcon from '@mui/icons-material/Build';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DescriptionIcon from '@mui/icons-material/Description';
import GavelIcon from '@mui/icons-material/Gavel';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.scss';
import classNames from 'classnames';

interface MenuItem {
  path: string;
  icon: JSX.Element;
  text: string;
}

interface MenuGroup {
  icon: JSX.Element;
  text: string;
  items: MenuItem[];
  highlighted?: boolean; // ⚡ NUEVO: Para resaltar el ítem
  staffOnly?: boolean; // ⚡ NUEVO: Solo visible para usuarios is_staff
}

// ⚡ Función para obtener estructura de menú según permisos
const getMenuStructure = (isStaff: boolean): (MenuItem | MenuGroup)[] => {
  const baseMenu: (MenuItem | MenuGroup)[] = [
    {
      path: '/',
      icon: <DashboardIcon />,
      text: 'Dashboard'
    },
    {
      icon: <FolderIcon />,
      text: 'Proyectos',
      items: [
        { path: '/proyectos/lista', icon: <ListIcon />, text: 'Mis Proyectos' },
        { path: '/proyectos/crear', icon: <AddIcon />, text: 'Crear Proyecto Nuevo' }      
      ]
    },
    {
      icon: <AccountBalanceWalletIcon />,
      text: 'Presupuestos',
      items: [
        { path: '/presupuestos/crear', icon: <AddIcon />, text: 'Crear Presupuesto' }
      ]
    },
    {
      icon: <BusinessIcon />,
      text: 'Propiedades',
      items: [
        { path: '/propiedades/crear', icon: <AddIcon />, text: 'Añadir Propiedad' },
        { path: '/propiedades/lista', icon: <ListIcon />, text: 'Lista Propiedades' }
      ]
    },
    {
      icon: <BuildIcon />,
      text: 'Herramientas',
      items: [
        { path: '/herramientas/resistencia-fuego', icon: <LocalFireDepartmentIcon />, text: 'Resistencia al Fuego' },
        { path: '/herramientas/configuracion-informes', icon: <SettingsIcon />, text: 'Configuración de Informes' }
      ]
    }
  ];

  // ⚡ Agregar menú de Administrar solo para staff
  if (isStaff) {
    baseMenu.push({
      icon: <AdminPanelSettingsIcon />,
      text: 'Administrar',
      highlighted: true, // ⚡ Resaltado
      staffOnly: true,
      items: [
        { path: '/admin/permisos', icon: <GavelIcon />, text: 'Permisos' },
        { path: '/admin/formularios', icon: <DescriptionIcon />, text: 'Formularios' }
      ]
    });
  }

  return baseMenu;
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>((props, ref) => {
  const { isCollapsed, onToggle } = props;
  const location = useLocation();
  const { user } = useAuth();
  const [openMenus, setOpenMenus] = React.useState<{ [key: string]: boolean }>({});
  
  // ⚡ Obtener estructura de menú según permisos
  const menuStructure = React.useMemo(
    () => getMenuStructure(user?.is_staff || false),
    [user?.is_staff]
  );

  const isActive = (path: string) => location.pathname === path;

  const handleMenuClick = (menuText: string, event: React.MouseEvent) => {
    if (isCollapsed) {
      event.preventDefault();
      event.stopPropagation();
      onToggle();
    } else {
      setOpenMenus(prev => ({ ...prev, [menuText]: !prev[menuText] }));
    }
  };

  const handleIconClick = (event: React.MouseEvent) => {
    if (isCollapsed) {
      event.preventDefault();
      event.stopPropagation();
      onToggle();
    }
  };

  const renderMenuItem = (item: MenuItem) => (
    <Link to={item.path} className={styles.menuLink} key={item.path}>
      <Tooltip title={isCollapsed ? item.text : ''} placement="right">
        <ListItem
          className={classNames(styles.menuItem, {
            [styles.active]: isActive(item.path)
          })}
        >
          <ListItemIcon 
            className={styles.menuIcon} 
            onClick={handleIconClick}
          >
            {item.icon}
          </ListItemIcon>
          {!isCollapsed && (
            <ListItemText primary={item.text} className={styles.menuText} />
          )}
        </ListItem>
      </Tooltip>
    </Link>
  );

  const renderMenuGroup = (group: MenuGroup) => {
    // ⚡ Filtrar grupos solo para staff si es necesario
    if (group.staffOnly && !user?.is_staff) {
      return null;
    }

    return (
      <div key={group.text}>
        <ListItem
          onClick={(e) => handleMenuClick(group.text, e)}
          className={classNames(styles.menuItem, {
            [styles.highlighted]: group.highlighted // ⚡ Aplicar estilo resaltado
          })}
        >
          <ListItemIcon 
            className={styles.menuIcon}
            onClick={handleIconClick}
          >
            {group.icon}
          </ListItemIcon>
          {!isCollapsed && (
            <>
              <ListItemText primary={group.text} className={styles.menuText} />
              {openMenus[group.text] ? <ExpandLess /> : <ExpandMore />}
            </>
          )}
        </ListItem>
      {!isCollapsed && (
        <Collapse in={openMenus[group.text]} timeout="auto" unmountOnExit>
          <List component="div" disablePadding className={styles.submenuList}>
            {group.items.map(subItem => (
              <Link to={subItem.path} className={styles.menuLink} key={subItem.path}>
                <ListItem
                  className={classNames(styles.submenuItem, {
                    [styles.active]: isActive(subItem.path)
                  })}
                >
                  <ListItemIcon 
                    className={styles.menuIcon}
                    onClick={handleIconClick}
                  >
                    {subItem.icon}
                  </ListItemIcon>
                  <ListItemText primary={subItem.text} className={styles.menuText} />
                </ListItem>
              </Link>
            ))}
          </List>
        </Collapse>
      )}
      </div>
    );
  };

  return (
    <div 
      ref={ref}
      className={classNames(styles.sidebar, {
        [styles.collapsed]: isCollapsed
      })}
    >
      <List component="nav" className={styles.menuList}>
        {menuStructure.map(item => (
          'path' in item ? renderMenuItem(item as MenuItem) : renderMenuGroup(item as MenuGroup)
        ))}
      </List>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 