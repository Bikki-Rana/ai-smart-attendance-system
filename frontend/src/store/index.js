import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { access_token, role, user_id, name } = res.data
        localStorage.setItem('sa_token', access_token)
        set({
          token: access_token,
          user: { id: user_id, name, role, email },
          isAuthenticated: true,
        })
        return res.data
      },

      register: async (payload) => {
        const res = await api.post('/auth/register', payload)
        const { access_token, role, user_id, name } = res.data
        localStorage.setItem('sa_token', access_token)
        set({
          token: access_token,
          user: { 
            id: user_id, 
            name, 
            role, 
            email: payload.email,
            student_id: payload.student_id,
            department: payload.department,
            semester: payload.semester,
            section: payload.section,
          },
          isAuthenticated: true,
        })
        return res.data
      },

      logout: () => {
        localStorage.removeItem('sa_token')
        localStorage.removeItem('sa_user')
        set({ token: null, user: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        try {
          const res = await api.get('/auth/me')
          set((state) => ({ user: { ...state.user, ...res.data } }))
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'sa_user',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export const useAttendanceStore = create((set) => ({
  records: [],
  stats: null,
  loading: false,

  fetchRecords: async (params = {}) => {
    set({ loading: true })
    try {
      const res = await api.get('/attendance/', { params })
      set({ records: res.data })
    } finally {
      set({ loading: false })
    }
  },

  fetchStats: async (studentId) => {
    const res = await api.get(`/attendance/stats/student/${studentId}`)
    set({ stats: res.data })
    return res.data
  },
}))
