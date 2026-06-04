import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

const updatedDate = 'June 4, 2026'

const privacySections = [
  {
    title: 'Information we collect',
    body: [
      'When you sign in with Google, AceStudy receives basic profile information such as your name, email address, and profile image so we can create and secure your account.',
      'We also store study-related information you choose to add, including subjects, topics, study sessions, goals, notes, mock test results, exam preferences, achievements, and app settings.',
    ],
  },
  {
    title: 'How we use information',
    body: [
      'We use your information to provide the AceStudy service, personalize your study dashboard, save your progress, authenticate your sessions, improve app reliability, and respond to support requests.',
      'We do not sell your personal information.',
    ],
  },
  {
    title: 'Google user data',
    body: [
      'AceStudy uses Google OAuth only to sign you in and identify your account. We request the minimum Google profile information needed for login.',
      'AceStudy does not use Google user data for advertising, does not transfer Google user data to third parties except as needed to operate the service, and does not allow humans to read Google user data unless required for security, legal compliance, or support you request.',
    ],
  },
  {
    title: 'Data sharing and service providers',
    body: [
      'We may use trusted service providers for hosting, authentication, analytics, database storage, and error monitoring. These providers process data only to help us operate AceStudy.',
      'We may disclose information if required by law, to protect users, or to prevent fraud or abuse.',
    ],
  },
  {
    title: 'Data retention and deletion',
    body: [
      'We keep account and study data while your account is active or as needed to provide the service. You may request account deletion and removal of associated personal data by contacting support.',
      'Some limited records may be retained when necessary for legal, security, or backup purposes.',
    ],
  },
  {
    title: 'Security',
    body: [
      'We use reasonable technical and organizational safeguards to protect user data. No internet service can guarantee absolute security, but we work to keep your information protected.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'For privacy questions or deletion requests, contact us at princeiit423@gmail.com.',
    ],
  },
]

const termsSections = [
  {
    title: 'Using AceStudy',
    body: [
      'AceStudy helps students track study sessions, organize preparation, monitor progress, and manage exam goals. You must use the service lawfully and provide accurate account information.',
      'You are responsible for keeping your account secure and for activity that occurs through your account.',
    ],
  },
  {
    title: 'Accounts and Google sign-in',
    body: [
      'You may sign in using Google OAuth. By using Google sign-in, you authorize AceStudy to use the basic profile information provided by Google to create and manage your account.',
      'We may suspend or terminate accounts that violate these terms, abuse the service, or create security risks.',
    ],
  },
  {
    title: 'Your content',
    body: [
      'You keep ownership of study notes, goals, session records, and other content you add to AceStudy. You grant AceStudy permission to store and process that content so we can provide the service.',
      'Do not upload content that is illegal, harmful, infringing, or violates another person\'s rights.',
    ],
  },
  {
    title: 'Educational use only',
    body: [
      'AceStudy provides planning and tracking tools. It does not guarantee exam results, admissions outcomes, ranks, scores, or academic performance.',
    ],
  },
  {
    title: 'Service changes',
    body: [
      'We may update, improve, limit, or discontinue parts of the service. We may also update these terms from time to time, and the updated version will be posted on this page.',
    ],
  },
  {
    title: 'Disclaimers and liability',
    body: [
      'AceStudy is provided on an "as is" and "as available" basis. To the fullest extent allowed by law, we disclaim warranties and are not liable for indirect, incidental, or consequential damages.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'For questions about these terms, contact us at princeiit423@gmail.com.',
    ],
  },
]

const pageContent = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'This Privacy Policy explains how AceStudy collects, uses, shares, and protects information when you use our study tracking application.',
    sections: privacySections,
  },
  terms: {
    title: 'Terms of Service',
    intro: 'These Terms of Service describe the rules for using AceStudy. By accessing or using AceStudy, you agree to these terms.',
    sections: termsSections,
  },
}

export default function LegalPage({ type }) {
  const content = pageContent[type]

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/login" className="flex items-center gap-3">
            <img src="/logo.png" alt="AceStudy logo" className="h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-primary/10" />
            <span className="brand-wordmark text-lg">AceStudy</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">
              <ArrowLeft size={15} />
              Sign in
            </Link>
          </Button>
        </div>

        <article className="clay-card bg-card p-6 sm:p-10">
          <p className="mb-3 text-sm font-semibold text-primary">Last updated: {updatedDate}</p>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">{content.title}</h1>
          <p className="mb-8 text-muted-foreground">{content.intro}</p>

          <div className="space-y-7">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-xl font-bold">{section.title}</h2>
                <div className="space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link className="hover:text-primary hover:underline" to="/privacy-policy">Privacy Policy</Link>
          <Link className="hover:text-primary hover:underline" to="/terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </main>
  )
}
