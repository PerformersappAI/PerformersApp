import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { useHelpMode } from "@/contexts/HelpModeContext";
import { HelpTooltip } from "@/components/ui/help-tooltip";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { enabled: helpEnabled, setEnabled: setHelpEnabled } = useHelpMode();

  const navigationItems = [
    { href: "/", label: "Home" },
    { href: "/analysis", label: "Scene Analysis" },
    { href: "/membership", label: "Membership" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  const actorsToolsItems = [
    { href: "/self-taping#headshot-grader", label: "Evaluate Headshot" },
    { href: "/approach", label: "Actors Approach" },
  ];

  const selfTapingItems = [
    { href: "/teleprompter", label: "Teleprompter" },
    { href: "https://preview--myauditionai.lovable.app/self-taping", label: "How to self tape", external: true },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const isActorsToolsActive = () => {
    return actorsToolsItems.some(item => isActiveRoute(item.href)) || 
           selfTapingItems.some(item => !item.external && isActiveRoute(item.href));
  };

  const isAboutGroupActive = () => {
    return isActiveRoute('/about') || isActiveRoute('/faq') || isActiveRoute('/podcast');
  };
  const initials = (user?.user_metadata?.full_name || user?.email || 'U')
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) { setAvatarUrl(null); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) setAvatarUrl(data.avatar_url || null);
    };
    fetchAvatar();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
      navigate("/");
    }
  };

  const handleLoginClick = () => {
    navigate("/auth", { state: { from: location } });
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  const handleJoinMembershipClick = () => {
    navigate("/membership");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) return false;
      return (data || []).some((r: { role: string }) => r.role === 'admin');
    },
    enabled: !!user,
  });

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/483b557f-6225-4fc8-953a-49e3200f8059.png" 
                  alt="MyAuditionAI.com Logo" 
                  className="h-10 w-10 object-contain"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  MyAuditionAI.com
                </span>
              </Link>
            </div>
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/483b557f-6225-4fc8-953a-49e3200f8059.png" 
                alt="MyAuditionAI.com Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                MyAuditionAI.com
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems
              .filter((item) => item.label !== "About" && item.label !== "FAQ")
              .map((item) => (
                item.label === "Scene Analysis" ? (
                  <HelpTooltip
                    key={item.href}
                    content="Upload a PDF or paste your script to get AI notes and character breakdowns."
                    side="bottom"
                  >
                    <Link
                      to={item.href}
                      className={`transition-colors ${
                        isActiveRoute(item.href)
                          ? "text-yellow-400"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </HelpTooltip>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`transition-colors ${
                      isActiveRoute(item.href)
                        ? "text-yellow-400"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}

            {/* About Dropdown (with FAQ and Podcast) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center space-x-1 transition-colors ${
                  isAboutGroupActive()
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-white"
                }`}>
                  <span>About</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
               <DropdownMenuContent className="min-w-[200px]">
                 <DropdownMenuItem asChild>
                   <Link
                     to="/about"
                     className={isActiveRoute('/about') ? 'text-primary bg-accent' : ''}
                   >
                     About
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link
                     to="/faq"
                     className={isActiveRoute('/faq') ? 'text-primary bg-accent' : ''}
                   >
                     FAQ
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link
                     to="/podcast"
                     className={isActiveRoute('/podcast') ? 'text-primary bg-accent' : ''}
                   >
                     Podcast
                   </Link>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center space-x-1 transition-colors hover:bg-white/10 px-3 py-2 rounded-md ${
                  isActorsToolsActive()
                    ? "text-yellow-400 bg-yellow-400/10"
                    : "text-gray-300 hover:text-white"
                }`}>
                  <span>Actors Tools</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border-border shadow-lg rounded-lg backdrop-blur-sm">
                  {/* Self Taping Submenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem className="cursor-pointer">
                        <span className="flex items-center justify-between w-full">
                          Self Taping
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" className="w-48">
                      {selfTapingItems.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          {item.external ? (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full block px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              {item.label}
                            </a>
                          ) : (
                            <Link
                              to={item.href}
                              className={`w-full block px-3 py-2 text-sm transition-colors ${isActiveRoute(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                            >
                              <HelpTooltip
                                content="Upload a PDF or paste your scene, then start self-taping."
                                side="right"
                              >
                                <span>{item.label}</span>
                              </HelpTooltip>
                            </Link>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Other Actors Tools */}
                  {actorsToolsItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        to={item.href}
                        className={`w-full block px-3 py-2 text-sm transition-colors ${isActiveRoute(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                      >
                        {item.label === "Evaluate Headshot" ? (
                          <HelpTooltip
                            content="Get AI-powered feedback on your headshots to improve your casting potential."
                            side="right"
                          >
                            <span>{item.label}</span>
                          </HelpTooltip>
                        ) : (
                          <span>{item.label}</span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin dropdown with multiple admin links */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center space-x-1 transition-colors hover:bg-white/10 px-3 py-2 rounded-md ${
                    isActiveRoute('/admin')
                      ? "text-yellow-400 bg-yellow-400/10"
                      : "text-gray-300 hover:text-white"
                  }`}>
                    <span>Admin</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border-border shadow-lg rounded-lg backdrop-blur-sm">
                   <DropdownMenuItem asChild>
                    <Link
                      to="/admin/scripts"
                      className={`w-full block px-3 py-2 text-sm transition-colors ${isActiveRoute('/admin/scripts') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                    >
                      Scripts Manager
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin/coaches"
                      className={`w-full block px-3 py-2 text-sm transition-colors ${isActiveRoute('/admin/coaches') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                    >
                      Coaches Manager
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin/photographers"
                      className={`w-full block px-3 py-2 text-sm transition-colors ${isActiveRoute('/admin/photographers') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                    >
                      Photographers Manager
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-gray-300">Help</span>
              <Switch
                checked={helpEnabled}
                onCheckedChange={(v) => setHelpEnabled(v)}
                aria-label="Toggle help mode"
              />
            </div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUrl ?? undefined} alt={user.user_metadata?.full_name || user.email || 'Profile'} />
                    <AvatarFallback>
                      {(user.user_metadata?.full_name || user.email || 'U')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border z-50">
                  <DropdownMenuItem className="text-foreground" onClick={handleDashboardClick}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem className="text-foreground" onClick={handleProfileClick}>Profile</DropdownMenuItem>
                  <DropdownMenuItem className="text-foreground" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="bg-white text-black hover:bg-black hover:text-white border border-gray-300" 
                  onClick={handleLoginClick}
                >
                  Sign In
                </Button>
                <Button 
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium h-8 px-3 text-xs" 
                  onClick={handleJoinMembershipClick}
                >
                  Join Membership
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-black/90 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveRoute(item.href)
                      ? "text-yellow-400 bg-gray-800/50"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {/* Self Taping items in mobile */}
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Self Taping</div>
              {selfTapingItems.map((item) => (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-6 py-2 rounded-md text-base font-medium transition-colors text-gray-300 hover:text-white hover:bg-gray-800/30"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-6 py-2 rounded-md text-base font-medium transition-colors ${
                      isActiveRoute(item.href)
                        ? "text-yellow-400 bg-gray-800/50"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              
              {/* Other Actors Tools items in mobile */}
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4">Actors Tools</div>
              {actorsToolsItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-6 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveRoute(item.href)
                      ? "text-yellow-400 bg-gray-800/50"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {/* Admin links in mobile */}
              {isAdmin && (
                <>
                   <Link
                    to="/admin/scripts"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActiveRoute("/admin/scripts")
                        ? "text-yellow-400 bg-gray-800/50"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    Scripts Manager
                  </Link>
                  <Link
                    to="/admin/coaches"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActiveRoute("/admin/coaches")
                        ? "text-yellow-400 bg-gray-800/50"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    Coaches Manager
                  </Link>
                  <Link
                    to="/admin/photographers"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActiveRoute("/admin/photographers")
                        ? "text-yellow-400 bg-gray-800/50"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                    }`}
                  >
                    Photographers Manager
                  </Link>
                </>
              )}
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-gray-300">Help</span>
                <Switch checked={helpEnabled} onCheckedChange={(v)=> setHelpEnabled(v)} aria-label="Toggle help mode" />
              </div>
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveRoute("/profile")
                      ? "text-yellow-400 bg-gray-800/50"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                  }`}
                >
                  {user.user_metadata?.full_name || user.email}
                </Link>
              )}
              <div className="pt-4 pb-3 border-t border-gray-800 space-y-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-gray-300 text-sm">
                      Signed in as: {user.user_metadata?.full_name || user.email}
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full bg-white text-black hover:bg-black hover:text-white justify-start border border-gray-300" 
                      onClick={() => {
                        handleDashboardClick();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full bg-white text-black hover:bg-black hover:text-white justify-start border border-gray-300" 
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full bg-white text-black hover:bg-black hover:text-white justify-start border border-gray-300" 
                      onClick={() => {
                        handleLoginClick();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" 
                      onClick={() => {
                        handleJoinMembershipClick();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Join Membership
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
