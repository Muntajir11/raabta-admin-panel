import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-600">
            The route you opened doesn’t exist in the admin panel.
          </div>
          <Link to="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

