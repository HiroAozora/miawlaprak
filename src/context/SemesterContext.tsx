"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthContext } from "@/context/AuthContext";
import { subscribeSemesters, Semester } from "@/lib/firestoreService";

interface SemesterContextType {
  semesters: Semester[];
  activeSemesterId: string | null;
  activeSemester: Semester | null;
  setActiveSemesterId: (id: string) => void;
  loading: boolean;
}

export const SemesterContext = createContext<SemesterContextType>({
  semesters: [],
  activeSemesterId: null,
  activeSemester: null,
  setActiveSemesterId: () => {},
  loading: true,
});

export const SemesterProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemesterId, setActiveSemesterIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore active semester dari localStorage saat mount
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`activeSemester_${user.uid}`);
      if (saved) setActiveSemesterIdState(saved);
    }
  }, [user]);

  // Subscribe ke daftar semester user
  useEffect(() => {
    if (!user) {
      setSemesters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeSemesters(
      user.uid,
      (data) => {
        setSemesters(data);
        setLoading(false);

        // Jika belum ada aktiveSemester atau semester aktif sudah dihapus, pilih yang pertama
        setActiveSemesterIdState((prev) => {
          const stillExists = data.some((s) => s.id === prev);
          if (!prev || !stillExists) {
            const firstId = data[0]?.id ?? null;
            if (firstId && user) {
              localStorage.setItem(`activeSemester_${user.uid}`, firstId);
            }
            return firstId;
          }
          return prev;
        });
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  const setActiveSemesterId = (id: string) => {
    setActiveSemesterIdState(id);
    if (user) {
      localStorage.setItem(`activeSemester_${user.uid}`, id);
    }
  };

  const activeSemester = semesters.find((s) => s.id === activeSemesterId) ?? null;

  return (
    <SemesterContext.Provider
      value={{ semesters, activeSemesterId, activeSemester, setActiveSemesterId, loading }}
    >
      {children}
    </SemesterContext.Provider>
  );
};

export const useSemester = () => useContext(SemesterContext);
