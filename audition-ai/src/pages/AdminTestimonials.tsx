import React from 'react';
import Navigation from '@/components/Navigation';
import AdminTestimonialsManager from '@/components/admin/AdminTestimonialsManager';
import ProtectedRoute from '@/components/ProtectedRoute';

const AdminTestimonials = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            <AdminTestimonialsManager />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminTestimonials;