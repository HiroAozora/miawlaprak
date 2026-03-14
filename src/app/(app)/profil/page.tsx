"use client";

import React, { useState, useContext, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  signOut,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { AuthContext } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  TextField,
  Stack,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import LockResetIcon from "@mui/icons-material/LockReset";
import GoogleIcon from "@mui/icons-material/Google";
import EmailIcon from "@mui/icons-material/Email";

export default function ProfilPage() {
  const { user, setUser } = useContext(AuthContext);
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isGoogleUser = user?.providerData?.[0]?.providerId === "google.com";

  useEffect(() => {
    if (user) setDisplayName(user.displayName || "");
  }, [user]);

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleConfirmLogout = async () => {
    setConfirmLogoutOpen(false);
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (e: any) {
      showSnackbar("Gagal logout: " + e.message, "error");
    }
  };

  // ── Simpan nama ──────────────────────────────────────────────────────────
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !user) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...auth.currentUser } as any);
      showSnackbar("Profil berhasil diperbarui!", "success");
    } catch (e: any) {
      showSnackbar("Gagal memperbarui profil: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Ganti Password (via email reset) ─────────────────────────────────────
  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      showSnackbar(`Link ganti password dikirim ke ${user.email}!`, "success");
    } catch (e: any) {
      showSnackbar("Gagal mengirim link: " + e.message, "error");
    }
  };

  // ── Hapus Akun ───────────────────────────────────────────────────────────
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsDeleting(true);
    try {
      // Email/password user perlu re-autentikasi sebelum hapus
      if (!isGoogleUser && deletePassword) {
        const credential = EmailAuthProvider.credential(user!.email!, deletePassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await deleteUser(auth.currentUser);
      showSnackbar("Akun berhasil dihapus.", "info");
      router.push("/auth");
    } catch (e: any) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        showSnackbar("Password salah, akun tidak dihapus.", "error");
      } else if (e.code === "auth/requires-recent-login") {
        showSnackbar("Sesi terlalu lama. Logout dan login ulang, lalu coba lagi.", "warning");
      } else {
        showSnackbar("Gagal menghapus akun: " + e.message, "error");
      }
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setDeletePassword("");
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Profil Kamu</Typography>

      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, maxWidth: "sm", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        {/* Avatar */}
        <Avatar sx={{ width: 80, height: 80 }} src={user.photoURL || undefined}>
          {!user.photoURL && <PersonIcon sx={{ fontSize: 50 }} />}
        </Avatar>

        {/* Email + provider badge */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body1" color="textSecondary" sx={{ wordBreak: "break-all" }}>
            {user.email}
          </Typography>
          <Chip
            size="small"
            icon={isGoogleUser ? <GoogleIcon /> : <EmailIcon />}
            label={isGoogleUser ? "Akun Google" : "Email & Password"}
            sx={{ mt: 0.5 }}
          />
        </Box>

        {/* Form nama */}
        <Box component="form" onSubmit={handleProfileSave} sx={{ width: "100%", mt: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="Nama Panggilan"
              fullWidth
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSaving}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={isSaving}
            >
              {isSaving ? "Menyimpan..." : "Simpan Nama"}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ width: "100%", my: 1 }} />

        {/* Ganti Password — hanya untuk email/password user */}
        {!isGoogleUser && (
          <Box sx={{ width: "100%" }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Keamanan Akun
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LockResetIcon />}
              onClick={handleSendPasswordReset}
            >
              Kirim Link Ganti Password
            </Button>
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5, textAlign: "center" }}>
              Link akan dikirim ke {user.email}
            </Typography>
          </Box>
        )}

        <Divider sx={{ width: "100%", my: 1 }} />

        {/* Zona Berbahaya */}
        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Zona Berbahaya
          </Typography>
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => setConfirmLogoutOpen(true)}
            >
              Logout
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Hapus Akun Permanen
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Dialog Logout */}
      <Dialog open={confirmLogoutOpen} onClose={() => setConfirmLogoutOpen(false)}>
        <DialogTitle>Konfirmasi Logout</DialogTitle>
        <DialogContent><DialogContentText>Yakin ingin keluar dari aplikasi?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogoutOpen(false)}>Tidak</Button>
          <Button onClick={handleConfirmLogout} color="error" autoFocus>Ya, Logout</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Hapus Akun */}
      <Dialog open={confirmDeleteOpen} onClose={() => { setConfirmDeleteOpen(false); setDeletePassword(""); }} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Akun Permanen?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Aksi ini <b>tidak bisa dibatalkan</b>. Semua data kamu akan tetap ada di Firestore, tetapi akun login akan dihapus.
          </Alert>
          {!isGoogleUser && (
            <TextField
              fullWidth
              label="Konfirmasi Password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              helperText="Masukkan password untuk konfirmasi"
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmDeleteOpen(false); setDeletePassword(""); }}>Batal</Button>
          <Button
            component="button"
            color="error"
            variant="contained"
            disabled={isDeleting || (!isGoogleUser && !deletePassword)}
            onClick={handleDeleteAccount as any}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}
          >
            {isDeleting ? "Menghapus..." : "Hapus Akun"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
