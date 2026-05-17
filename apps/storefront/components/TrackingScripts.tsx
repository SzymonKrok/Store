'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { getConsent, type CookieConsent } from './CookieBanner'

interface Props {
  ga4Id: string | null
  fbPixelId: string | null
}

export function TrackingScripts({ ga4Id, fbPixelId }: Props) {
  const [analyticsConsent, setAnalyticsConsent] = useState(false)

  useEffect(() => {
    const consent = getConsent()
    if (consent?.analytics) setAnalyticsConsent(true)

    function handleUpdate(e: Event) {
      setAnalyticsConsent((e as CustomEvent<CookieConsent>).detail.analytics)
    }

    window.addEventListener('cookie_consent_update', handleUpdate)
    return () => window.removeEventListener('cookie_consent_update', handleUpdate)
  }, [])

  if (!analyticsConsent) return null

  return (
    <>
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      )}
      {fbPixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  )
}
