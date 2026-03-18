import { redirect } from 'next/navigation'

// Root route redirects to login.
// Logged-in users will be redirected to their portal by middleware.
export default function RootPage() {
  redirect('/login')
}
