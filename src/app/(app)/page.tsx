"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useSemester } from "@/context/SemesterContext";
import { subscribeLaprak, Laprak } from "@/lib/firestoreService";
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Modal,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

const calculateProgress = (laprak: any) => {
  const modules: any[] = laprak.modules || [];
  // Total item: tiap modul punya 3 check, plus 1 TTD kartu kuning
  const totalItems = modules.length * 3 + 1;
  if (totalItems <= 1) return 0;
  const modulePoints = modules.reduce((sum: number, m: any) => {
    return sum + (m.selesai ? 1 : 0) + (m.accAslab ? 1 : 0) + (m.accLaboran ? 1 : 0);
  }, 0);
  const ttdPoint = laprak.ttdKartuKuning ? 1 : 0;
  return ((modulePoints + ttdPoint) / totalItems) * 100;
};

const getStatusChip = (progress: number) => {
  if (progress === 100) return <Chip label="Selesai ✓" color="success" size="small" />;
  if (progress > 0) return <Chip label="On Progress" color="warning" size="small" />;
  return <Chip label="Belum Mulai" color="default" size="small" />;
};

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 400, md: 500 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function BerandaPage() {
  const { user } = useContext(AuthContext);
  const { activeSemesterId, activeSemester } = useSemester();
  const [daftarLaprak, setDaftarLaprak] = useState<Laprak[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLaprak, setSelectedLaprak] = useState<Laprak | null>(null);

  useEffect(() => {
    if (!user || !activeSemesterId) {
      setDaftarLaprak([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeLaprak(
      user.uid,
      activeSemesterId,
      (data) => { setDaftarLaprak(data); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [user, activeSemesterId]);

  if (!activeSemesterId) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Ringkasan Praktikum</Typography>
        <Alert severity="info">Belum ada semester aktif. Buat semester di panel kiri terlebih dahulu.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
        Ringkasan Praktikum
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {activeSemester?.name}{activeSemester?.year ? ` · ${activeSemester.year}` : ""}
      </Typography>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }}
        gap={{ xs: 2, md: 3 }}
      >
        {daftarLaprak.map((laprak) => {
          const progress = calculateProgress(laprak);
          return (
            <Paper
              key={laprak.id}
              elevation={3}
              onClick={() => setSelectedLaprak(laprak)}
              sx={{
                p: 3,
                cursor: "pointer",
                "&:hover": { boxShadow: 8, transform: "translateY(-2px)" },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Typography variant="h6" noWrap fontWeight="medium">
                {laprak.namaPraktikum}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Aslab: {laprak.namaAslab || "-"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", my: 1.5 }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ minWidth: 38 }}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
              {getStatusChip(progress)}
            </Paper>
          );
        })}
        {daftarLaprak.length === 0 && (
          <Typography sx={{ textAlign: "center", color: "text.secondary", gridColumn: "1 / -1", mt: 4 }}>
            Belum ada data praktikum di semester ini. Tambahkan di halaman Manage!
          </Typography>
        )}
      </Box>

      {/* Modal detail */}
      <Modal open={!!selectedLaprak} onClose={() => setSelectedLaprak(null)}>
        <Box sx={modalStyle}>
          {selectedLaprak && (
            <>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                {selectedLaprak.namaPraktikum}
              </Typography>
              <Typography variant="body2">Aslab: <b>{selectedLaprak.namaAslab || "-"}</b></Typography>
              <Typography variant="body2">Laboran: <b>{selectedLaprak.namaLaboran || "-"}</b></Typography>
              <Typography variant="body2" gutterBottom>
                Dosen: <b>{selectedLaprak.namaDosen || "-"}</b>
              </Typography>

              <Typography variant="h6" sx={{ mt: 2, mb: 0.5 }}>Detail Modul:</Typography>
              <List dense sx={{ maxHeight: 200, overflow: "auto", mb: 1 }}>
                {Array.isArray(selectedLaprak.modules) &&
                  selectedLaprak.modules.map((mod) => (
                    <ListItem key={mod.id}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        {mod.selesai && mod.accAslab && mod.accLaboran
                          ? <CheckCircleIcon color="success" fontSize="small" />
                          : <RadioButtonUncheckedIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={mod.judul}
                        secondary={`Selesai: ${mod.selesai ? "✓" : "✗"} | ACC Aslab: ${mod.accAslab ? "✓" : "✗"} | ACC Laboran: ${mod.accLaboran ? "✓" : "✗"}`}
                      />
                    </ListItem>
                  ))}
              </List>

              {/* Baris TTD Kartu Kuning */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: selectedLaprak.ttdKartuKuning
                    ? "warning.light"
                    : "action.hover",
                }}
              >
                {selectedLaprak.ttdKartuKuning
                  ? <CheckCircleIcon color="warning" fontSize="small" />
                  : <RadioButtonUncheckedIcon fontSize="small" />}
                <Typography variant="body2" fontWeight="medium">
                  TTD Kartu Kuning (Dosen)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                  {selectedLaprak.ttdKartuKuning ? "Sudah ✓" : "Belum"}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
