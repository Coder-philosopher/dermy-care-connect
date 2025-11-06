import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { executeQuery } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Activity, 
  LogOut, 
  Calendar, 
  TrendingUp,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Visit {
  id: number;
  visit_date: string;
  diagnosis: string;
  notes: string;
  status: string;
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState({
    totalVisits: 0,
    activeVisits: 0,
    reports: 0
  });

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = () => {
    try {
      // Load patient profile
      const profileResults = executeQuery(
        'SELECT * FROM patients WHERE user_id = ?',
        [user?.id]
      );
      
      if (profileResults.length > 0) {
        setProfile(profileResults[0] as PatientProfile);
        
        const patientId = (profileResults[0] as any).id;
        
        // Load recent visits
        const visitResults = executeQuery(
          'SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC LIMIT 5',
          [patientId]
        );
        setRecentVisits(visitResults as Visit[]);
        
        // Load stats
        const totalVisits = executeQuery(
          'SELECT COUNT(*) as count FROM visits WHERE patient_id = ?',
          [patientId]
        );
        
        const activeVisits = executeQuery(
          'SELECT COUNT(*) as count FROM visits WHERE patient_id = ? AND status = "active"',
          [patientId]
        );
        
        const reports = executeQuery(
          'SELECT COUNT(*) as count FROM reports WHERE patient_id = ?',
          [patientId]
        );
        
        setStats({
          totalVisits: (totalVisits[0] as any)?.count || 0,
          activeVisits: (activeVisits[0] as any)?.count || 0,
          reports: (reports[0] as any)?.count || 0
        });
      }
      
      console.log('Patient data loaded');
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">DermaTrack Pro</h1>
              <p className="text-sm text-muted-foreground">Patient Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {profile?.first_name || 'Patient'}!
            </h2>
            <p className="text-muted-foreground">
              View your treatment progress and medical records
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalVisits}</div>
              <p className="text-xs text-muted-foreground mt-1">All appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Treatments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.activeVisits}</div>
              <p className="text-xs text-muted-foreground mt-1">Ongoing care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.reports}</div>
              <p className="text-xs text-muted-foreground mt-1">Available to view</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Visits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Visits</CardTitle>
            <CardDescription>Your latest appointments and treatments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No visits recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                    onClick={() => navigate(`/patient/visits/${visit.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{visit.diagnosis || 'General Consultation'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        visit.status === 'active' 
                          ? 'bg-accent/10 text-accent' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-primary cursor-pointer transition-colors"
                onClick={() => navigate('/patient/progress')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent/10 p-3">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">View Progress</h3>
                  <p className="text-sm text-muted-foreground">Track your treatment progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary cursor-pointer transition-colors"
                onClick={() => navigate('/patient/images')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Medical Images</h3>
                  <p className="text-sm text-muted-foreground">View treatment photos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Notice */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Privacy Notice:</strong> All your medical data is stored securely and locally. 
              Only you and your clinician have access to this information. This is a read-only view 
              for your reference. Contact your clinician for any updates or concerns.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
