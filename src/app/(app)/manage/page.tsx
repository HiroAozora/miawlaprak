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
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import TambahPraktikumForm from "@/components/TambahPraktikumForm";
import PraktikumItem from "@/components/PraktikumItem";

export default function ManagePraktikumPage() {
  const { user } = useContext(AuthContext);
  const { activeSemesterId, activeSemester, semesters } = useSemester();
  const { showSnackbar } = useSnackbar();

  const [daftarLaprak, setDaftarLaprak] = useState<Laprak[]>([]);
  const [loading, setLoading] = useState(false);

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

  // ── Subscribe to laprak in active semester ─────────────────────────────────
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
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

      <TambahPraktikumForm />

      <Divider sx={{ mb: 4 }} />
      <Typography variant="h5" gutterBottom>
        Daftar Laprak — {activeSemester?.name}
      </Typography>

      {loading && <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />}
      {!loading && (
        <Stack spacing={3}>
          {daftarLaprak.map((laprak) => (
            <PraktikumItem
              key={laprak.id}
              laprak={laprak}
              onJudulSave={handleJudulSave}
              onCheckboxChange={handleCheckboxChange}
              onTtdChange={handleTtdChange}
              onDeleteModule={(id, modId) => openDeleteConfirmation("modul", id, modId)}
              onAddModule={handleAddModule}
              onDeleteLaprak={(id) => openDeleteConfirmation("laprak", id)}
            />
          ))}
          {daftarLaprak.length === 0 && (
            <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 4 }}>
              Belum ada laprak di semester ini.
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
