
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminScriptsManager from "@/components/admin/AdminScriptsManager";

const AdminScripts = () => {
  // Basic SEO for this page
  useEffect(() => {
    document.title = "Admin Scripts Manager | MyAuditionAI";

    // Meta description
    const descContent = "Admin page to view, filter, trash, restore, and permanently delete scripts.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = descContent;

    // Canonical tag
    const href = `${window.location.origin}/admin/scripts`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = href;
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <header>
              <h1 className="text-3xl font-bold">Admin: Scripts Manager</h1>
              <p className="text-gray-400 mt-2">Manage all scripts across the platform.</p>
            </header>

            <section aria-label="Admin scripts tools">
              <AdminScriptsManager />
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminScripts;
