import { ProjectSetupWizard } from '@/components/portal/admin/ProjectSetupWizard'

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">פרויקט חדש</h1>
        <p className="mt-1 text-muted-foreground text-lg">הגדירו פרויקט פינוי-בינוי חדש שלב אחר שלב</p>
      </div>
      <ProjectSetupWizard />
    </div>
  )
}
