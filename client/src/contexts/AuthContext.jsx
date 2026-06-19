import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function register(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email,
      name,
      role: 'user',
      status: 'active',
      createdAt: serverTimestamp(),
    })
    return cred
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    setUserData(null)
    return signOut(auth)
  }

  async function fetchUserData(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      setUserData(snap.data())
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await fetchUserData(user.uid)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const value = {
    user,
    userData,
    profile: userData ? { ...userData, id: userData.uid } : null,
    loading,
    register,
    login,
    logout,
    fetchUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
