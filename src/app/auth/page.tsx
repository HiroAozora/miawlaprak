"use client";

import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { AuthContext } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Alert,
  Link,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

// Helper: terjemahkan kode error Firebase ke pesan Indonesia
function translateError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau password salah.";
    case "auth/email-already-in-use":
      return "Email sudah terdaftar.";
    case "auth/weak-password":
      return "Password terlalu lemah (minimal 6 karakter).";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi nanti.";
    case "auth/popup-closed-by-user":
      return "Login Google dibatalkan.";
    default:
      return "Terjadi kesalahan. Silakan coba lagi.";
  }
}

export default function AuthPage() {
  const [tabIndex, setTabIndex] = useState(0); // 0 = login, 1 = register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    // Hanya redirect kalau email sudah diverifikasi
    if (user && user.emailVerified) {
      router.push("/");
    }
  }, [user, router]);

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setTabIndex(v);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setVerificationSent(false);
    setShowForgotPassword(false);
  };

  // ── Email + Password ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (tabIndex === 0) {
        // Login
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          showSnackbar("Email belum diverifikasi. Cek inbox-mu!", "warning");
          // Tawarkan kirim ulang verifikasi
          setVerificationSent(false);
          return;
        }
        showSnackbar("Berhasil login!", "success");
        router.push("/");
      } else {
        // Register — kirim email verifikasi
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await sendEmailVerification(cred.user);
        setVerificationSent(true);
        showSnackbar("Registrasi berhasil! Cek email untuk verifikasi.", "success");
        // Jangan push ke "/" dulu — user harus verifikasi dulu
      }
    } catch (error: any) {
      showSnackbar(translateError(error.code), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Lupa Password ───────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showSnackbar("Masukkan email terlebih dahulu.", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showSnackbar("Link reset password sudah dikirim ke email kamu!", "success");
      setShowForgotPassword(false);
    } catch (error: any) {
      showSnackbar(translateError(error.code), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Google Sign-in ──────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Google account otomatis terverifikasi
      showSnackbar("Berhasil login dengan Google!", "success");
      router.push("/");
    } catch (error: any) {
      showSnackbar(translateError(error.code), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user && user.emailVerified) return null;

  // ── Tampilan setelah register: minta user verifikasi email ──────────────
  if (verificationSent) {
    return (
      <Container maxWidth="xs" sx={{ height: "100vh", display: "flex", alignItems: "center" }}>
        <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>📬 Cek Email Kamu!</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Kami kirim link verifikasi ke <b>{email}</b>. Klik link tersebut untuk mengaktifkan akun, lalu login.
          </Typography>
          <Alert severity="info" sx={{ mb: 2, textAlign: "left" }}>
            Kalau emailnya tidak masuk, cek folder <b>spam/junk</b>.
          </Alert>
          <Button fullWidth variant="outlined" onClick={() => { setVerificationSent(false); setTabIndex(0); }}>
            Kembali ke Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs" sx={{ height: "100vh", display: "flex", alignItems: "center" }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom fontWeight="bold">
          miawlaprak
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Tracker tugas praktikum terbaikmu
        </Typography>

        {/* Google Sign-in */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          sx={{ mb: 2, py: 1.2, borderColor: "divider" }}
        >
          Masuk dengan Google
        </Button>

        <Divider sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">atau</Typography>
        </Divider>

        <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {/* Lupa Password */}
        {showForgotPassword ? (
          <Box component="form" onSubmit={handleForgotPassword}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Masukkan email akun kamu, kami akan kirim link reset password.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Button fullWidth variant="contained" type="submit" disabled={isSubmitting} sx={{ mt: 2, mb: 1 }}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Kirim Link Reset"}
            </Button>
            <Button fullWidth variant="text" size="small" onClick={() => setShowForgotPassword(false)}>
              ← Kembali ke Login
            </Button>
          </Box>
        ) : (
          <>
            {/* Form Login / Register */}
            <Box component="form" onSubmit={handleSubmit}>
              {tabIndex === 1 && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Nama Panggilan"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus={tabIndex === 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 1, py: 1.5 }}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <CircularProgress size={24} color="inherit" />
                  : tabIndex === 0 ? "Login" : "Register"}
              </Button>
            </Box>

            {tabIndex === 0 && (
              <Box sx={{ textAlign: "center" }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Lupa password?
                </Link>
              </Box>
            )}

            {tabIndex === 1 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Setelah register, kamu akan menerima email verifikasi. Pastikan email yang kamu masukkan aktif.
              </Alert>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
