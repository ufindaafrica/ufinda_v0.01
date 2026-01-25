import axios, { AxiosRequestConfig } from "axios"
import { BASE_URL, timeout, getAccessToken } from "./apiConstants"
import { getNewTokens } from "./refreshToken"
import { router } from "expo-router"

type RetryAxiosRequestConfig = AxiosRequestConfig & { _retry?: boolean };

// ---- Axios instance ----
export const api = axios.create({
    baseURL: BASE_URL,
    timeout,
})

// ---- Refresh mutex ----
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

// ---- Attach token to every request ----
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken()
    if (token) {
        config.headers = config.headers ?? {}
        config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
})

// ---- Response interceptor ----
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryAxiosRequestConfig

        // Only handle 401 once per request
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log("refresh api")
            originalRequest._retry = true

            // If refresh is already running, wait for it
            if (isRefreshing && refreshPromise) {
                await refreshPromise
                return api(originalRequest)
            }

            // Start refresh
            isRefreshing = true
            refreshPromise = getNewTokens()

            const refreshed = await refreshPromise
            isRefreshing = false
            refreshPromise = null

            if (!refreshed) {
                router.replace("/auth/login")
                return Promise.reject(error)
            }

            // Retry the original request.
            return api(originalRequest)
        }

        return Promise.reject(error)
    }
)
