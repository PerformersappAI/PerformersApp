
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminCoachesManager from "@/components/admin/AdminCoachesManager";

const AdminCoaches = () => {
  useEffect(() => {
    document.title = "Admin Coaches Manager | MyAuditionAI";

    const descContent = "Admin page to manage coaches, add new coaches, and edit existing coach profiles.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = descContent;

    const href = `${window.location.origin}/admin/coaches`;
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
              <h1 className="text-3xl font-bold">Admin: Coaches Manager</h1>
              <p className="text-gray-400 mt-2">Manage all coaches on the platform.</p>
            </header>

            <section aria-label="Admin coaches tools">
              <AdminCoachesManager />
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminCoaches;
