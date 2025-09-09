import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ProVoiceTest = () => {
  const [testText, setTestText] = useState('Hello, this is a Pro-Voice TTS test.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setAudioUrl('');

    try {
      console.log('🔍 Testing Pro-Voice API connection...');
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = `test_${timestamp}_${randomId}.wav`;

      console.log('📤 Sending request to Pro-Voice API...');
      const response = await fetch('http://162.19.255.187:3000/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          filename: filename
        })
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Response data:', data);
      setResult(data);

      // Test audio URL if file is available
      if (data.file) {
        const audioTestUrl = `http://162.19.255.187:3000/audio/${data.file}`;
        console.log('🎵 Testing audio URL:', audioTestUrl);
        
        const audioResponse = await fetch(audioTestUrl, { method: 'HEAD' });
        console.log('🎵 Audio URL status:', audioResponse.status);
        
        if (audioResponse.ok) {
          setAudioUrl(audioTestUrl);
          console.log('✅ Audio file accessible!');
        } else {
          console.log('❌ Audio file not accessible');
          setError('Audio file generated but not accessible');
        }
      }

    } catch (err: any) {
      console.error('❌ Connection test failed:', err);
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pro-Voice TTS Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Text:</label>
              <Input
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to synthesize..."
              />
            </div>
            
            <Button onClick={testConnection} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Pro-Voice Connection'
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Failed:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {result && !error && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Successful!</strong> 
                  <br />Response: {JSON.stringify(result)}
                </AlertDescription>
              </Alert>
            )}

            {audioUrl && (
              <div className="space-y-2">
                <h3 className="font-medium">Generated Audio:</h3>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/wav" />
                  Your browser does not support audio playback.
                </audio>
                <p className="text-sm text-muted-foreground">
                  Audio URL: {audioUrl}
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>API Endpoint:</strong> http://162.19.255.187:3000/synthesize</p>
              <p><strong>Audio Base URL:</strong> http://162.19.255.187:3000/audio/</p>
              <p><strong>Expected Response:</strong> {`{"message": "Audio saved", "file": "filename.wav"}`}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProVoiceTest;