"use client";

import React, { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useSemester } from "@/context/SemesterContext";
import { addLaprak } from "@/lib/firestoreService";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function TambahPraktikumForm() {
  const { user } = useContext(AuthContext);
  const { activeSemesterId } = useSemester();
  const { showSnackbar } = useSnackbar();

  const [namaPraktikum, setNamaPraktikum] = useState("");
  const [jumlahModul, setJumlahModul] = useState(8);
  const [namaAslab, setNamaAslab] = useState("");
  const [namaLaboran, setNamaLaboran] = useState("");
  const [namaDosen, setNamaDosen] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) { showSnackbar("Anda harus login!", "warning"); return; }
    if (!activeSemesterId) { showSnackbar("Pilih semester terlebih dahulu!", "warning"); return; }

    const modulesArray = Array.from({ length: jumlahModul }, (_, i) => ({
      id: i + 1,
      judul: `Modul ${i + 1}`,
      selesai: false,
      accAslab: false,
      accLaboran: false,
    }));

    try {
      await addLaprak(user.uid, activeSemesterId, {
        namaPraktikum,
        namaAslab,
        namaLaboran,
        namaDosen,
        ttdKartuKuning: false,
        modules: modulesArray,
      });
      showSnackbar("Data praktikum berhasil ditambah!", "success");
      setNamaPraktikum("");
      setNamaAslab("");
      setNamaLaboran("");
      setNamaDosen("");
      setJumlahModul(8);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, maxWidth: "700px" }}>
      <Typography variant="h6" gutterBottom>Tambah Praktikum Baru</Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Nama Praktikum"
            value={namaPraktikum}
            onChange={(e) => setNamaPraktikum(e.target.value)}
            required fullWidth
          />
          <TextField
            label="Nama Aslab"
            value={namaAslab}
            onChange={(e) => setNamaAslab(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nama Laboran"
            value={namaLaboran}
            onChange={(e) => setNamaLaboran(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nama Dosen Pengampu"
            value={namaDosen}
            onChange={(e) => setNamaDosen(e.target.value)}
            fullWidth
          />
          <TextField
            label="Jumlah Modul"
            type="number"
            value={jumlahModul}
            onChange={(e) => setJumlahModul(Number(e.target.value))}
            required fullWidth
            InputProps={{ inputProps: { min: 1 } }}
          />
          <Button type="submit" variant="contained" startIcon={<AddIcon />}>
            Tambah Praktikum
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
