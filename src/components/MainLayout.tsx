"use client";

import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  IconButton,
  useMediaQuery,
  Divider,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Skeleton,
  Tooltip,
} from "@mui/material";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonIcon from "@mui/icons-material/Person";
import InfoIcon from "@mui/icons-material/Info";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SchoolIcon from "@mui/icons-material/School";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

// Contexts
import { ThemeContext } from "@/context/ThemeContext";
import { AuthContext } from "@/context/AuthContext";
import { useSemester } from "@/context/SemesterContext";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "@/context/SnackbarContext";
import { deleteSemester } from "@/lib/firestoreService";

// Dialog
import TambahSemesterDialog from "@/components/TambahSemesterDialog";

const drawerWidth = 260;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const theme = useTheme();
  const { toggleTheme, mode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { semesters, activeSemesterId, activeSemester, setActiveSemesterId, loading: semLoading } = useSemester();
  const { showSnackbar } = useSnackbar();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [semesterDialogOpen, setSemesterDialogOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleMenuClick = (path: string) => {
    router.push(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleDeleteSemester = async () => {
    if (!user || !activeSemesterId || !activeSemester) return;
    const confirmed = window.confirm(
      `Hapus semester "${activeSemester.name}"? Semua laprak di semester ini akan ikut terhapus!`
    );
    if (!confirmed) return;
    try {
      await deleteSemester(user.uid, activeSemesterId);
      showSnackbar("Semester berhasil dihapus.", "info");
    } catch (e: any) {
      showSnackbar("Gagal menghapus semester: " + e.message, "error");
    }
  };

  const mainMenuItems = [
    { text: "Beranda", icon: <HomeIcon />, path: "/" },
    { text: "Manage Praktikum", icon: <ListAltIcon />, path: "/manage" },
    { text: "Profil", icon: <PersonIcon />, path: "/profil" },
  ];
  const bottomMenuItems = [{ text: "About", icon: <InfoIcon />, path: "/about" }];

  const userDisplayName = user ? user.displayName || user.email : "Guest";

  const semesterSection = (
    <Box sx={{ px: 2, pb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
        <SchoolIcon fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          SEMESTER
        </Typography>
      </Box>

      {semLoading ? (
        <Skeleton variant="rounded" height={40} />
      ) : semesters.length === 0 ? (
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1 }}>
          Belum ada semester.
        </Typography>
      ) : (
        <FormControl size="small" fullWidth sx={{ mb: 1 }}>
          <Select
            value={activeSemesterId ?? ""}
            onChange={(e) => setActiveSemesterId(e.target.value)}
            displayEmpty
          >
            {semesters.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">{s.name}</Typography>
                  {s.year && (
                    <Typography variant="caption" color="text.secondary">
                      {s.year}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Tooltip title="Tambah Semester Baru">
          <IconButton
            size="small"
            onClick={() => setSemesterDialogOpen(true)}
            color="primary"
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {activeSemesterId && (
          <Tooltip title={`Hapus "${activeSemester?.name}"`}>
            <IconButton
              size="small"
              onClick={handleDeleteSemester}
              color="error"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar />
      {/* User Card */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 1.5,
            bgcolor: mode === "dark" ? "grey.800" : "grey.200",
            borderRadius: theme.shape.borderRadius / 8,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar sx={{ width: 40, height: 40 }} src={user?.photoURL || undefined}>
            {user?.displayName?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="subtitle2" noWrap fontWeight="bold">
              {userDisplayName}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Semester Section */}
      <Box sx={{ pt: 2 }}>
        {semesterSection}
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Navigation */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {mainMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleMenuClick(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      <List>
        {bottomMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleMenuClick(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const headerTitle = activeSemester
    ? `${activeSemester.name}${activeSemester.year ? ` · ${activeSemester.year}` : ""}`
    : "miawlaprak";

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {headerTitle}
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          overflowX: "hidden",
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Dialog Tambah Semester */}
      {user && (
        <TambahSemesterDialog
          open={semesterDialogOpen}
          onClose={() => setSemesterDialogOpen(false)}
          userId={user.uid}
          onCreated={(id) => setActiveSemesterId(id)}
        />
      )}
    </Box>
  );
}
