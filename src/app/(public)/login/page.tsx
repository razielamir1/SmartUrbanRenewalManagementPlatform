import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">פינוי-בינוי</h1>
          <p className="mt-2 text-muted-foreground text-lg">היכנסו לחשבונכם</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
