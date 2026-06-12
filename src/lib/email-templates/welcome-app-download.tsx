import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const APP_STORE_URL = 'https://apps.apple.com/us/app/titan-solutions/id6772334128'
const TEMP_PASSWORD = 'Titan!2026'
const WALKTHROUGH_VIDEO_URL = 'https://www.loom.com/share/d55a5c1f37a04968b1ac5da1aa35d459'
const WALKTHROUGH_THUMBNAIL_URL =
  'https://cdn.loom.com/sessions/thumbnails/d55a5c1f37a04968b1ac5da1aa35d459-with-play.gif'

interface WelcomeAppDownloadProps {
  fullName?: string
  email?: string
  role?: 'admin' | 'supervisor' | 'client'
}

const WelcomeAppDownloadEmail = ({
  fullName,
  email,
  role,
}: WelcomeAppDownloadProps) => {
  const greeting = fullName ? `Welcome, ${fullName}` : 'Welcome to Titan Solutions'
  const roleLabel =
    role === 'client'
      ? 'client account'
      : role === 'supervisor'
        ? 'supervisor account'
        : role === 'admin'
          ? 'admin account'
          : 'account'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Titan Solutions {roleLabel} is ready — download the app to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>TITAN SOLUTIONS</Text>
          </Section>

          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            Your {roleLabel} has been created. To get started, download the Titan
            Solutions app from the Apple App Store and sign in using the
            credentials below.
          </Text>

          <Section style={ctaSection}>
            <Button style={button} href={APP_STORE_URL}>
              Download on the App Store
            </Button>
          </Section>

          <Section style={credBox}>
            <Text style={credLabel}>Email</Text>
            <Text style={credValue}>{email ?? 'the email this message was sent to'}</Text>
            <Text style={credLabel}>Temporary password</Text>
            <Text style={credValueMono}>{TEMP_PASSWORD}</Text>
          </Section>

          <Text style={text}>
            On your first sign-in, the app will prompt you to set your own
            password. Choose something memorable — you'll use it every time
            after that.
          </Text>

          <Section style={videoSection}>
            <Text style={videoLabel}>How to use the app</Text>
            <Text style={videoCaption}>
              <Link href={WALKTHROUGH_VIDEO_URL} style={videoCaptionLink}>
                Watch the walkthrough on Loom →
              </Link>
            </Text>
          </Section>

          <Text style={footer}>
            If you weren't expecting this invitation, you can safely ignore this email.
          </Text>
          <Text style={footerLink}>
            App Store link: {APP_STORE_URL}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeAppDownloadEmail,
  subject: (data: Record<string, any>) =>
    data?.fullName
      ? `Welcome to Titan Solutions, ${data.fullName}`
      : 'Welcome to Titan Solutions',
  displayName: 'Welcome — download the app',
  previewData: { fullName: 'Jane Doe', email: 'jane@example.com', role: 'client' },
} satisfies TemplateEntry

export default WelcomeAppDownloadEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '1px solid #c9a84c', paddingBottom: '12px', marginBottom: '28px' }
const brandText = {
  fontSize: '12px',
  letterSpacing: '0.24em',
  color: '#c9a84c',
  margin: 0,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold' as const,
}
const h1 = {
  fontSize: '26px',
  fontWeight: 'normal' as const,
  color: '#0d0d0d',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: '1.6',
  margin: '0 0 20px',
  fontFamily: 'Arial, sans-serif',
}
const ctaSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#0d0d0d',
  color: '#c9a84c',
  fontSize: '14px',
  borderRadius: '6px',
  padding: '14px 28px',
  textDecoration: 'none',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold' as const,
  border: '1px solid #c9a84c',
  letterSpacing: '0.05em',
}
const credBox = {
  border: '1px solid #e6d9a8',
  backgroundColor: '#fbf7ec',
  borderRadius: '6px',
  padding: '18px 20px',
  margin: '24px 0',
}
const credLabel = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#8a7a3f',
  margin: '0 0 4px',
  fontFamily: 'Arial, sans-serif',
}
const credValue = {
  fontSize: '15px',
  color: '#0d0d0d',
  margin: '0 0 14px',
  fontFamily: 'Arial, sans-serif',
}
const credValueMono = {
  fontSize: '17px',
  color: '#0d0d0d',
  margin: '0',
  fontFamily: '"Courier New", monospace',
  fontWeight: 'bold' as const,
  letterSpacing: '0.04em',
}
const footer = { fontSize: '12px', color: '#888', margin: '30px 0 6px', fontFamily: 'Arial, sans-serif' }
const footerLink = { fontSize: '11px', color: '#aaa', margin: '0', fontFamily: 'Arial, sans-serif', wordBreak: 'break-all' as const }
const videoSection = { margin: '28px 0', textAlign: 'center' as const }
const videoLabel = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#8a7a3f',
  margin: '0 0 10px',
  fontFamily: 'Arial, sans-serif',
}
const videoLink = { display: 'inline-block', textDecoration: 'none' }
const videoThumb = {
  width: '100%',
  maxWidth: '520px',
  height: 'auto',
  borderRadius: '6px',
  border: '1px solid #e6d9a8',
  display: 'block',
}
const videoCaption = { fontSize: '13px', margin: '10px 0 0', fontFamily: 'Arial, sans-serif' }
const videoCaptionLink = { color: '#c9a84c', textDecoration: 'none', fontWeight: 'bold' as const }
