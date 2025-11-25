/**
 * Main Settings Page
 * Contains all app settings including offline settings
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettingsPage } from './GeneralSettingsPage';
import { AppearanceSettingsPage } from './AppearanceSettingsPage';
import { OfflineSettings } from '@/components/settings/OfflineSettings';
import { SystemSettingsPage } from './SystemSettingsPage';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app preferences and offline settings
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsPage />
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSettingsPage />
        </TabsContent>
        
        <TabsContent value="offline" className="space-y-4">
          <OfflineSettings />
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <SystemSettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}