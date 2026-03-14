"use client";

import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Container,
  Typography,
  Paper,
} from "@mui/material";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSnackbar } from "@/context/SnackbarContext";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, reloadUser } = useContext(AuthContext);
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  // Auto-polling: cek emailVerified setiap 3 detik saat belum verifikasi
  // Begitu user klik link di email (tab lain), halaman ini otomatis update
  useEffect(() => {
    if (!user || user.emailVerified) return;
    const interval = setInterval(() => reloadUser(), 3000);
    return () => clearInterval(interval);
  }, [user, reloadUser]);

  if (loading || !user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Email/password user yang belum verifikasi
  // Google user: emailVerified selalu true, jadi skip blok ini
  if (!user.emailVerified) {
    const handleResend = async () => {
      try {
        await sendEmailVerification(user);
        showSnackbar("Email verifikasi dikirim ulang! Cek inbox-mu.", "success");
      } catch {
        showSnackbar("Gagal mengirim ulang. Coba beberapa saat lagi.", "error");
      }
    };

    return (
      <Container maxWidth="xs" sx={{ height: "100vh", display: "flex", alignItems: "center" }}>
        <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            📬 Verifikasi Email
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Cek email <b>{user.email}</b> dan klik link verifikasi.
            Halaman ini otomatis masuk setelah kamu verifikasi — tidak perlu reload manual.
          </Typography>
          <Alert severity="info" sx={{ mb: 2, textAlign: "left" }}>
            Kalau tidak masuk, cek folder <b>spam/junk</b>.
          </Alert>
          <Button fullWidth variant="contained" onClick={reloadUser} sx={{ mb: 1 }}>
            Sudah klik link verifikasi? Refresh
          </Button>
          <Button fullWidth variant="outlined" onClick={handleResend} sx={{ mb: 1 }}>
            Kirim Ulang Email Verifikasi
          </Button>
          <Button
            fullWidth
            variant="text"
            size="small"
            onClick={() => { auth.signOut(); router.push("/auth"); }}
          >
            Logout
          </Button>
        </Paper>
      </Container>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
