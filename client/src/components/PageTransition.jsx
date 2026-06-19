import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function PageTransition({ children }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('enter')
  const prevLocation = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname !== prevLocation.current) {
      setTransitionStage('exit')
      prevLocation.current = location.pathname
    }
  }, [location.pathname])

  useEffect(() => {
    if (transitionStage === 'exit') {
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setTransitionStage('enter')
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [transitionStage, children])

  return (
    <div className={`page-transition ${transitionStage}`}>
      {displayChildren}
    </div>
  )
}

export function FadeTransition({ children, className = '' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  return (
    <div className={`transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  )
}

export function SlideTransition({ children, direction = 'up', delay = 0, className = '' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => setIsVisible(true))
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  const directions = {
    up: isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
    down: isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8',
    left: isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
    right: isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8',
  }

  return (
    <div className={`transition-all duration-500 ease-out ${directions[direction]} ${className}`}>
      {children}
    </div>
  )
}

export function ScaleTransition({ children, delay = 0, className = '' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => setIsVisible(true))
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`transition-all duration-400 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${className}`}>
      {children}
    </div>
  )
}

export function StaggerChildren({ children, staggerDelay = 100, className = '' }) {
  const [visibleItems, setVisibleItems] = useState(0)
  const childCount = Array.isArray(children) ? children.length : 1

  useEffect(() => {
    const timers = []
    for (let i = 0; i < childCount; i++) {
      timers.push(setTimeout(() => setVisibleItems(i + 1), i * staggerDelay))
    }
    return () => timers.forEach(clearTimeout)
  }, [childCount, staggerDelay])

  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div key={i} className={`transition-all duration-500 ease-out ${i < visibleItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {child}
            </div>
          ))
        : children}
    </div>
  )
}
