import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { executeQuery } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = () => {
    try {
      const patientData = executeQuery('SELECT * FROM patients WHERE id = ?', [patientId]);
      const visitData = executeQuery(
        'SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC',
        [patientId]
      );
      
      setPatient(patientData[0]);
      setVisits(visitData);
    } catch (error) {
      console.error('Error loading patient:', error);
      toast.error('Failed to load patient data');
    }
  };

  if (!patient) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/clinician/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {patient.first_name} {patient.last_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Email:</strong> {patient.email}</div>
              <div><strong>Phone:</strong> {patient.phone}</div>
              <div><strong>DOB:</strong> {patient.date_of_birth}</div>
              <div><strong>Gender:</strong> {patient.gender}</div>
            </div>
            {patient.medical_history && (
              <div className="pt-4 border-t">
                <strong className="text-sm">Medical History:</strong>
                <p className="text-sm text-muted-foreground mt-1">{patient.medical_history}</p>
              </div>
            )}
            <Button onClick={() => navigate(`/clinician/patients/${patientId}/visit/new`)} className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Create New Visit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit History</CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No visits recorded</p>
            ) : (
              <div className="space-y-2">
                {visits.map((visit) => (
                  <div key={visit.id} className="p-4 border rounded-lg hover:bg-accent/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{visit.diagnosis || 'General Consultation'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                        {visit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
