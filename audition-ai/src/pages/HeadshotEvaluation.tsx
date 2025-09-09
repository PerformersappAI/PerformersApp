import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, MapPin, Phone, Globe, Instagram, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateHeadshotAnalysisPDF } from "@/utils/pdfGenerator";

interface HeadshotAnalysis {
  id: string;
  image_url: string;
  headshot_type: string;
  overall_score: number;
  technical_score: number;
  professional_score: number;
  industry_score: number;
  detailed_feedback: {
    full_analysis: string;
    casting_types: string[];
    red_flags: string[];
    final_verdict: string;
  };
  improvement_suggestions: string[];
  created_at: string;
}

interface Photographer {
  id: string;
  name: string;
  business_name?: string;
  website?: string;
  instagram?: string;
  city: string;
  state: string;
  specialties: string[];
  price_range?: string;
  bio?: string;
  rating?: number;
  total_reviews: number;
  verified: boolean;
}

export default function HeadshotEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<HeadshotAnalysis | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAnalysis();
      fetchPhotographers();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('headshot_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Type cast the database response to match our interface
      const analysisData = data as any;
      const typedAnalysis: HeadshotAnalysis = {
        id: analysisData.id,
        image_url: analysisData.image_url,
        headshot_type: analysisData.headshot_type,
        overall_score: analysisData.overall_score,
        technical_score: analysisData.technical_score,
        professional_score: analysisData.professional_score,
        industry_score: analysisData.industry_score,
        detailed_feedback: analysisData.detailed_feedback as {
          full_analysis: string;
          casting_types: string[];
          red_flags: string[];
          final_verdict: string;
        },
        improvement_suggestions: analysisData.improvement_suggestions || [],
        created_at: analysisData.created_at,
      };
      
      setAnalysis(typedAnalysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: "Error",
        description: "Failed to load headshot analysis",
        variant: "destructive",
      });
    }
  };

  const fetchPhotographers = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_photographers', { limit_count: 4 });

      if (error) throw error;
      setPhotographers(data || []);
    } catch (error) {
      console.error('Error fetching photographers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  // Helper to clean and parse analysis text
  const sanitizeAnalysisText = (text: string) => {
    return text.replace(/```json[\s\S]*?```/g, '').trim();
  };

  // Helper to parse analysis into sections
  const parseAnalysisIntoSections = (analysisText: string) => {
    const sanitized = sanitizeAnalysisText(analysisText);
    const sections = [];
    
    // Split by emoji-led headings
    const lines = sanitized.split('\n');
    let currentSection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check for emoji-led section headers
      if (trimmed.match(/^[⭐️🎭📸🧠💡⚠️✨🎯📝]/)) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: trimmed,
          content: []
        };
      } else if (currentSection) {
        currentSection.content.push(trimmed);
      } else {
        // First section without emoji header
        if (!currentSection) {
          currentSection = { title: "📋 Analysis Overview", content: [] };
        }
        currentSection.content.push(trimmed);
      }
    }
    
    if (currentSection) sections.push(currentSection);
    return sections;
  };

  // Helper to convert text to bullet points
  const bulletizeContent = (content: string[]) => {
    return content.map(item => {
      const trimmed = item.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        return trimmed;
      }
      return `• ${trimmed}`;
    });
  };

  // Helper to copy photographer brief
  const copyPhotographerBrief = () => {
    const brief = `Headshot Photography Instructions

Based on professional analysis of my current headshot, here are specific directions for our upcoming session:

IMPROVEMENT AREAS:
${analysis?.improvement_suggestions?.map(suggestion => `• ${suggestion}`).join('\n') || '• General professional improvements needed'}

RED FLAGS TO AVOID:
${analysis?.detailed_feedback.red_flags?.map(flag => `• ${flag}`).join('\n') || '• No specific issues noted'}

CASTING TYPES TO CAPTURE:
${analysis?.detailed_feedback.casting_types?.map(type => `• ${type}`).join('\n') || '• Commercial and theatrical looks'}

TECHNICAL REQUIREMENTS:
• Sharp focus on eyes (critical)
• Professional lighting (no harsh shadows)
• Mid-chest to top of head framing
• Clean background with appropriate bokeh
• Natural, authentic expression
• Current industry standards for ${analysis?.headshot_type} headshots

Please ensure we capture looks that are industry-ready and casting-director approved for ${new Date().getFullYear()}.`;

    navigator.clipboard.writeText(brief).then(() => {
      toast({
        title: "Brief Copied!",
        description: "Photographer instructions copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the text",
        variant: "destructive"
      });
    });
  };

  // Helper to generate PDF
  const handleDownloadPDF = () => {
    if (!analysis) return;
    
    try {
      generateHeadshotAnalysisPDF({ analysis });
      toast({
        title: "PDF Generated!",
        description: "Your headshot analysis report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to generate PDF report",
        variant: "destructive"
      });
    }
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)} ({photographers.find(p => p.rating === rating)?.total_reviews || 0} reviews)
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Analysis Not Found</CardTitle>
            <CardDescription>
              The headshot analysis you're looking for doesn't exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/self-taping')} className="w-full">
              Back to Headshot Grader
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/self-taping')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Headshot Grader
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Full Size Image */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Your Headshot
                  <Badge variant={analysis.headshot_type === 'commercial' ? 'default' : 'secondary'}>
                    {analysis.headshot_type}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <img
                  src={analysis.image_url}
                  alt="Headshot being evaluated"
                  className="w-full h-auto rounded-b-lg"
                />
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {/* Overall Scores */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Professional Analysis</CardTitle>
                    <CardDescription>Powered by Google Gemini Pro Vision</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                      {analysis.overall_score}%
                    </div>
                    <div className="text-sm text-muted-foreground">Overall</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.technical_score)}`}>
                      {analysis.technical_score}%
                    </div>
                    <div className="text-sm text-muted-foreground">Technical</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.professional_score)}`}>
                      {analysis.professional_score}%
                    </div>
                    <div className="text-sm text-muted-foreground">Professional</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.industry_score)}`}>
                      {analysis.industry_score}%
                    </div>
                    <div className="text-sm text-muted-foreground">Industry Ready</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Casting Types */}
            {analysis.detailed_feedback.casting_types?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Casting Types</CardTitle>
                  <CardDescription>Roles this headshot could book</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.detailed_feedback.casting_types.map((type, index) => (
                      <Badge key={index} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Verdict */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Verdict</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {analysis.detailed_feedback.final_verdict}
                </p>
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            {analysis.improvement_suggestions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Photographer Instructions</CardTitle>
                  <CardDescription>
                    Share these specific instructions with your photographer for your next shoot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.improvement_suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Red Flags */}
            {analysis.detailed_feedback.red_flags?.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Areas of Concern</CardTitle>
                  <CardDescription>Issues that may affect casting success</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.detailed_feedback.red_flags.map((flag, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recommended Photographers */}
        {photographers.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Headshot Photographers</CardTitle>
                <CardDescription>
                  Professional photographers in your area who specialize in actor headshots
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {photographers.map((photographer) => (
                    <Card key={photographer.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{photographer.name}</CardTitle>
                            {photographer.business_name && (
                              <CardDescription>{photographer.business_name}</CardDescription>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {photographer.city}, {photographer.state}
                              </span>
                            </div>
                          </div>
                          {photographer.verified && (
                            <Badge variant="default" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        {photographer.rating && renderStarRating(photographer.rating)}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {photographer.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {photographer.specialties.slice(0, 3).map((specialty, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {photographer.price_range && (
                          <p className="text-sm font-medium text-primary">
                            {photographer.price_range}
                          </p>
                        )}
                        
                        {photographer.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {photographer.bio}
                          </p>
                        )}
                        
                        <Separator />
                        
                        <div className="flex items-center gap-4 text-sm">
                          {photographer.website && (
                            <a 
                              href={photographer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <Globe className="h-3 w-3" />
                              Website
                            </a>
                          )}
                          {photographer.instagram && (
                            <a 
                              href={photographer.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <Instagram className="h-3 w-3" />
                              Instagram
                            </a>
                          )}
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={() => {
                            // Contact requires authentication - redirect to sign up
                            window.location.href = '/auth';
                          }}
                        >
                          Sign up to Contact
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Dynamic Analysis Report */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Professional Headshot Analysis Report
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyPhotographerBrief}
                  className="ml-4"
                >
                  📋 Copy Photographer Brief
                </Button>
              </CardTitle>
              <CardDescription>Detailed evaluation by industry professionals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {parseAnalysisIntoSections(analysis.detailed_feedback.full_analysis).map((section, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {section.title}
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {bulletizeContent(section.content).map((point, pointIndex) => (
                        <li key={pointIndex} className="text-sm leading-relaxed">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              
              {/* Quick Action Summary */}
              <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">🎯 Next Steps</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">✅ Strengths to Keep:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {analysis.detailed_feedback.casting_types.map((type, i) => (
                        <li key={i}>{type} appeal</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">🔧 Priority Improvements:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {analysis.improvement_suggestions.slice(0, 3).map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Download PDF Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={handleDownloadPDF}
            size="lg"
            className="flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Download Complete Analysis PDF
          </Button>
        </div>
      </div>
    </div>
  );
}