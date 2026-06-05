import React, { memo, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from './useReducedMotion'
import styles from './voltage.module.scss'
import { createLogger } from '@/lib/logger'

const log = createLogger('Voltage')

export interface VoltageRef {
    play: () => void
    reverse: () => void
    pause: () => void
    restart: () => void
    isActive: () => boolean
}

interface VoltageProps {
    className?: string
    isActive?: boolean
    isPlay?: boolean
    autoplay?: boolean
    loop?: boolean
    width?: number | string
    height?: number | string
    duration?: number
    delay?: number
    onComplete?: () => void
    onStart?: () => void
    onPause?: () => void
    onReverse?: () => void
    /** Custom animation speed multiplier (1 = normal, 2 = 2x speed, 0.5 = half speed) */
    speed?: number
    /** Intensity of the voltage effect (1-10) */
    intensity?: number
    /** Color theme for the voltage effect */
    colorTheme?: 'default' | 'blue' | 'red' | 'green' | 'purple'
    /** Custom color overrides (takes precedence over colorTheme) */
    colors?: {
        primary?: string
        secondary?: string
        accent?: string
    }
    showGlow?: boolean
    strokeWidth?: number
    playType?: 'restart' | 'play' | 'reverse'
}

const Voltage = memo(
    forwardRef<VoltageRef, VoltageProps>(
        (
            {
                className = '',
                isActive = false,
                isPlay,
                autoplay = false,
                loop = false,
                width = '100px',
                height = '50px',
                duration = 1,
                delay = 0,
                onComplete,
                onStart,
                onPause,
                onReverse,
                speed = 1,
                intensity = 5,
                colorTheme = 'default',
                colors: customColors,
                showGlow = true,
                strokeWidth = 1.5,
                playType = 'play',
            },
            ref
        ) => {
            const voltageRef = useRef<HTMLDivElement>(null)
            const timelineRef = useRef<gsap.core.Timeline | null>(null)
            const isInitializedRef = useRef(false)
            const isPlayingRef = useRef(false)
            const [pluginsLoaded, setPluginsLoaded] = useState(false)
            const isReducedMotion = useReducedMotion()

            // Load GSAP plugins dynamically on the client side
            useEffect(() => {
                if (typeof window !== 'undefined' && !pluginsLoaded) {
                    Promise.all([import('gsap/DrawSVGPlugin'), import('gsap/EasePack')])
                        .then(([{ DrawSVGPlugin }, { RoughEase }]) => {
                            gsap.registerPlugin(DrawSVGPlugin, RoughEase)
                            setPluginsLoaded(true)
                        })
                        .catch((error) => {
                            log.error('Failed to load GSAP plugins:', error)
                            // Set as loaded anyway to prevent blocking the component
                            setPluginsLoaded(true)
                        })
                }
            }, [pluginsLoaded])

            // Determine if animation should play (priority: isPlay > isActive > autoplay)
            const shouldPlay = isPlay !== undefined ? isPlay : isActive || autoplay

            const scaleMultiplier = Math.max(1, intensity / 5)
            const turbulenceFrequency = 0.1 + intensity * 0.02

            const colorThemes = {
                default: {
                    primary: '#FFFAF3',
                    secondary: '#FFF200',
                    accent: '#01E1E0',
                },
                blue: {
                    primary: '#E3F2FD',
                    secondary: '#2196F3',
                    accent: '#00BCD4',
                },
                red: {
                    primary: '#FFEBEE',
                    secondary: '#F44336',
                    accent: '#FF5722',
                },
                green: {
                    primary: '#E8F5E8',
                    secondary: '#4CAF50',
                    accent: '#8BC34A',
                },
                purple: {
                    primary: '#F3E5F5',
                    secondary: '#9C27B0',
                    accent: '#673AB7',
                },
            }

            const baseTheme = colorThemes[colorTheme]
            const currentTheme = {
                primary: customColors?.primary ?? baseTheme.primary,
                secondary: customColors?.secondary ?? baseTheme.secondary,
                accent: customColors?.accent ?? baseTheme.accent,
            }

            const { contextSafe } = useGSAP(
                () => {
                    if (!isInitializedRef.current && pluginsLoaded && !isReducedMotion) {
                        try {
                            const strikes = gsap.utils.toArray('.strike') as HTMLElement[]

                            timelineRef.current = gsap
                                .timeline({
                                    paused: true,
                                    repeat: loop ? -1 : 0,
                                    delay: delay,
                                    yoyo: true,
                                    repeatRefresh: true,
                                    repeatDelay: 0,
                                    onStart: () => {
                                        isPlayingRef.current = true
                                        onStart?.()
                                    },
                                    onComplete: () => {
                                        isPlayingRef.current = false
                                        onComplete?.()
                                    },
                                    onPause: () => {
                                        onPause?.()
                                    },
                                    onReverseComplete: () => {
                                        isPlayingRef.current = false
                                        onReverse?.()
                                    },
                                })
                                .set('#scribbles', { opacity: 1 })
                                .set('#lightning', { opacity: 1 })
                                .to(
                                    '#filter feDisplacementMap',
                                    {
                                        attr: { scale: (10 * scaleMultiplier).toString() },
                                        ease: 'rough({strength: 3, points: 30, taper: none, randomize: true})',
                                        duration: duration,
                                    },
                                    0
                                )
                                .to(
                                    '#filter2 feDisplacementMap',
                                    {
                                        attr: { scale: (30 * scaleMultiplier).toString() },
                                        ease: 'rough({strength: 3, points: 30, taper: none, randomize: true})',
                                        duration: duration,
                                    },
                                    0
                                )
                                .to(
                                    '#filter4 feDisplacementMap',
                                    {
                                        attr: { scale: (40 * scaleMultiplier).toString() },
                                        ease: 'rough({strength: 3, points: 30, taper: none, randomize: true})',
                                        duration: duration,
                                    },
                                    0
                                )
                                .fromTo(
                                    strikes[0],
                                    { drawSVG: '100% 90%' },
                                    { drawSVG: '0% 10%', duration: duration },
                                    0
                                )
                                .fromTo(
                                    strikes[1],
                                    { drawSVG: '0% 20%' },
                                    { drawSVG: '100% 100%', duration: duration },
                                    0
                                )
                                .fromTo(
                                    strikes[2],
                                    { drawSVG: '0% 10%' },
                                    { drawSVG: '135% 140%', duration: duration },
                                    0
                                )
                                .fromTo(
                                    strikes[3],
                                    { drawSVG: '120% 140%' },
                                    { drawSVG: '35% 40%', duration: duration },
                                    0
                                )
                                .fromTo(
                                    strikes[4],
                                    { drawSVG: '20% 40%' },
                                    { drawSVG: '135% 140%', duration: duration },
                                    0
                                )

                            if (speed !== 1) {
                                timelineRef.current.timeScale(speed)
                            }

                            isInitializedRef.current = true
                        } catch (error) {
                            log.warn('Voltage animation initialization failed:', error)
                        }
                    }
                },
                {
                    scope: voltageRef,
                    dependencies: [duration, delay, loop, speed, intensity, scaleMultiplier, playType, pluginsLoaded, isReducedMotion, customColors],
                }
            )

            const play = contextSafe(() => {
                if (!timelineRef.current || !isInitializedRef.current || !pluginsLoaded || isReducedMotion) return
                timelineRef.current.play()
            })

            const reverse = contextSafe(() => {
                if (!timelineRef.current || !isInitializedRef.current || !pluginsLoaded || isReducedMotion) return
                timelineRef.current.reverse()
            })

            const pause = contextSafe(() => {
                if (!timelineRef.current || !isInitializedRef.current || !pluginsLoaded) return
                timelineRef.current.pause()
            })

            const restart = contextSafe(() => {
                if (!timelineRef.current || !isInitializedRef.current || !pluginsLoaded || isReducedMotion) return
                timelineRef.current.restart()
            })

            const isAnimationActive = useCallback(() => {
                return isPlayingRef.current
            }, [])

            // Expose methods via ref
            useImperativeHandle(
                ref,
                () => ({
                    play,
                    reverse,
                    pause,
                    restart,
                    isActive: isAnimationActive,
                }),
                [play, reverse, pause, restart, isAnimationActive]
            )

            useEffect(() => {
                if (isInitializedRef.current && pluginsLoaded && !isReducedMotion) {
                    if (shouldPlay) {
                        if (playType === 'restart') {
                            restart()
                        } else if (playType === 'play') {
                            play()
                        } else if (playType === 'reverse') {
                            reverse()
                        }
                    }
                }
            }, [shouldPlay, play, reverse, restart, playType, pluginsLoaded, isReducedMotion])

            useEffect(() => {
                return () => {
                    if (timelineRef.current) {
                        timelineRef.current.kill()
                        timelineRef.current = null
                    }
                    isInitializedRef.current = false
                }
            }, [])

            // Show basic SVG structure while plugins are loading
            if (!pluginsLoaded) {
                return (
                    <div
                        className={`${styles.voltage} ${className}`}
                        ref={voltageRef}
                        style={{
                            width: typeof width === 'number' ? `${width}px` : width,
                            height: typeof height === 'number' ? `${height}px` : height,
                        }}
                    >
                        <svg
                            id='scribbles'
                            className={styles.voltageScribbles}
                            preserveAspectRatio='none'
                            viewBox='0 0 100 50'
                            style={{
                                width: typeof width === 'number' ? `${width}px` : width,
                                height: typeof height === 'number' ? `${height}px` : height,
                                opacity: 0.3, // Show a dimmed version while loading
                            }}
                        >
                            <linearGradient gradientUnits='userSpaceOnUse' id='gradient'>
                                <stop offset='0%' stopColor={currentTheme.primary} />
                                <stop offset='10%' stopColor={currentTheme.primary} />
                                <stop offset='50%' stopColor='#fff' />
                                <stop offset='100%' stopColor={currentTheme.secondary} />
                            </linearGradient>

                            <g id='lightning' strokeWidth={strokeWidth} stroke='url(#gradient)'>
                                <rect
                                    className='strike'
                                    stroke='url(#gradient)'
                                    x='0'
                                    y='0'
                                    width='100'
                                    height='50'
                                    rx='38.59'
                                    fill='none'
                                    strokeMiterlimit='10'
                                    strokeWidth={strokeWidth}
                                />
                            </g>
                        </svg>
                    </div>
                )
            }

            return (
                <div
                    className={`${styles.voltage} ${className}`}
                    ref={voltageRef}
                    style={{
                        width: typeof width === 'number' ? `${width}px` : width,
                        height: typeof height === 'number' ? `${height}px` : height,
                    }}
                >
                    <svg
                        id='scribbles'
                        className={styles.voltageScribbles}
                        preserveAspectRatio='none'
                        viewBox='0 0 100 50'
                        style={{
                            width: typeof width === 'number' ? `${width}px` : width,
                            height: typeof height === 'number' ? `${height}px` : height,
                        }}
                    >
                        {showGlow && (
                            <filter
                                colorInterpolationFilters='sRGB'
                                id='glow'
                                x='-50'
                                y='-50'
                                width='200'
                                height='200'
                                filterUnits='userSpaceOnUse'
                            >
                                <feGaussianBlur stdDeviation={intensity} />
                                <feComponentTransfer>
                                    <feFuncA type='linear' slope='2' />
                                </feComponentTransfer>
                                <feBlend in2='SourceGraphic' />
                            </filter>
                        )}
                        <filter
                            colorInterpolationFilters='sRGB'
                            id='filter'
                            x='-50'
                            y='-50'
                            width='200'
                            height='200'
                            filterUnits='userSpaceOnUse'
                        >
                            <feTurbulence
                                type='fractalNoise'
                                baseFrequency={`${turbulenceFrequency} 0`}
                                numOctaves='1'
                                result='warp'
                            />
                            <feDisplacementMap
                                xChannelSelector='R'
                                yChannelSelector='G'
                                scale='5'
                                in='SourceGraphic'
                                in2='warp'
                            />
                        </filter>
                        <filter
                            colorInterpolationFilters='sRGB'
                            id='filter2'
                            x='-50'
                            y='-50'
                            width='200'
                            height='200'
                            filterUnits='userSpaceOnUse'
                        >
                            <feTurbulence
                                type='fractalNoise'
                                baseFrequency={`${turbulenceFrequency * 1.3} 0`}
                                numOctaves='1'
                                result='warp'
                            />
                            <feDisplacementMap
                                xChannelSelector='R'
                                yChannelSelector='G'
                                scale='10'
                                in='SourceGraphic'
                                in2='warp'
                            />
                        </filter>
                        <filter
                            colorInterpolationFilters='sRGB'
                            id='filter3'
                            x='-50'
                            y='-50'
                            width='200'
                            height='200'
                            filterUnits='userSpaceOnUse'
                        >
                            <feTurbulence
                                type='fractalNoise'
                                baseFrequency={`${turbulenceFrequency * 1.3} ${turbulenceFrequency * 1.3}`}
                                numOctaves='1'
                                result='warp'
                            />
                            <feDisplacementMap
                                xChannelSelector='R'
                                yChannelSelector='G'
                                scale='5'
                                in='SourceGraphic'
                                in2='warp'
                            />
                        </filter>
                        <filter
                            colorInterpolationFilters='sRGB'
                            id='filter4'
                            x='-50'
                            y='-50'
                            width='200'
                            height='200'
                            filterUnits='userSpaceOnUse'
                        >
                            <feTurbulence
                                type='fractalNoise'
                                baseFrequency={`${turbulenceFrequency * 1.3} ${turbulenceFrequency * 1.3}`}
                                numOctaves='1'
                                result='warp'
                            />
                            <feDisplacementMap
                                xChannelSelector='R'
                                yChannelSelector='G'
                                scale='5'
                                in='SourceGraphic'
                                in2='warp'
                            />
                        </filter>

                        <linearGradient gradientUnits='userSpaceOnUse' id='gradient'>
                            <stop offset='0%' stopColor={currentTheme.primary} />
                            <stop offset='10%' stopColor={currentTheme.primary} />
                            <stop offset='50%' stopColor='#fff' />
                            <stop offset='100%' stopColor={currentTheme.secondary} />
                        </linearGradient>

                        <linearGradient gradientUnits='userSpaceOnUse' id='gradient2' gradientTransform='rotate(65)'>
                            <stop offset='0%' stopColor={currentTheme.primary} />
                            <stop offset='10%' stopColor={currentTheme.secondary} />
                            <stop offset='50%' stopColor='#fff' />
                            <stop offset='100%' stopColor={currentTheme.accent} />
                        </linearGradient>

                        <linearGradient gradientUnits='userSpaceOnUse' id='gradient3'>
                            <stop offset='0%' stopColor={currentTheme.secondary} />
                            <stop offset='50%' stopColor={currentTheme.accent} />
                            <stop offset='100%' stopColor={currentTheme.secondary} />
                        </linearGradient>

                        <g
                            id='lightning'
                            strokeWidth={strokeWidth}
                            filter={showGlow ? 'url(#glow)' : undefined}
                            stroke='url(#gradient)'
                        >
                            <rect
                                filter='url(#filter)'
                                className='strike'
                                stroke='url(#gradient)'
                                x='0'
                                y='0'
                                width='100'
                                height='50'
                                rx='38.59'
                                fill='none'
                                strokeMiterlimit='10'
                                strokeWidth={strokeWidth}
                            />
                            <rect
                                filter='url(#filter2)'
                                className='strike'
                                stroke='url(#gradient2)'
                                x='0'
                                y='0'
                                width='100'
                                height='50'
                                rx='38.59'
                                fill='none'
                                strokeMiterlimit='10'
                                strokeWidth={strokeWidth * 1.3}
                            />
                            <rect
                                filter='url(#filter3)'
                                className='strike'
                                stroke='url(#gradient3)'
                                x='0'
                                y='0'
                                width='100'
                                height='50'
                                rx='38.59'
                                fill='none'
                                strokeMiterlimit='10'
                                strokeWidth={strokeWidth}
                            />
                            <rect
                                filter='url(#filter2)'
                                className='strike'
                                stroke='url(#gradient3)'
                                x='0'
                                y='0'
                                width='100'
                                height='50'
                                rx='38.59'
                                fill='none'
                                strokeMiterlimit='10'
                                strokeWidth={strokeWidth * 0.7}
                            />
                            <rect
                                filter='url(#filter4)'
                                className='strike'
                                stroke='url(#gradient3)'
                                x='0'
                                y='0'
                                width='100'
                                height='50'
                                rx='38.59'
                                fill='none'
                                strokeMiterlimit='10'
                                strokeWidth={strokeWidth}
                            />
                        </g>
                    </svg>
                </div>
            )
        }
    )
)

Voltage.displayName = 'Voltage'

export default Voltage
