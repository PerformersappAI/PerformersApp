import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, ArrowLeft, Video, FileText, Target, AlertTriangle, Users, Download, FileDown, HelpCircle, ChevronDown, ChevronUp, Monitor } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';

interface CoachingSessionProps {
  analysis: any;
  onBackToResults: () => void;
  onStartVideoUpload: () => void;
  onCoachingSessionCreated: (sessionId: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Helper function to parse markdown-style bold text
const parseText = (text: string) => {
  if (!text) return text;
  
  // Split text by ** to find bold sections
  const parts = text.split('**');
  return parts.map((part, index) => {
    // Every odd index (1, 3, 5...) should be bold
    if (index % 2 === 1) {
      return <strong key={index} className="font-semibold">{part}</strong>;
    }
    return part;
  });
};

// Helper function to format content as structured list
const formatContent = (text: string) => {
  if (!text) return null;
  
  // Check if text contains multiple distinct points (sentences ending with periods)
  const points = text.split(/[.!?]\s+/).filter(point => point.trim().length > 10);
  
  if (points.length <= 1) {
    return (
      <div className="space-y-2">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {parseText(text)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {points.map((point, index) => {
        const trimmedPoint = point.trim();
        if (!trimmedPoint) return null;
        
        // Add period if missing
        const formattedPoint = trimmedPoint.endsWith('.') || trimmedPoint.endsWith('!') || trimmedPoint.endsWith('?') 
          ? trimmedPoint 
          : trimmedPoint + '.';
        
        return (
          <div key={index} className="flex items-start gap-3 bg-muted/20 rounded-lg p-3">
            <div className="w-2 h-2 bg-brand-yellow rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {parseText(formattedPoint)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CoachingSession: React.FC<CoachingSessionProps> = ({
  analysis,
  onBackToResults,
  onStartVideoUpload,
  onCoachingSessionCreated
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [coachingSessionId, setCoachingSessionId] = useState<string>('');
  const [isQuickQuestionsOpen, setIsQuickQuestionsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [script, setScript] = useState<any>(null);
  const [loadingScript, setLoadingScript] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Standard acting coach questions
  const standardQuestions = [
    `What is my character's main objective in this scene?`,
    `What obstacles does my character face and how do they overcome them?`,
    `What is the subtext behind my character's dialogue in this scene?`,
    `How should I adjust my performance using the ${analysis.acting_method} technique?`,
    `What emotional beats should I focus on in this scene?`
  ];

  // Get the actual script content from analysis
  const scriptContent = analysis.analysis_data?.script_content || analysis.emotional_beats?.script_content || 'No script content available';

  useEffect(() => {
    createCoachingSession();
    fetchScriptData();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchScriptData = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', analysis.script_id)
        .single();

      if (error) {
        console.error('Error fetching script:', error);
      } else {
        setScript(data);
      }
    } catch (error) {
      console.error('Error fetching script data:', error);
    } finally {
      setLoadingScript(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  };

  const createCoachingSession = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('coaching_sessions').insert([{
        user_id: user.id,
        analysis_id: analysis.id,
        chat_history: [],
        session_status: 'active'
      }]).select().single();
      if (error) throw error;
      setCoachingSessionId(data.id);
      onCoachingSessionCreated(data.id);

      // Add initial coaching message
      const initialMessage: ChatMessage = {
        role: 'assistant',
        content: `Welcome to your personalized acting coaching session! I've analyzed your script and I'm ready to help you work on your character: **${analysis.selected_character}** using the **${analysis.acting_method}** method.\n\n${script?.scene_summary ? '📝 **Scene Summary Available**: I\'ve generated a scene summary displayed above this chat - reference it while we work together!' : '📝 **Scene Summary**: If available, you\'ll see a scene summary above this chat to reference during our session.'}\n\nI have your full script and analysis ready. What specific aspect of your performance would you like to work on today? We can focus on:\n\n• Specific scenes or dialogue\n• Character motivation and objectives\n• Emotional beats and transitions\n• Line delivery and subtext\n• ${analysis.acting_method} technique application\n\nWhat would you like to explore first?`,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create coaching session.",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || isLoading || !coachingSessionId) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    if (!messageText) {
      setInputMessage('');
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('coaching-chat', {
        body: {
          message: textToSend,
          analysis: analysis,
          chatHistory: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });
      if (error) throw error;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      await updateChatHistory(finalMessages);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get coaching response.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const updateChatHistory = async (chatMessages: ChatMessage[]) => {
    try {
      await supabase.from('coaching_sessions').update({
        chat_history: chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        })),
        updated_at: new Date().toISOString()
      }).eq('id', coachingSessionId);
    } catch (error) {
      console.error('Failed to update chat history:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuestionSelect = (question: string) => {
    setInputMessage(question);
    setSelectedQuestion(question);
    // Auto-expand questions if collapsed
    if (!isQuickQuestionsOpen) {
      setIsQuickQuestionsOpen(true);
    }
  };

  const generateChatSummary = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to summarize",
        description: "Start a conversation with the AI coach first.",
        variant: "destructive"
      });
      return;
    }

    setIsSummarizing(true);
    try {
      // Create a summary request using the coaching chat function
      const chatContent = messages.map(msg => `${msg.role === 'user' ? 'Actor' : 'Coach'}: ${msg.content}`).join('\n\n');
      
      const summaryPrompt = `Please provide a comprehensive summary of this coaching session. Include:

1. **Session Overview**: Brief description of what was discussed
2. **Key Topics Covered**: Main areas of focus during the session
3. **Coach Recommendations**: Important advice and suggestions given
4. **Action Items**: Specific next steps or exercises recommended
5. **Progress Notes**: Areas of improvement identified

Here's the full conversation:

${chatContent}`;

      const { data, error } = await supabase.functions.invoke('coaching-chat', {
        body: {
          message: summaryPrompt,
          analysis: analysis,
          chatHistory: []
        }
      });

      if (error) throw error;

      // Generate PDF with the summary
      await generatePDF(data.message);
      
      toast({
        title: "Summary generated!",
        description: "Your coaching session summary has been downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate summary.",
        variant: "destructive"
      });
    }
    setIsSummarizing(false);
  };

  const generatePDF = async (summary: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Acting Coaching Session Summary', margin, 30);
    
    // Session info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Character: ${analysis.selected_character}`, margin, 50);
    doc.text(`Acting Method: ${analysis.acting_method}`, margin, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 70);
    
    // Summary content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Summary', margin, 90);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Split summary text into lines that fit the page width
    const summaryLines = doc.splitTextToSize(summary, maxWidth);
    let yPosition = 105;
    
    summaryLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    // Add full conversation if there's space or on new pages
    if (messages.length > 0) {
      doc.addPage();
      yPosition = margin;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Full Conversation', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      messages.forEach((message) => {
        const sender = message.role === 'user' ? 'You' : 'AI Coach';
        const timestamp = message.timestamp.toLocaleTimeString();
        
        // Add sender and timestamp
        doc.setFont('helvetica', 'bold');
        const headerText = `${sender} (${timestamp}):`;
        doc.text(headerText, margin, yPosition);
        yPosition += 8;
        
        // Add message content
        doc.setFont('helvetica', 'normal');
        const messageLines = doc.splitTextToSize(message.content, maxWidth);
        
        messageLines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10; // Space between messages
      });
    }
    
    // Save the PDF
    const fileName = `coaching-session-${analysis.selected_character}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onBackToResults} variant="outline" size="sm" className="text-foreground border-border hover:text-foreground bg-background hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analysis
            </Button>
            <h1 className="text-2xl font-bold text-foreground">AI Coaching Session</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={generateChatSummary} 
              disabled={isSummarizing || messages.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSummarizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              {isSummarizing ? 'Generating...' : 'Download Summary'}
            </Button>
            <Button onClick={onStartVideoUpload} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Video className="w-4 h-4 mr-2" />
              Upload Practice Video
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Script Text Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border h-full">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Script Text
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Edit your script text and work through specific scenes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea value={scriptContent} readOnly className="bg-muted border-border text-foreground min-h-[400px] font-mono text-sm" placeholder="Script content will appear here..." />
                <div className="mt-2 text-xs text-muted-foreground">
                  {scriptContent.length} characters • Read-only view
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Scene Summary and Chat Interface */}
          <div className="lg:col-span-2 space-y-6">
          {/* Scene Summary - Prominently displayed above chat */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground flex items-center gap-3 text-xl">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                Scene Summary
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                AI analysis of what's happening in your scene - reference this while asking questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingScript ? (
                <div className="bg-muted/20 rounded-lg p-6 text-center border-2 border-dashed border-muted-foreground/20">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-3"></div>
                  <p className="text-muted-foreground text-base">Loading scene summary...</p>
                </div>
              ) : script?.scene_summary ? (
                <div className="bg-primary/10 rounded-lg p-6 border-l-4 border-primary">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-foreground text-base leading-relaxed font-medium">
                        {script.scene_summary}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/20 rounded-lg p-6 text-center border-2 border-dashed border-muted-foreground/20">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-base">
                    No scene summary available yet. The scene summary should have been generated during analysis.
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    You can ask the coach about the scene even without a summary!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    AI Acting Coach
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Get personalized coaching for {analysis.selected_character} using {analysis.acting_method} method
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[500px]">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-brand-yellow text-brand-yellow-foreground' : 'bg-muted text-foreground'}`}>
                        <div className="whitespace-pre-wrap text-sm">
                          {parseText(message.content)}
                        </div>
                        <div className={`text-xs opacity-70 mt-1 ${message.role === 'user' ? 'text-brand-yellow-foreground/70' : 'text-muted-foreground'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent"></div>
                          <span className="text-sm">Coach is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input 
                    value={inputMessage} 
                    onChange={e => setInputMessage(e.target.value)} 
                    onKeyPress={handleKeyPress} 
                    placeholder="Ask your acting coach anything..." 
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground" 
                    disabled={isLoading} 
                  />
                  <Button 
                    onClick={() => sendMessage()} 
                    disabled={isLoading || !inputMessage.trim()} 
                    className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-yellow-foreground"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Coach Questions */}
                <Collapsible open={isQuickQuestionsOpen} onOpenChange={setIsQuickQuestionsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-brand-yellow" />
                        <span className="text-sm font-medium">Quick Coach Questions</span>
                      </div>
                      {isQuickQuestionsOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-3">Click any question to add it to your input:</p>
                      <div className="space-y-2">
                        {standardQuestions.map((question, index) => (
                          <label 
                            key={index} 
                            className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group"
                          >
                            <input
                              type="radio"
                              name="quickQuestion"
                              value={question}
                              checked={selectedQuestion === question}
                              onChange={() => handleQuestionSelect(question)}
                              className="mt-1 w-4 h-4 text-brand-yellow bg-input border-border focus:ring-brand-yellow focus:ring-2"
                            />
                            <span className="text-sm text-foreground group-hover:text-foreground flex-1 leading-relaxed">
                              {question}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Reference - Updated Design */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quick Reference - Your Character Analysis
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Key insights to reference during your coaching session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand-yellow/20 rounded-lg">
                  <Target className="w-5 h-5 text-brand-yellow" />
                </div>
                <div>
                  <h4 className="text-foreground font-semibold text-lg">Objectives</h4>
                  <p className="text-muted-foreground text-sm">What your character wants to achieve</p>
                </div>
              </div>
              <div className="space-y-4">
                {analysis.objectives?.map((objective: string, index: number) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-4 border-l-4 border-brand-yellow">
                    <div className="flex items-start gap-3">
                      <span className="text-brand-yellow font-bold text-sm mt-1 flex-shrink-0 bg-brand-yellow/20 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        {formatContent(objective)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-foreground font-semibold text-lg">Obstacles</h4>
                  <p className="text-muted-foreground text-sm">What stands in your character's way</p>
                </div>
              </div>
              <div className="space-y-4">
                {analysis.obstacles?.map((obstacle: string, index: number) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-4 border-l-4 border-red-400">
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 font-bold text-sm mt-1 flex-shrink-0 bg-red-400/20 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        {formatContent(obstacle)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-foreground font-semibold text-lg">Tactics</h4>
                  <p className="text-muted-foreground text-sm">How your character tries to achieve their goals</p>
                </div>
              </div>
              <div className="space-y-4">
                {analysis.tactics?.map((tactic: string, index: number) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-4 border-l-4 border-green-400">
                    <div className="flex items-start gap-3">
                      <span className="text-green-400 font-bold text-sm mt-1 flex-shrink-0 bg-green-400/20 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        {formatContent(tactic)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <DataUseDisclaimer className="mt-6" />
    </>
  );
};

export default CoachingSession;