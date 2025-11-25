/**
 * System Settings Page
 * Advanced system settings
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Trash2, Download } from 'lucide-react';

export default function SystemSettingsPage() {
  const handleExportData = () => {
    // Export user data
    console.log('Exporting user data...');
  };

  const handleImportData = () => {
    // Import user data
    console.log('Importing user data...');
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all app data? This action cannot be undone.')) {
      console.log('Clearing all data...');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export, import, or clear your app data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={handleImportData} variant="outline">
              Import Data
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Clear All Data</h4>
                <p className="text-xs text-muted-foreground">
                  This will remove all your data including settings, cache, and preferences
                </p>
              </div>
              <Button 
                onClick={handleClearAllData} 
                variant="destructive" 
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
          <CardDescription>
            Version and system information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Version</span>
            <Badge variant="outline">0.1.0</Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium">Build</span>
            <Badge variant="outline">Development</Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium">Environment</span>
            <Badge variant="outline">Web</Badge>
          </div>
          
          <div className="pt-3 border-t">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This is a Progressive Web App (PWA). You can install it on your device 
                for offline access and improved performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}