import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, Camera, Star, Target, Zap, Award, Loader2, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DataUseDisclaimer } from "@/components/DataUseDisclaimer";

export default function HeadshotGrader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [headshotType, setHeadshotType] = useState<'commercial' | 'theatrical'>('commercial');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/headshot_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('actor-profiles')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('actor-profiles')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const analyzeHeadshot = async () => {
    if (!selectedImage || !user) return;

    setIsAnalyzing(true);
    
    try {
      console.log('Starting headshot analysis...');
      
      // Upload image to Supabase storage first
      const publicUrl = await uploadImageToSupabase(selectedImage);
      console.log('Image uploaded successfully:', publicUrl);

      // Call the edge function for analysis
      const { data: savedAnalysis, error: dbError } = await supabase.functions.invoke('grade-headshot', {
        body: {
          imageUrl: publicUrl,
          headshotType
        }
      });

      if (dbError) {
        throw dbError;
      }

      console.log('Analysis completed:', savedAnalysis);

      // Navigate to full evaluation page instead of showing inline results
      if (savedAnalysis?.analysis_id) {
        navigate(`/headshot-evaluation/${savedAnalysis.analysis_id}`);
      } else {
        // Fallback: show results inline if no ID
        setAnalysisResult(savedAnalysis);
      }

      toast({
        title: "Analysis Complete!",
        description: "Your headshot has been professionally evaluated.",
      });
    } catch (error: any) {
      console.error('Error analyzing headshot:', error);
      
      // Handle specific error types with helpful messages
      let title = "Analysis Failed";
      let description = "Please try again or contact support.";
      
      // Check for rate limiting
      if (error?.error === 'RATE_LIMIT_EXCEEDED' || error?.message?.includes('429')) {
        title = "Service Temporarily Busy";
        description = "The AI analysis service is experiencing high demand. Please wait 60 seconds and try again.";
      }
      // Check for API errors
      else if (error?.error === 'API_ERROR') {
        title = "Analysis Service Error";
        description = error.message || "The analysis service encountered an error. Please try again.";
      }
      // Check for upload errors
      else if (error instanceof Error && error.message.includes('upload')) {
        description = "Failed to upload image. Please try again.";
      }
      // Check for network errors  
      else if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
        description = "Network error. Please check your connection and try again.";
      }
      // Check for auth errors
      else if (error instanceof Error && error.message.includes('auth')) {
        description = "Authentication error. Please sign in again.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const renderStarRating = (score: number) => {
    const stars = Math.round((score / 100) * 5);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{stars}/5</span>
      </div>
    );
  };

  const parseAnalysisText = (text: string) => {
    const sections = {
      firstImpression: '',
      castingTypes: '',
      technicalBreakdown: '',
      castingMatch: '',
      redFlags: '',
      suggestions: '',
      finalVerdict: ''
    };

    // Extract sections using emoji markers
    const patterns = {
      firstImpression: /⭐️\s*\*\*First Impression:\*\*([\s\S]*?)(?=🎭|$)/,
      castingTypes: /🎭\s*\*\*Casting Type Recognition:\*\*([\s\S]*?)(?=📸|$)/,
      technicalBreakdown: /📸\s*\*\*Technical Breakdown[\s\S]*?\*\*:([\s\S]*?)(?=🧠|$)/,
      castingMatch: /🧠\s*\*\*Casting Match & Branding:\*\*([\s\S]*?)(?=🚫|$)/,
      redFlags: /🚫\s*\*\*Red Flags[\s\S]*?\*\*:([\s\S]*?)(?=✅|$)/,
      suggestions: /✅\s*\*\*Fixes or Suggestions:\*\*([\s\S]*?)(?=🎬|$)/,
      finalVerdict: /🎬\s*\*\*Final Verdict[\s\S]*?\*\*:([\s\S]*?)(?=\{|$)/
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        sections[key as keyof typeof sections] = match[1].trim();
      }
    });

    return sections;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            Professional Headshot Evaluator (2025)
          </CardTitle>
          <p className="text-muted-foreground">
            Get comprehensive feedback from an AI casting director and branding consultant using up-to-date industry-standard evaluation criteria.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Enhanced with Industry Knowledge Base •</span>
            <span className="font-medium text-primary">Google Gemini Pro Vision</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Headshot Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Headshot Type</label>
            <div className="flex gap-3">
              <Button
                variant={headshotType === "commercial" ? "default" : "outline"}
                onClick={() => setHeadshotType("commercial")}
                className="flex-1"
              >
                Commercial
              </Button>
              <Button
                variant={headshotType === "theatrical" ? "default" : "outline"}
                onClick={() => setHeadshotType("theatrical")}
                className="flex-1"
              >
                Theatrical
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {headshotType === "commercial" 
                ? "For commercials, branding, and everyday relatable roles"
                : "For dramatic roles, film, and television character work"
              }
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Upload Your Headshot</label>
            
            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Selected headshot"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setAnalysisResult(null);
                    }}
                  >
                    Change Photo
                  </Button>
                </div>

                {/* Analyze Button */}
                {user && (
                  <Button
                    onClick={analyzeHeadshot}
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAnalyzing ? "Analyzing Headshot..." : "Get Professional Evaluation"}
                  </Button>
                )}
                
                <DataUseDisclaimer className="mt-4" />

                {/* Analysis Results - Display directly below the image */}
                {analysisResult && (
                  <div className="space-y-6 pt-4 border-t">
                    {/* Overall Score */}
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold">Overall Assessment</h3>
                      </div>
                      
                      <div className={`text-3xl font-bold ${getScoreColor(analysisResult.overall_score)}`}>
                        {renderStarRating(analysisResult.overall_score)}
                      </div>
                      <Badge variant={getScoreBadgeVariant(analysisResult.overall_score)} className="text-sm">
                        Overall Rating
                      </Badge>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 bg-muted/30 rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center">
                          <Zap className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Technical</span>
                        </div>
                        {renderStarRating(analysisResult.technical_score)}
                      </div>
                      
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Professional</span>
                        </div>
                        {renderStarRating(analysisResult.professional_score)}
                      </div>
                      
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Industry</span>
                        </div>
                        {renderStarRating(analysisResult.industry_score)}
                      </div>
                    </div>

                    {/* Casting Types */}
                    {analysisResult.casting_types && analysisResult.casting_types.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-700">🎭 Casting Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.casting_types.map((type: string, index: number) => (
                            <Badge key={index} variant="secondary">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final Verdict */}
                    {analysisResult.final_verdict && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">🎬 Final Verdict</h4>
                        <p className="text-sm">{analysisResult.final_verdict}</p>
                      </div>
                    )}

                    {/* Detailed Analysis */}
                    {analysisResult.full_analysis && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-lg font-semibold">Professional Analysis Breakdown</h3>
                        {(() => {
                          const sections = parseAnalysisText(analysisResult.full_analysis);
                          return (
                            <div className="space-y-4">
                              {sections.firstImpression && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-blue-700">⭐️ First Impression</h4>
                                  <div className="text-sm whitespace-pre-line bg-blue-50 p-3 rounded-lg">{sections.firstImpression}</div>
                                </div>
                              )}

                              {sections.castingTypes && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-purple-700">🎭 Casting Type Recognition</h4>
                                  <div className="text-sm whitespace-pre-line bg-purple-50 p-3 rounded-lg">{sections.castingTypes}</div>
                                </div>
                              )}

                              {sections.technicalBreakdown && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-green-700">📸 Technical Breakdown</h4>
                                  <div className="text-sm whitespace-pre-line bg-green-50 p-3 rounded-lg">{sections.technicalBreakdown}</div>
                                </div>
                              )}

                              {sections.castingMatch && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-indigo-700">🧠 Casting Match & Branding</h4>
                                  <div className="text-sm whitespace-pre-line bg-indigo-50 p-3 rounded-lg">{sections.castingMatch}</div>
                                </div>
                              )}

                              {sections.redFlags && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    🚫 Red Flags
                                  </h4>
                                  <div className="text-sm whitespace-pre-line bg-red-50 p-3 rounded-lg">{sections.redFlags}</div>
                                </div>
                              )}

                              {sections.suggestions && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    ✅ Fixes & Suggestions
                                  </h4>
                                  <div className="text-sm whitespace-pre-line bg-green-50 p-3 rounded-lg">{sections.suggestions}</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {analysisResult.improvement_suggestions && analysisResult.improvement_suggestions.length > 0 && (
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Action Items
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.improvement_suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Red Flags */}
                    {analysisResult.red_flags && analysisResult.red_flags.length > 0 && (
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-semibold flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Issues to Address
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.red_flags.map((flag: string, index: number) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <label className="cursor-pointer text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Click to upload your headshot</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP (max 5MB)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {!user && (
            <div className="text-center space-y-3 py-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Please sign in to use the professional headshot evaluator.
              </p>
              <Button asChild variant="default">
                <Link to="/auth">Sign In / Sign Up</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
