"use client";

import React, { useState } from "react";
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
import { addSemester } from "@/lib/firestoreService";
import { useSnackbar } from "@/context/SnackbarContext";

interface TambahSemesterDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  /** Dipanggil setelah semester berhasil dibuat dengan semesterId baru */
  onCreated?: (semesterId: string) => void;
}

export default function TambahSemesterDialog({
  open,
  onClose,
  userId,
  onCreated,
}: TambahSemesterDialogProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleClose = () => {
    setName("");
    setYear("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const id = await addSemester(userId, name.trim(), year.trim());
      showSnackbar(`Semester "${name}" berhasil dibuat!`, "success");
      onCreated?.(id);
      handleClose();
    } catch (err: any) {
      showSnackbar("Gagal membuat semester: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Buat Semester Baru</DialogTitle>
      <DialogContent>
        <Box component="form" id="tambah-semester-form" onSubmit={handleSubmit}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nama Semester"
              placeholder="mis: Semester 1 / Ganjil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              disabled={loading}
            />
            <TextField
              label="Tahun Ajaran"
              placeholder="mis: 2024/2025"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          type="submit"
          form="tambah-semester-form"
          variant="contained"
          disabled={loading || !name.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

