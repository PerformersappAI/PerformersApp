import { Link } from "react-router-dom";

const Footer = () => {
  const footerLinks = [
    { href: "/faq", label: "FAQ" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/cookies", label: "Cookie Preferences" },
    { href: "/contact", label: "Contact Us" },
    { href: "/legal", label: "Legal Notices" },
    { href: "/privacy", label: "Privacy Policy" },
  ];

  return (
    <footer className="bg-background border-t border-border py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Footer Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Copyright */}
          <div className="text-muted-foreground text-sm">
            Copyright © 2025 MyAuditionAI.com
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;