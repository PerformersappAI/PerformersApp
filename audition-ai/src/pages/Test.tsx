import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Trash2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Test: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check if Web Speech API is supported
  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Listening started",
          description: "Speak now, and your voice will be converted to text.",
        });
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(interimText);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const downloadTranscript = () => {
    if (!transcript.trim()) {
      toast({
        title: "No content",
        description: "There's no transcript to download.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your transcript has been downloaded.",
    });
  };

  if (!isSupported) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Speech Recognition Not Supported</CardTitle>
            <CardDescription>
              Your browser doesn't support the Web Speech API. Please try using a modern browser like Chrome, Edge, or Safari.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Voice to Text Test</h1>
          <p className="text-muted-foreground text-lg">
            Test speech-to-text functionality by speaking into your microphone
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Speech Recognition
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? "Listening..." : "Ready"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Click the microphone button to start/stop voice recognition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 justify-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                className="flex items-center gap-2"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isListening ? "Stop Listening" : "Start Listening"}
              </Button>
              
              <Button
                variant="outline"
                onClick={clearTranscript}
                disabled={!transcript && !interimTranscript}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>

              <Button
                variant="outline"
                onClick={downloadTranscript}
                disabled={!transcript.trim()}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Transcript:</label>
              <Textarea
                value={transcript + interimTranscript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your speech will appear here as text..."
                className="min-h-[200px] font-mono"
              />
              {interimTranscript && (
                <p className="text-xs text-muted-foreground">
                  Interim text (processing): {interimTranscript}
                </p>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Speak clearly and at a moderate pace</li>
                <li>Make sure your microphone permissions are enabled</li>
                <li>Gray text shows interim results while processing</li>
                <li>You can edit the transcript directly in the text area</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Test;