import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Semester {
  id: string;
  name: string;       // e.g. "Semester 1"
  year: string;       // e.g. "2024/2025"
  createdAt: Timestamp | null;
}

export interface Module {
  id: number;
  judul: string;
  selesai: boolean;
  accAslab: boolean;
  accLaboran: boolean;
}

export interface Laprak {
  id: string;
  namaPraktikum: string;
  namaAslab: string;
  namaLaboran: string;
  namaDosen: string;       // BARU — dosen pengampu
  ttdKartuKuning: boolean; // BARU — TTD kartu kuning dari dosen
  modules: Module[];
}

// ─── Path Helpers ─────────────────────────────────────────────────────────────

export const semestersPath = (userId: string) =>
  collection(db, "users", userId, "semesters");

export const laprakPath = (userId: string, semesterId: string) =>
  collection(db, "users", userId, "semesters", semesterId, "laprak");

// ─── Semester CRUD ────────────────────────────────────────────────────────────

/** Listen to user's semester list in real-time */
export function subscribeSemesters(
  userId: string,
  callback: (semesters: Semester[]) => void,
  onError?: (e: Error) => void
) {
  const q = query(semestersPath(userId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const data: Semester[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Semester, "id">),
      }));
      callback(data);
    },
    onError
  );
}

/** Add a new semester */
export async function addSemester(
  userId: string,
  name: string,
  year: string
): Promise<string> {
  const docRef = await addDoc(semestersPath(userId), {
    name,
    year,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Delete a semester AND all its laprak subcollection docs */
export async function deleteSemester(
  userId: string,
  semesterId: string
): Promise<void> {
  // First delete all laprak in the semester
  const laprakSnap = await getDocs(laprakPath(userId, semesterId));
  const batch = writeBatch(db);
  laprakSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  // Then delete the semester doc
  await deleteDoc(doc(db, "users", userId, "semesters", semesterId));
}

// ─── Laprak CRUD (per semester) ───────────────────────────────────────────────

/** Listen to laprak list in a semester in real-time */
export function subscribeLaprak(
  userId: string,
  semesterId: string,
  callback: (laprak: Laprak[]) => void,
  onError?: (e: Error) => void
) {
  const q = query(laprakPath(userId, semesterId), orderBy("namaPraktikum", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const data: Laprak[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Laprak, "id">),
      }));
      callback(data);
    },
    onError
  );
}

/** Add a new laprak to a semester */
export async function addLaprak(
  userId: string,
  semesterId: string,
  data: Omit<Laprak, "id">
): Promise<string> {
  const docRef = await addDoc(laprakPath(userId, semesterId), data);
  return docRef.id;
}

/** Update a laprak document (partial) */
export async function updateLaprak(
  userId: string,
  semesterId: string,
  laprakId: string,
  data: Partial<Omit<Laprak, "id">>
): Promise<void> {
  const ref = doc(db, "users", userId, "semesters", semesterId, "laprak", laprakId);
  await updateDoc(ref, data);
}

/** Delete a laprak */
export async function deleteLaprak(
  userId: string,
  semesterId: string,
  laprakId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "users", userId, "semesters", semesterId, "laprak", laprakId)
  );
}

// ─── Migration Helper: read old flat laprak collection ────────────────────────

import { collection as col, query as q2, where, getDocs as gd } from "firebase/firestore";

/** Fetch data lama dari root collection /laprak (milik userId) */
export async function getOldLaprak(userId: string): Promise<Laprak[]> {
  const oldQ = q2(col(db, "laprak"), where("userId", "==", userId));
  const snap = await gd(oldQ);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Laprak, "id">) }));
}

/** Pindahkan satu laprak lama ke semester tertentu, lalu hapus yang lama */
export async function migrateOldLaprak(
  userId: string,
  semesterId: string,
  oldLaprak: Laprak
): Promise<void> {
  const { id, ...data } = oldLaprak;
  await addDoc(laprakPath(userId, semesterId), data);
  await deleteDoc(doc(db, "laprak", id));
}
