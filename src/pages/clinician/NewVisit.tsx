import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { runQuery } from '@/lib/database';
import { useModelPredict, useHeatmapGenerator } from '@/hooks/useMLModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageCapture } from '@/components/ImageCapture';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function NewVisit() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { predict, isLoading: isPredicting } = useModelPredict();
  const { generateHeatmap, isLoading: isGeneratingHeatmap } = useHeatmapGenerator();
  
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<any>(null);

  const handleImageCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    toast.success('Running AI analysis...');
    
    const predictions = await predict(imageData);
    const heatmap = await generateHeatmap(imageData);
    
    setAiResults({ predictions, heatmap });
    toast.success('AI analysis complete');
  };

  const handleSave = () => {
    try {
      runQuery(
        `INSERT INTO visits (patient_id, clinician_id, diagnosis, notes, treatment_plan)
         VALUES (?, ?, ?, ?, ?)`,
        [patientId, user?.id, diagnosis, notes, treatmentPlan]
      );

      if (capturedImage && aiResults) {
        const visitId = Date.now(); // In real app, get last insert ID
        runQuery(
          `INSERT INTO images (visit_id, image_data, ai_analysis, heatmap_data)
           VALUES (?, ?, ?, ?)`,
          [visitId, capturedImage, JSON.stringify(aiResults.predictions), JSON.stringify(aiResults.heatmap)]
        );
      }

      toast.success('Visit saved successfully');
      navigate(`/clinician/patients/${patientId}`);
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error('Failed to save visit');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/clinician/patients/${patientId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>New Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Clinical Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Treatment Plan</Label>
              <Textarea value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <ImageCapture onImageCapture={handleImageCapture} />

        {aiResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                AI Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiResults.predictions.map((pred: any, idx: number) => (
                <div key={idx} className="p-3 border rounded mb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{pred.condition}</span>
                    <span className="text-sm text-accent">{(pred.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pred.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSave} className="w-full" disabled={isPredicting || isGeneratingHeatmap}>
          <Save className="h-4 w-4 mr-2" />
          Save Visit
        </Button>
      </div>
    </div>
  );
}
