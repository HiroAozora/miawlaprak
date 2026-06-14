"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useSemester } from "@/context/SemesterContext";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  subscribeLaprak,
  addLaprak,
  updateLaprak,
  deleteLaprak as deleteLaprakService,
  getOldLaprak,
  migrateOldLaprak,
  Laprak,
} from "@/lib/firestoreService";
import {
  Box,
  Button,
  Typography,
  Divider,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Paper,
  Chip,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import AddIcon from "@mui/icons-material/Add";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ScienceIcon from "@mui/icons-material/Science";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import TambahPraktikumForm from "@/components/TambahPraktikumForm";
import PraktikumItem from "@/components/PraktikumItem";

export default function ManagePraktikumPage() {
  const { user } = useContext(AuthContext);
  const { activeSemesterId, activeSemester, semesters } = useSemester();
  const { showSnackbar } = useSnackbar();

  const [daftarLaprak, setDaftarLaprak] = useState<Laprak[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "belumSelesai" | "belumAccAslab" | "belumAccLaboran" | "belumTtdDosen">("all");

  // Delete dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "laprak" | "modul";
    laprakId: string;
    moduleId: number | null;
  } | null>(null);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");

  // Import old data
  const [showImport, setShowImport] = useState(false);
  const [oldLaprak, setOldLaprak] = useState<Laprak[]>([]);
  const [selectedOld, setSelectedOld] = useState<Set<string>>(new Set());
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    setActiveFilter("all");
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
      () => { showSnackbar("Gagal mengambil data.", "error"); setLoading(false); }
    );
    return unsub;
  }, [user, activeSemesterId]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleJudulSave = useCallback(
    async (laprakId: string, moduleId: number, newJudul: string) => {
      if (!user || !activeSemesterId) return;
      const laprak = daftarLaprak.find((l) => l.id === laprakId);
      if (!laprak) return;
      const newModules = laprak.modules.map((m) =>
        m.id === moduleId ? { ...m, judul: newJudul } : m
      );
      await updateLaprak(user.uid, activeSemesterId, laprakId, { modules: newModules });
    },
    [user, activeSemesterId, daftarLaprak]
  );

  const handleCheckboxChange = useCallback(
    async (laprakId: string, moduleId: number, field: string) => {
      if (!user || !activeSemesterId) return;
      const laprak = daftarLaprak.find((l) => l.id === laprakId);
      if (!laprak) return;
      const newModules = laprak.modules.map((m) =>
        m.id === moduleId ? { ...m, [field]: !m[field as keyof typeof m] } : m
      );
      await updateLaprak(user.uid, activeSemesterId, laprakId, { modules: newModules });
    },
    [user, activeSemesterId, daftarLaprak]
  );

  const handleTtdChange = useCallback(
    async (laprakId: string) => {
      if (!user || !activeSemesterId) return;
      const laprak = daftarLaprak.find((l) => l.id === laprakId);
      if (!laprak) return;
      await updateLaprak(user.uid, activeSemesterId, laprakId, {
        ttdKartuKuning: !laprak.ttdKartuKuning,
      });
    },
    [user, activeSemesterId, daftarLaprak]
  );

  const openDeleteConfirmation = useCallback(
    (type: "laprak" | "modul", laprakId: string, moduleId: number | null = null) => {
      setItemToDelete({ type, laprakId, moduleId });
      if (type === "laprak") {
        const lp = daftarLaprak.find((l) => l.id === laprakId);
        setConfirmDialogTitle("Hapus Praktikum?");
        setConfirmDialogMessage(`Yakin hapus "${lp?.namaPraktikum}"?`);
      } else {
        const lp = daftarLaprak.find((l) => l.id === laprakId);
        const mod = lp?.modules.find((m) => m.id === moduleId);
        setConfirmDialogTitle("Hapus Modul?");
        setConfirmDialogMessage(`Yakin hapus modul "${mod?.judul}"?`);
      }
      setConfirmDialogOpen(true);
    },
    [daftarLaprak]
  );

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setTimeout(() => setItemToDelete(null), 150);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!user || !activeSemesterId || !itemToDelete) return;
    const { type, laprakId, moduleId } = itemToDelete;
    try {
      if (type === "laprak") {
        await deleteLaprakService(user.uid, activeSemesterId, laprakId);
        showSnackbar("Praktikum dihapus.", "info");
      } else {
        const lp = daftarLaprak.find((l) => l.id === laprakId);
        if (!lp) return;
        const newModules = lp.modules.filter((m) => m.id !== moduleId);
        await updateLaprak(user.uid, activeSemesterId, laprakId, { modules: newModules });
        showSnackbar("Modul dihapus.", "info");
      }
    } catch (e: any) {
      showSnackbar("Gagal menghapus: " + e.message, "error");
    } finally {
      handleCloseConfirmDialog();
    }
  }, [user, activeSemesterId, itemToDelete, daftarLaprak, showSnackbar]);

  const handleAddModule = useCallback(
    async (laprakId: string) => {
      if (!user || !activeSemesterId) return;
      const lp = daftarLaprak.find((l) => l.id === laprakId);
      if (!lp) return;
      const newModule = {
        id: Date.now(),
        judul: `Modul Baru ${lp.modules.length + 1}`,
        selesai: false,
        accAslab: false,
        accLaboran: false,
      };
      await updateLaprak(user.uid, activeSemesterId, laprakId, {
        modules: [...lp.modules, newModule],
      });
    },
    [user, activeSemesterId, daftarLaprak]
  );

  // ── Import Data Lama ──────────────────────────────────────────────────────
  const handleOpenImport = async () => {
    if (!user) return;
    setImportLoading(true);
    try {
      const data = await getOldLaprak(user.uid);
      setOldLaprak(data);
      setSelectedOld(new Set());
      setShowImport(true);
    } catch (e: any) {
      showSnackbar("Gagal membaca data lama: " + e.message, "error");
    } finally {
      setImportLoading(false);
    }
  };

  const toggleSelectOld = (id: string) => {
    setSelectedOld((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImportSelected = async () => {
    if (!user || !activeSemesterId || selectedOld.size === 0) return;
    setImportLoading(true);
    try {
      for (const id of Array.from(selectedOld)) {
        const lp = oldLaprak.find((l) => l.id === id);
        if (lp) await migrateOldLaprak(user.uid, activeSemesterId, lp);
      }
      showSnackbar(`${selectedOld.size} laprak berhasil diimpor!`, "success");
      setShowImport(false);
    } catch (e: any) {
      showSnackbar("Gagal migrasi: " + e.message, "error");
    } finally {
      setImportLoading(false);
    }
  };

  // Stats
  const totalBelumSelesai = daftarLaprak.reduce(
    (acc, lp) => acc + (Array.isArray(lp.modules) ? lp.modules.filter((m) => !m.selesai).length : 0),
    0
  );
  const totalBelumAccAslab = daftarLaprak.reduce(
    (acc, lp) => acc + (Array.isArray(lp.modules) ? lp.modules.filter((m) => !m.accAslab).length : 0),
    0
  );
  const totalBelumAccLaboran = daftarLaprak.reduce(
    (acc, lp) => acc + (Array.isArray(lp.modules) ? lp.modules.filter((m) => !m.accLaboran).length : 0),
    0
  );
  const totalBelumTtdDosen = daftarLaprak.filter((lp) => !lp.ttdKartuKuning).length;
  const totalModul = daftarLaprak.reduce(
    (acc, lp) => acc + (Array.isArray(lp.modules) ? lp.modules.length : 0),
    0
  );
  const totalLaprak = daftarLaprak.length;

  // Filtered List
  const filteredLaprak = daftarLaprak.filter((lp) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "belumSelesai") {
      return Array.isArray(lp.modules) && lp.modules.some((m) => !m.selesai);
    }
    if (activeFilter === "belumAccAslab") {
      return Array.isArray(lp.modules) && lp.modules.some((m) => !m.accAslab);
    }
    if (activeFilter === "belumAccLaboran") {
      return Array.isArray(lp.modules) && lp.modules.some((m) => !m.accLaboran);
    }
    if (activeFilter === "belumTtdDosen") {
      return !lp.ttdKartuKuning;
    }
    return true;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!activeSemesterId) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Manage Praktikum</Typography>
        <Alert severity="info">
          Belum ada semester. Silakan buat semester terlebih dahulu di panel kiri.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h4">
          Manage Praktikum
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={importLoading ? <CircularProgress size={16} /> : <UploadIcon />}
          onClick={handleOpenImport}
          disabled={importLoading}
        >
          Impor Data Lama
        </Button>
      </Box>

      {/* Dashboard Stats & Action Grid */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(5, 1fr)",
        }}
        gap={2}
        sx={{ mb: 4 }}
      >
        {/* Card 1: Action (Tambah Praktikum) */}
        <Paper
          elevation={0}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "primary.main",
            background: (t) => {
              const baseBg = t.palette.background.paper;
              return t.palette.mode === "dark"
                ? `linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, ${baseBg} 100%)`
                : `linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, ${baseBg} 100%)`;
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            height: "100%",
            minHeight: "110px",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "primary.dark",
              background: (t) => {
                const baseBg = t.palette.background.paper;
                return t.palette.mode === "dark"
                  ? `linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, ${baseBg} 100%)`
                  : `linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, ${baseBg} 100%)`;
              },
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.08)",
            },
          }}
        >
          <AddIcon color="primary" sx={{ fontSize: 28, mb: 0.5 }} />
          <Typography variant="body2" fontWeight="bold" color="primary" align="center">
            Tambah Praktikum
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center">
            Buat praktikum baru
          </Typography>
        </Paper>

        {/* Card 2: Belum Selesai */}
        <Paper
          elevation={0}
          onClick={() => setActiveFilter((prev) => prev === "belumSelesai" ? "all" : "belumSelesai")}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: (t) => {
              const isActive = activeFilter === "belumSelesai";
              if (isActive) return "warning.main";
              return t.palette.mode === "dark" ? "rgba(237, 108, 2, 0.25)" : "rgba(237, 108, 2, 0.15)";
            },
            background: (t) => {
              const baseBg = t.palette.background.paper;
              const isActive = activeFilter === "belumSelesai";
              return t.palette.mode === "dark"
                ? `linear-gradient(135deg, rgba(237, 108, 2, ${isActive ? 0.22 : 0.12}) 0%, ${baseBg} 100%)`
                : `linear-gradient(135deg, rgba(237, 108, 2, ${isActive ? 0.12 : 0.05}) 0%, ${baseBg} 100%)`;
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            minHeight: "110px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: activeFilter === "belumSelesai" ? "0 4px 12px rgba(237, 108, 2, 0.15)" : "none",
            "&:hover": {
              borderColor: "warning.main",
              background: (t) => {
                const baseBg = t.palette.background.paper;
                return t.palette.mode === "dark"
                  ? `linear-gradient(135deg, rgba(237, 108, 2, 0.2) 0%, ${baseBg} 100%)`
                  : `linear-gradient(135deg, rgba(237, 108, 2, 0.1) 0%, ${baseBg} 100%)`;
              },
              boxShadow: "0 6px 16px rgba(237, 108, 2, 0.16)",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "warning.main", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.6875rem" }}>
                Belum Selesai
              </Typography>
            </Box>
            <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 18 }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              {totalBelumSelesai === 0 && totalModul > 0 ? (
                <Typography variant="h4" fontWeight="bold" sx={{ color: "warning.main", lineHeight: 1, fontSize: "2rem" }}>
                  Aman ✓
                </Typography>
              ) : (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: "warning.main", lineHeight: 1, fontSize: "2.5rem" }}>
                    {totalBelumSelesai}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    modul
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.725rem", opacity: 0.7 }}>
              dari {totalModul} total
            </Typography>
          </Box>
        </Paper>

        {/* Card 3: Belum ACC Aslab */}
        <Paper
          elevation={0}
          onClick={() => setActiveFilter((prev) => prev === "belumAccAslab" ? "all" : "belumAccAslab")}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: (t) => {
              const isActive = activeFilter === "belumAccAslab";
              if (isActive) return "info.main";
              return t.palette.mode === "dark" ? "rgba(2, 136, 209, 0.25)" : "rgba(2, 136, 209, 0.15)";
            },
            background: (t) => {
              const baseBg = t.palette.background.paper;
              const isActive = activeFilter === "belumAccAslab";
              return t.palette.mode === "dark"
                ? `linear-gradient(135deg, rgba(2, 136, 209, ${isActive ? 0.22 : 0.12}) 0%, ${baseBg} 100%)`
                : `linear-gradient(135deg, rgba(2, 136, 209, ${isActive ? 0.12 : 0.05}) 0%, ${baseBg} 100%)`;
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            minHeight: "110px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: activeFilter === "belumAccAslab" ? "0 4px 12px rgba(2, 136, 209, 0.15)" : "none",
            "&:hover": {
              borderColor: "info.main",
              background: (t) => {
                const baseBg = t.palette.background.paper;
                return t.palette.mode === "dark"
                  ? `linear-gradient(135deg, rgba(2, 136, 209, 0.2) 0%, ${baseBg} 100%)`
                  : `linear-gradient(135deg, rgba(2, 136, 209, 0.1) 0%, ${baseBg} 100%)`;
              },
              boxShadow: "0 6px 16px rgba(2, 136, 209, 0.16)",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "info.main", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.6875rem" }}>
                Belum ACC Aslab
              </Typography>
            </Box>
            <AssignmentIndIcon sx={{ color: "info.main", fontSize: 18 }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              {totalBelumAccAslab === 0 && totalModul > 0 ? (
                <Typography variant="h4" fontWeight="bold" sx={{ color: "info.main", lineHeight: 1, fontSize: "2rem" }}>
                  Aman ✓
                </Typography>
              ) : (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: "info.main", lineHeight: 1, fontSize: "2.5rem" }}>
                    {totalBelumAccAslab}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    modul
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.725rem", opacity: 0.7 }}>
              dari {totalModul} total
            </Typography>
          </Box>
        </Paper>

        {/* Card 4: Belum ACC Laboran */}
        <Paper
          elevation={0}
          onClick={() => setActiveFilter((prev) => prev === "belumAccLaboran" ? "all" : "belumAccLaboran")}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: (t) => {
              const isActive = activeFilter === "belumAccLaboran";
              if (isActive) return "success.main";
              return t.palette.mode === "dark" ? "rgba(46, 125, 50, 0.25)" : "rgba(46, 125, 50, 0.15)";
            },
            background: (t) => {
              const baseBg = t.palette.background.paper;
              const isActive = activeFilter === "belumAccLaboran";
              return t.palette.mode === "dark"
                ? `linear-gradient(135deg, rgba(46, 125, 50, ${isActive ? 0.22 : 0.12}) 0%, ${baseBg} 100%)`
                : `linear-gradient(135deg, rgba(46, 125, 50, ${isActive ? 0.12 : 0.05}) 0%, ${baseBg} 100%)`;
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            minHeight: "110px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: activeFilter === "belumAccLaboran" ? "0 4px 12px rgba(46, 125, 50, 0.15)" : "none",
            "&:hover": {
              borderColor: "success.main",
              background: (t) => {
                const baseBg = t.palette.background.paper;
                return t.palette.mode === "dark"
                  ? `linear-gradient(135deg, rgba(46, 125, 50, 0.2) 0%, ${baseBg} 100%)`
                  : `linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, ${baseBg} 100%)`;
              },
              boxShadow: "0 6px 16px rgba(46, 125, 50, 0.16)",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.6875rem" }}>
                Belum ACC Laboran
              </Typography>
            </Box>
            <ScienceIcon sx={{ color: "success.main", fontSize: 18 }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              {totalBelumAccLaboran === 0 && totalModul > 0 ? (
                <Typography variant="h4" fontWeight="bold" sx={{ color: "success.main", lineHeight: 1, fontSize: "2rem" }}>
                  Aman ✓
                </Typography>
              ) : (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: "success.main", lineHeight: 1, fontSize: "2.5rem" }}>
                    {totalBelumAccLaboran}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    modul
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.725rem", opacity: 0.7 }}>
              dari {totalModul} total
            </Typography>
          </Box>
        </Paper>

        {/* Card 5: Belum TTD Dosen */}
        <Paper
          elevation={0}
          onClick={() => setActiveFilter((prev) => prev === "belumTtdDosen" ? "all" : "belumTtdDosen")}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: (t) => {
              const isActive = activeFilter === "belumTtdDosen";
              if (isActive) return "secondary.main";
              return t.palette.mode === "dark" ? "rgba(156, 39, 176, 0.25)" : "rgba(156, 39, 176, 0.15)";
            },
            background: (t) => {
              const baseBg = t.palette.background.paper;
              const isActive = activeFilter === "belumTtdDosen";
              return t.palette.mode === "dark"
                ? `linear-gradient(135deg, rgba(156, 39, 176, ${isActive ? 0.22 : 0.12}) 0%, ${baseBg} 100%)`
                : `linear-gradient(135deg, rgba(156, 39, 176, ${isActive ? 0.12 : 0.05}) 0%, ${baseBg} 100%)`;
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            minHeight: "110px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: activeFilter === "belumTtdDosen" ? "0 4px 12px rgba(156, 39, 176, 0.15)" : "none",
            "&:hover": {
              borderColor: "secondary.main",
              background: (t) => {
                const baseBg = t.palette.background.paper;
                return t.palette.mode === "dark"
                  ? `linear-gradient(135deg, rgba(156, 39, 176, 0.2) 0%, ${baseBg} 100%)`
                  : `linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, ${baseBg} 100%)`;
              },
              boxShadow: "0 6px 16px rgba(156, 39, 176, 0.16)",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.6875rem" }}>
                Belum TTD Dosen
              </Typography>
            </Box>
            <HistoryEduIcon sx={{ color: "secondary.main", fontSize: 18 }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              {totalBelumTtdDosen === 0 && totalLaprak > 0 ? (
                <Typography variant="h4" fontWeight="bold" sx={{ color: "secondary.main", lineHeight: 1, fontSize: "2rem" }}>
                  Aman ✓
                </Typography>
              ) : (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: "secondary.main", lineHeight: 1, fontSize: "2.5rem" }}>
                    {totalBelumTtdDosen}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    laprak
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.725rem", opacity: 0.7 }}>
              dari {totalLaprak} total
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <TambahPraktikumForm onClose={() => setOpenAddDialog(false)} />
      </Dialog>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">
          Daftar Laprak — {activeSemester?.name}
        </Typography>
        {activeFilter !== "all" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Filter aktif:
            </Typography>
            <Chip
              label={
                activeFilter === "belumSelesai" ? "Belum Selesai" :
                activeFilter === "belumAccAslab" ? "Belum ACC Aslab" :
                activeFilter === "belumAccLaboran" ? "Belum ACC Laboran" :
                "Belum TTD Dosen"
              }
              color={
                activeFilter === "belumSelesai" ? "warning" :
                activeFilter === "belumAccAslab" ? "info" :
                activeFilter === "belumAccLaboran" ? "success" :
                "secondary"
              }
              size="small"
              onDelete={() => setActiveFilter("all")}
            />
          </Box>
        )}
      </Box>

      {loading && <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />}
      {!loading && (
        <Stack spacing={3}>
          {filteredLaprak.map((laprak) => {
            // Filter modules inside each card to match the active filter
            let displayModules = laprak.modules || [];
            if (activeFilter === "belumSelesai") {
              displayModules = displayModules.filter((m) => !m.selesai);
            } else if (activeFilter === "belumAccAslab") {
              displayModules = displayModules.filter((m) => !m.accAslab);
            } else if (activeFilter === "belumAccLaboran") {
              displayModules = displayModules.filter((m) => !m.accLaboran);
            }

            const displayLaprak = {
              ...laprak,
              modules: displayModules,
            };

            return (
              <PraktikumItem
                key={laprak.id}
                laprak={displayLaprak}
                onJudulSave={handleJudulSave}
                onCheckboxChange={handleCheckboxChange}
                onTtdChange={handleTtdChange}
                onDeleteModule={(id, modId) => openDeleteConfirmation("modul", id, modId)}
                onAddModule={handleAddModule}
                onDeleteLaprak={(id) => openDeleteConfirmation("laprak", id)}
              />
            );
          })}
          {filteredLaprak.length === 0 && (
            <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 4 }}>
              {activeFilter === "all" ? "Belum ada laprak di semester ini." : "Tidak ada praktikum yang sesuai dengan filter ini."}
            </Typography>
          )}
        </Stack>
      )}

      {/* Dialog hapus */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>{confirmDialogTitle}</DialogTitle>
        <DialogContent><DialogContentText>{confirmDialogMessage}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Tidak</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>Ya, Hapus</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog impor data lama */}
      <Dialog open={showImport} onClose={() => setShowImport(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Impor Data Lama ke {activeSemester?.name}</DialogTitle>
        <DialogContent>
          {oldLaprak.length === 0 ? (
            <Typography color="text.secondary">Tidak ada data lama yang bisa diimpor.</Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pilih laprak dari data lama yang ingin dipindahkan ke semester ini:
              </Typography>
              <List dense>
                {oldLaprak.map((lp) => (
                  <ListItem
                    key={lp.id}
                    disablePadding
                    secondaryAction={
                      <Checkbox
                        edge="end"
                        checked={selectedOld.has(lp.id)}
                        onChange={() => toggleSelectOld(lp.id)}
                      />
                    }
                  >
                    <ListItemText
                      primary={lp.namaPraktikum}
                      secondary={`Aslab: ${lp.namaAslab || "-"} | ${lp.modules?.length ?? 0} modul`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImport(false)}>Tutup</Button>
          {oldLaprak.length > 0 && (
            <Button
              variant="contained"
              onClick={handleImportSelected}
              disabled={selectedOld.size === 0 || importLoading}
              startIcon={importLoading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            >
              Impor {selectedOld.size > 0 ? `(${selectedOld.size})` : ""}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
