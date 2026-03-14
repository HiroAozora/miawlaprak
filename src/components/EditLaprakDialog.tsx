"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Stack,
  CircularProgress,
} from "@mui/material";
import { updateLaprak, Laprak } from "@/lib/firestoreService";
import { useSnackbar } from "@/context/SnackbarContext";

interface EditLaprakDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  semesterId: string;
  laprak: Laprak;
}

export default function EditLaprakDialog({
  open,
  onClose,
  userId,
  semesterId,
  laprak,
}: EditLaprakDialogProps) {
  const { showSnackbar } = useSnackbar();
  const [namaPraktikum, setNamaPraktikum] = useState(laprak.namaPraktikum);
  const [namaAslab, setNamaAslab] = useState(laprak.namaAslab);
  const [namaLaboran, setNamaLaboran] = useState(laprak.namaLaboran);
  const [namaDosen, setNamaDosen] = useState(laprak.namaDosen ?? "");
  const [loading, setLoading] = useState(false);

  // Sync state saat laprak berubah (mis. buka dialog yang berbeda)
  useEffect(() => {
    setNamaPraktikum(laprak.namaPraktikum);
    setNamaAslab(laprak.namaAslab);
    setNamaLaboran(laprak.namaLaboran);
    setNamaDosen(laprak.namaDosen ?? "");
  }, [laprak]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateLaprak(userId, semesterId, laprak.id, {
        namaPraktikum,
        namaAslab,
        namaLaboran,
        namaDosen,
      });
      showSnackbar("Data praktikum berhasil diperbarui!", "success");
      onClose();
    } catch (err: any) {
      showSnackbar("Gagal memperbarui: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Info Praktikum</DialogTitle>
      <DialogContent>
        <Box component="form" id="edit-laprak-form" onSubmit={handleSubmit}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nama Praktikum"
              value={namaPraktikum}
              onChange={(e) => setNamaPraktikum(e.target.value)}
              required
              fullWidth
              disabled={loading}
            />
            <TextField
              label="Nama Aslab"
              value={namaAslab}
              onChange={(e) => setNamaAslab(e.target.value)}
              fullWidth
              disabled={loading}
            />
            <TextField
              label="Nama Laboran"
              value={namaLaboran}
              onChange={(e) => setNamaLaboran(e.target.value)}
              fullWidth
              disabled={loading}
            />
            <TextField
              label="Nama Dosen Pengampu"
              value={namaDosen}
              onChange={(e) => setNamaDosen(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button
          type="submit"
          form="edit-laprak-form"
          variant="contained"
          disabled={loading || !namaPraktikum.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
