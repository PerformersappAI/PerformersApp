
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const { signIn, signUp, resetPassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message === 'Invalid login credentials' 
          ? "Invalid email or password. Please check your credentials and try again."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      // Navigation will happen automatically due to useEffect above
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account, then you can sign in.",
      });
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await resetPassword(email);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password reset sent!",
        description: "Check your email for password reset instructions.",
      });
      setForgotPassword(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">
              {forgotPassword ? 'Reset Password' : 'Welcome to MyAuditionAI.com'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {forgotPassword 
                ? 'Enter your email to receive password reset instructions'
                : 'Sign in to your account or create a new one'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {forgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white focus:border-yellow-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  onClick={() => setForgotPassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="signin" className="text-white data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-white data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="signin-email" className="text-white">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white focus:border-yellow-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signin-password" className="text-white">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white focus:border-yellow-500 pr-10"
                          placeholder="Enter your password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                    <Button 
                      type="button"
                      variant="ghost"
                      className="w-full text-gray-400 hover:text-white"
                      onClick={() => setForgotPassword(true)}
                    >
                      Forgot your password?
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-fullname" className="text-white">Full Name</Label>
                      <Input
                        id="signup-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white focus:border-yellow-500"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email" className="text-white">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white focus:border-yellow-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password" className="text-white">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white focus:border-yellow-500 pr-10"
                          placeholder="Create a password (min. 6 characters)"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
