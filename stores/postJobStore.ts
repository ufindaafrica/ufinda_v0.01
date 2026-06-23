import { create } from "zustand"

type Status = "idle" | "loading" | "compressing" | "uploading" | "posting" | "success" | "error"

type PostJobState = {
    status: Status
    progress: number
    errorText: string
    setStatus: (status: Status, errorText?: string) => void
    setProgress: (progress: number) => void
    reset: () => void
}

export const usePostJobStore = create<PostJobState>((set) => ({
    status: "idle",
    progress: 0,
    errorText: "",
    setStatus: (status, errorText = "") => set({ status, errorText }),
    setProgress: (progress) => set({ progress }),
    reset: () => set({ status: "idle", progress: 0, errorText: "" }),
}))
