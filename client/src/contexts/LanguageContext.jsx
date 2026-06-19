import { createContext, useContext, useState, useEffect } from 'react'
import translations from '../services/translations'

const LanguageContext = createContext()

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('payswit-lang') || 'id'
  })

  useEffect(() => {
    localStorage.setItem('payswit-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  function t(key) {
    return translations[lang]?.[key] || translations['id']?.[key] || key
  }

  function toggleLanguage() {
    setLang(lang === 'id' ? 'en' : 'id')
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}
