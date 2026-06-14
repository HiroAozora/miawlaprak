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
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface TambahPraktikumFormProps {
  onClose?: () => void;
}

export default function TambahPraktikumForm({ onClose }: TambahPraktikumFormProps) {
  const { user } = useContext(AuthContext);
  const { activeSemesterId } = useSemester();
  const { showSnackbar } = useSnackbar();

  const [namaPraktikum, setNamaPraktikum] = useState("");
  const [jumlahModul, setJumlahModul] = useState(8);
  const [namaAslab, setNamaAslab] = useState("");
  const [namaLaboran, setNamaLaboran] = useState("");
  const [namaDosen, setNamaDosen] = useState("");
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
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
      if (onClose) onClose();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <DialogTitle>Tambah Praktikum Baru</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nama Praktikum"
            value={namaPraktikum}
            onChange={(e) => setNamaPraktikum(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Nama Aslab"
            value={namaAslab}
            onChange={(e) => setNamaAslab(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Nama Laboran"
            value={namaLaboran}
            onChange={(e) => setNamaLaboran(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Nama Dosen Pengampu"
            value={namaDosen}
            onChange={(e) => setNamaDosen(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Jumlah Modul"
            type="number"
            value={jumlahModul}
            onChange={(e) => setJumlahModul(Number(e.target.value))}
            required
            fullWidth
            size="small"
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Batal
        </Button>
        <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={loading}>
          Tambah
        </Button>
      </DialogActions>
    </Box>
  );
}
