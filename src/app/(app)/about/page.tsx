"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Link,
  Chip,
  Stack,
  Divider,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from "@mui/material";
// Ikon Teknologi
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import PaletteIcon from "@mui/icons-material/Palette";
import BoltIcon from "@mui/icons-material/Bolt";
// Ikon Sosmed & Profil
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PersonIcon from "@mui/icons-material/Person";
// Ikon Cara Penggunaan
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import HomeIcon from "@mui/icons-material/Home";
import profilePic from "@/assets/pp.png"; // Adjusted path for Next.js

export default function AboutPage() {
  const githubUsername = "HiroAozora";
  const githubProfileLink = `https://github.com/${githubUsername}`;
  const instagramLink = "https://instagram.com/zhayan.hiro";
  const youtubeLink = "https://youtube.com/@hirosukangedit";
  const tiktokLink = "https://tiktok.com/@hirostandwithpalestine";
  const currentVersion = "1.0.0";

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tentang My Laprak guehh
      </Typography>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" gutterBottom>
          haloo gess! sekilas lah ya
        </Typography>
        <Typography variant="body1" paragraph>
          <Typography component="span" fontWeight="bold">
            My Laprak guehh
          </Typography>{" "}
          tu aplikasi web modern (kayaknya) yang dirancang untuk bantu aku,
          kamu, kita semua biar gampang nge tracking atau nyatat laprak2 kita,
          biar ga bingung lagi laprak mana yg blm dikerjain. Jadi gada lagi
          catat2 manual, yaa meskipun ga signifikan kali pengaruhnya sama
          progress laprak tapi okelaa yakan 🤗
        </Typography>
        <Typography variant="body1" paragraph>
          Jadi web ini dibangun dari nol sebagai{" "}
          <Typography component="span" fontWeight="bold">
            proyek portofolio
          </Typography>{" "}
          untuk mendemonstrasikan kemampuan dalam pengembangan web full-stack
          menggunakan teknologi terkini.
        </Typography>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          Sekilas Pembuat
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 1,
            p: 1.5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "grey.800" : "grey.100",
            borderRadius: (theme) => theme.shape.borderRadius,
            maxWidth: "fit-content",
          }}
        >
          <Avatar
            alt="Foto Profil Hiro"
            src={profilePic.src} // Use .src for Next.js Image component compatibility
            sx={{ width: 56, height: 56 }}
          >
            {githubUsername ? (
              githubUsername.charAt(0).toUpperCase()
            ) : (
              <PersonIcon />
            )}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              hiro suka ngedit
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mahasigma Ilmu Komputer
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="body2"
          paragraph
          color="text.secondary"
          sx={{ fontStyle: "italic" }}
        >
          hidup kadang pdd (pusing dengan deadline, jadi jangan lupa ngelaprak.
          aslinya aku suka ngedit
        </Typography>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          Cara Penggunaan Singkat 💡
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <HomeIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Beranda"
              secondary="Lihat ringkasan progres semua praktikum."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AddCircleOutlineIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Tambah Praktikum"
              secondary="Di halaman 'Manage Praktikum', isi form di atas."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <EditIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Edit Judul Modul"
              secondary="Klik judul modul, ketik, lalu klik di luar input."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckBoxIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Update Status Modul"
              secondary="Centang checkbox progres."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DeleteForeverIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Hapus"
              secondary="Gunakan ikon tong sampah atau tombol 'Hapus Praktikum' (ada konfirmasi)."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Teknologi yang Digunakan 🚀
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
        >
          <Chip
            icon={<CodeIcon />}
            label="Next.js"
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<StorageIcon />}
            label="Firebase"
            sx={{ bgcolor: "#FFA000", color: "white" }}
          />
          <Chip
            icon={<PaletteIcon />}
            label="Material UI (MUI)"
            color="info"
            variant="outlined"
          />
        </Stack>
        <Typography variant="body1" paragraph>
          Dibangun dengan{" "}
          <Typography component="span" fontWeight="bold">
            Next.js
          </Typography>{" "}
          untuk UI yang interaktif dan SSR,{" "}
          <Typography component="span" fontWeight="bold">
            Firebase
          </Typography>{" "}
          (Firestore & Auth) sebagai backend{" "}
          <Typography component="span" fontWeight="bold">
            serverless
          </Typography>{" "}
          yang{" "}
          <Typography component="span" fontWeight="bold">
            real-time
          </Typography>
          , dan{" "}
          <Typography component="span" fontWeight="bold">
            Material UI (MUI)
          </Typography>{" "}
          untuk desain komponen yang{" "}
          <Typography component="span" fontWeight="bold">
            aesthetic
          </Typography>{" "}
          dan responsif.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Kode Sumber & Kontak
        </Typography>
        <Typography variant="body1" paragraph>
          Aplikasi ini masih dalam tahap pengembangan aktif. Kode sumber akan
          dipublikasikan segera setelah beberapa fitur tambahan dan pembersihan
          pejabat korup selesai.
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<GitHubIcon />}
          disabled
          sx={{
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "grey.700" : "grey.300",
            color: "text.disabled",
            "&:hover": {
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "grey.700" : "grey.300",
            },
          }}
        >
          Source Code (Coming Soon)
        </Button>

        <Typography variant="body1" sx={{ mt: 3, mb: 1 }}>
          Temukan saya di:
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton
            component={Link}
            href={githubProfileLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            size="small"
          >
            <GitHubIcon />
          </IconButton>
          <IconButton
            component={Link}
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Profile"
            color="secondary"
            size="small"
          >
            <InstagramIcon />
          </IconButton>
          <IconButton
            component={Link}
            href={youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube Channel"
            sx={{ color: "#FF0000" }}
            size="small"
          >
            <YouTubeIcon />
          </IconButton>
          <Button
            component={Link}
            href={tiktokLink}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ minWidth: "auto", padding: "4px", color: "text.primary" }}
            aria-label="TikTok Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="18"
              width="16"
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z" />
            </svg>
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          textAlign="center"
        >
          Laprak Tracker v{currentVersion} - Masih dalam pengembangan.
        </Typography>
      </Paper>
    </Box>
  );
}