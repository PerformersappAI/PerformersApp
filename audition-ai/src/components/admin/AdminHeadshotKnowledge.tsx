import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminHeadshotKnowledge = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Headshot Knowledge Base</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Admin interface for managing headshot evaluation knowledge base coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHeadshotKnowledge;