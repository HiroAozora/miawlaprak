"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useSemester } from "@/context/SemesterContext";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SchoolIcon from "@mui/icons-material/School";
import EditLaprakDialog from "@/components/EditLaprakDialog";
import { Laprak } from "@/lib/firestoreService";

interface PraktikumItemProps {
  laprak: Laprak;
  onJudulSave: (laprakId: string, moduleId: number, finalJudul: string) => void;
  onCheckboxChange: (laprakId: string, moduleId: number, field: string) => void;
  onTtdChange: (laprakId: string) => void;
  onDeleteModule: (laprakId: string, moduleId: number) => void;
  onAddModule: (laprakId: string) => void;
  onDeleteLaprak: (laprakId: string) => void;
}

function PraktikumItem({
  laprak,
  onJudulSave,
  onCheckboxChange,
  onTtdChange,
  onDeleteModule,
  onAddModule,
  onDeleteLaprak,
}: PraktikumItemProps) {
  const { user } = useContext(AuthContext);
  const { activeSemesterId } = useSemester();
  const [judulInputs, setJudulInputs] = useState<{ [key: number]: string }>({});
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (laprak && Array.isArray(laprak.modules)) {
      const initialInputs = laprak.modules.reduce((acc, mod) => {
        acc[mod.id] = mod.judul;
        return acc;
      }, {} as Record<number, string>);
      setJudulInputs(initialInputs);
    } else {
      setJudulInputs({});
    }
  }, [laprak]);

  const handleLocalJudulChange = (moduleId: number, value: string) => {
    setJudulInputs((prev) => ({ ...prev, [moduleId]: value }));
  };

  const handleLocalJudulBlur = (moduleId: number) => {
    const finalValue = judulInputs[moduleId];
    const originalJudul = laprak?.modules?.find((m) => m.id === moduleId)?.judul;
    if (finalValue !== undefined && finalValue !== originalJudul) {
      onJudulSave(laprak.id, moduleId, finalValue);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, overflow: "hidden" }}>
      {/* Header: Nama Praktikum + tombol Edit + Hapus */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ flexGrow: 1, mr: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {laprak.namaPraktikum}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aslab: <b>{laprak.namaAslab || "-"}</b>
            {" · "}
            Laboran: <b>{laprak.namaLaboran || "-"}</b>
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Tooltip title="Edit info praktikum">
            <IconButton size="small" color="primary" onClick={() => setEditOpen(true)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hapus praktikum ini">
            <IconButton size="small" color="error" onClick={() => onDeleteLaprak(laprak.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Tabel modul + baris dosen */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ overflowX: "auto", border: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Table size="small" sx={{ minWidth: "650px" }}>
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: "bold" } }}>
              <TableCell sx={{ minWidth: "200px" }}>Judul Modul</TableCell>
              <TableCell align="center">Selesai</TableCell>
              <TableCell align="center">ACC Aslab</TableCell>
              <TableCell align="center">ACC Laboran</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Baris Modul */}
            {Array.isArray(laprak.modules) && laprak.modules.map((mod) => (
              <TableRow key={mod.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <TextField
                    variant="standard"
                    fullWidth
                    value={judulInputs[mod.id] || ""}
                    onChange={(e) => handleLocalJudulChange(mod.id, e.target.value)}
                    onBlur={() => handleLocalJudulBlur(mod.id)}
                    InputProps={{ disableUnderline: true }}
                    sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem" } }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox size="small" checked={!!mod.selesai} onChange={() => onCheckboxChange(laprak.id, mod.id, "selesai")} />
                </TableCell>
                <TableCell align="center">
                  <Checkbox size="small" checked={!!mod.accAslab} onChange={() => onCheckboxChange(laprak.id, mod.id, "accAslab")} />
                </TableCell>
                <TableCell align="center">
                  <Checkbox size="small" checked={!!mod.accLaboran} onChange={() => onCheckboxChange(laprak.id, mod.id, "accLaboran")} />
                </TableCell>
                <TableCell align="center">
                  <IconButton color="warning" size="small" onClick={() => onDeleteModule(laprak.id, mod.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {(!Array.isArray(laprak.modules) || laprak.modules.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                  Belum ada modul.
                </TableCell>
              </TableRow>
            )}

            {/* Baris Dosen — dipisah dengan garis */}
            <TableRow sx={{ backgroundColor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
              <TableCell component="th" scope="row">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SchoolIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Dosen: <b>{laprak.namaDosen || "-"}</b>
                  </Typography>
                </Box>
              </TableCell>
              {/* TTD hanya 1 kolom, span sisanya kosong */}
              <TableCell align="center" colSpan={3}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  <Checkbox
                    size="small"
                    checked={!!laprak.ttdKartuKuning}
                    onChange={() => onTtdChange(laprak.id)}
                    color="warning"
                  />
                  <Typography variant="caption" color="text.secondary">TTD Kartu Kuning</Typography>
                </Box>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Button onClick={() => onAddModule(laprak.id)} startIcon={<AddIcon />} size="small" sx={{ mt: 2 }}>
        Tambah Modul
      </Button>

      {/* Dialog Edit Info */}
      {user && activeSemesterId && (
        <EditLaprakDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          userId={user.uid}
          semesterId={activeSemesterId}
          laprak={laprak}
        />
      )}
    </Paper>
  );
}

export default React.memo(PraktikumItem);
