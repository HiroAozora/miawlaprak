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
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ScienceIcon from "@mui/icons-material/Science";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";

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

  interface PriorityTask {
    id: string;
    laprakName: string;
    moduleName?: string;
    type: "selesai" | "accAslab" | "accLaboran" | "ttdDosen";
    label: string;
    description: string;
  }

  const priorityTasks: PriorityTask[] = [];

  daftarLaprak.forEach((lp) => {
    // 1. Check if all modules are ACC Laboran but not signed by Lecturer
    const allModulesAccLaboran = Array.isArray(lp.modules) && lp.modules.length > 0 && lp.modules.every((m) => m.accLaboran);
    if (allModulesAccLaboran && !lp.ttdKartuKuning) {
      priorityTasks.push({
        id: `${lp.id}-ttdDosen`,
        laprakName: lp.namaPraktikum,
        type: "ttdDosen",
        label: "Minta TTD Dosen",
        description: `Seluruh modul sudah lengkap. Temui Dosen ${lp.namaDosen || ""} untuk meminta TTD Kartu Kuning.`,
      });
    }

    // 2. Check modules
    if (Array.isArray(lp.modules)) {
      lp.modules.forEach((m) => {
        if (!m.selesai) {
          priorityTasks.push({
            id: `${lp.id}-${m.id}-selesai`,
            laprakName: lp.namaPraktikum,
            moduleName: m.judul,
            type: "selesai",
            label: "Kerjakan Laporan",
            description: "Modul ini belum selesai dikerjakan.",
          });
        } else if (!m.accAslab) {
          priorityTasks.push({
            id: `${lp.id}-${m.id}-accAslab`,
            laprakName: lp.namaPraktikum,
            moduleName: m.judul,
            type: "accAslab",
            label: "Minta ACC Aslab",
            description: `Laporan selesai. Temui Aslab ${lp.namaAslab || ""} untuk meminta ACC.`,
          });
        } else if (!m.accLaboran) {
          priorityTasks.push({
            id: `${lp.id}-${m.id}-accLaboran`,
            laprakName: lp.namaPraktikum,
            moduleName: m.judul,
            type: "accLaboran",
            label: "Minta ACC Laboran",
            description: `Sudah ACC Aslab. Temui Laboran ${lp.namaLaboran || ""} untuk verifikasi akhir.`,
          });
        }
      });
    }
  });

  const typePriority = {
    ttdDosen: 1,
    accLaboran: 2,
    accAslab: 3,
    selesai: 4,
  };

  priorityTasks.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
        Ringkasan Praktikum
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {activeSemester?.name}{activeSemester?.year ? ` · ${activeSemester.year}` : ""}
      </Typography>

      {/* Priority Tasks Widget */}
      {priorityTasks.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
            background: (t) => {
              const baseBg = t.palette.background.paper;
              return t.palette.mode === "dark"
                ? `linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, ${baseBg} 100%)`
                : `linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, ${baseBg} 100%)`;
            },
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrackChangesIcon sx={{ color: "error.main" }} /> Tindakan Segera & Prioritas
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tugas-tugas terdekat yang perlu diselesaikan untuk menaikkan progres
              </Typography>
            </Box>
            <Chip
              label={`${priorityTasks.length} Tertunda`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: "bold" }}
            />
          </Box>

          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {priorityTasks.slice(0, 3).map((task) => {
              let taskIcon = <span>📝</span>;
              let chipColor: "warning" | "info" | "success" | "secondary" = "warning";
              
              if (task.type === "selesai") {
                taskIcon = <HourglassEmptyIcon sx={{ color: "warning.main" }} />;
                chipColor = "warning";
              } else if (task.type === "accAslab") {
                taskIcon = <AssignmentIndIcon sx={{ color: "info.main" }} />;
                chipColor = "info";
              } else if (task.type === "accLaboran") {
                taskIcon = <ScienceIcon sx={{ color: "success.main" }} />;
                chipColor = "success";
              } else if (task.type === "ttdDosen") {
                taskIcon = <HistoryEduIcon sx={{ color: "secondary.main" }} />;
                chipColor = "secondary";
              }

              return (
                <ListItem
                  key={task.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
                    bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    gap: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: (t) => t.palette.divider,
                      bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.015)",
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        bgcolor: (t) => {
                          if (task.type === "selesai") return t.palette.mode === "dark" ? "rgba(237, 108, 2, 0.12)" : "rgba(237, 108, 2, 0.06)";
                          if (task.type === "accAslab") return t.palette.mode === "dark" ? "rgba(2, 136, 209, 0.12)" : "rgba(2, 136, 209, 0.06)";
                          if (task.type === "accLaboran") return t.palette.mode === "dark" ? "rgba(46, 125, 50, 0.12)" : "rgba(46, 125, 50, 0.06)";
                          return t.palette.mode === "dark" ? "rgba(156, 39, 176, 0.12)" : "rgba(156, 39, 176, 0.06)";
                        }
                      }}
                    >
                      {taskIcon}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" color="text.primary">
                        {task.moduleName ? `${task.moduleName} — ` : ""}
                        <Box component="span" sx={{ color: "text.secondary", fontWeight: "medium" }}>
                          {task.laprakName}
                        </Box>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {task.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={task.label}
                    color={chipColor}
                    size="small"
                    sx={{ fontWeight: "bold", fontSize: "0.75rem", px: 1 }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

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
