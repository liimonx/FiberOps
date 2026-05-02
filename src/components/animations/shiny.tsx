import React, { memo, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

import styles from './shiny.module.scss'
import { useReducedMotion } from './useReducedMotion'

const useShinyAnimation = (isDegenMode: boolean, isReducedMotion: boolean) => {
    const shinyRef = useRef<HTMLDivElement>(null)
    const initTimelineRef = useRef<gsap.core.Timeline | null>(null)
    const isInitializedRef = useRef(false)
    const [pluginsLoaded, setPluginsLoaded] = useState(false)

    // Load GSAP plugins dynamically on the client side
    useEffect(() => {
        if (typeof window !== 'undefined' && !pluginsLoaded) {
            Promise.all([import('gsap/DrawSVGPlugin'), import('gsap/EasePack')])
                .then(([{ DrawSVGPlugin }, { RoughEase }]) => {
                    gsap.registerPlugin(DrawSVGPlugin, RoughEase)
                    setPluginsLoaded(true)
                })
                .catch((error) => {
                    console.error('Failed to load GSAP plugins:', error)
                    // Set as loaded anyway to prevent blocking the component
                    setPluginsLoaded(true)
                })
        }
    }, [pluginsLoaded])

    const { contextSafe } = useGSAP(
        () => {
            if (!isInitializedRef.current && shinyRef.current && pluginsLoaded && !isReducedMotion) {
                gsap.set('.js-shiny', { opacity: 0 })
                gsap.set('.js-shiny-shinBorder', { opacity: 0 })

                initTimelineRef.current = gsap
                    .timeline({
                        paused: true,
                    })
                    .fromTo(
                        '.js-shiny-shinBorder',
                        {
                            '--gradient-top-translate': '100%',
                            '--gradient-bottom-translate': '100%',
                            '--gradient-angle-top': '-37deg',
                            '--gradient-angle-bottom': '145deg',
                            duration: 1,
                        },
                        {
                            '--gradient-top-translate': '-60%',
                            '--gradient-bottom-translate': '-60%',
                            '--gradient-angle-top': '0deg',
                            '--gradient-angle-bottom': '108deg',
                            duration: 1,
                        }
                    )
                    .fromTo(
                        '.js-shiny-inner-glow',
                        {
                            x: '110%',
                            duration: 1,
                        },
                        {
                            x: 0,
                            duration: 1,
                        },
                        0
                    )
                    .fromTo(
                        '.js-shiny-main-bg',
                        {
                            opacity: 0,
                            duration: 0.2,
                        },
                        {
                            opacity: 1,
                            duration: 0.2,
                        },
                        0
                    )

                isInitializedRef.current = true
            }
        },
        { scope: shinyRef, dependencies: [pluginsLoaded, isReducedMotion] }
    )

    const animate = contextSafe(() => {
        if (!isInitializedRef.current || !initTimelineRef.current || !shinyRef.current || !pluginsLoaded) {
            return
        }

        if (isDegenMode && !isReducedMotion) {
            gsap.set('.js-shiny', { opacity: 1 })
            gsap.set('.js-shiny-shinBorder', { opacity: 1 })
            gsap.to('.js-shiny-inner-glow', { opacity: '0.5' })

            initTimelineRef.current.restart()
        } else {
            gsap.set('.js-shiny', { opacity: 0 })
            gsap.set('.js-shiny-shinBorder', { opacity: 0 })
            gsap.to('.js-shiny-inner-glow', { opacity: '0' })
            gsap.to('.js-shiny-main-bg', { opacity: '0' })
        }
    })

    useEffect(() => {
        if (isInitializedRef.current && pluginsLoaded) {
            animate()
        }
    }, [isDegenMode, animate, pluginsLoaded])

    useEffect(() => {
        return () => {
            if (initTimelineRef.current) {
                initTimelineRef.current.kill()
                initTimelineRef.current = null
            }

            isInitializedRef.current = false
        }
    }, [])

    return { shinyRef, pluginsLoaded }
}

type ShinyProps = {
    degen: boolean
}

export const Shiny = memo(({ degen }: ShinyProps) => {
    const isReducedMotion = useReducedMotion()
    const { shinyRef, pluginsLoaded } = useShinyAnimation(degen, isReducedMotion)

    // Optional: Show loading state while plugins are loading
    if (!pluginsLoaded) {
        return (
            <div className={`${styles.shiny} js-shiny`} ref={shinyRef}>
                <div className={`${styles.shinMainBg} js-shiny-main-bg`}></div>
                <div className={`${styles.shinBorder} js-shiny-shinBorder`}></div>
                <div className={`${styles.shinInnerGlowTop} js-shiny-inner-glow`}></div>
                <div className={`${styles.shinInnerGlowBottom} js-shiny-inner-glow`}></div>
            </div>
        )
    }

    return (
        <div className={`${styles.shiny} js-shiny`} ref={shinyRef}>
            <div className={`${styles.shinMainBg} js-shiny-main-bg`}></div>
            <div className={`${styles.shinBorder} js-shiny-shinBorder`}></div>
            <div className={`${styles.shinInnerGlowTop} js-shiny-inner-glow`}></div>
            <div className={`${styles.shinInnerGlowBottom} js-shiny-inner-glow`}></div>
        </div>
    )
})

Shiny.displayName = 'Shiny'
