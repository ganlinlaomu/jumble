/**
 * General Settings Page
 * Basic app settings
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GeneralSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Basic application settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          General settings will be implemented here. This includes language, region, 
          and other basic preferences.
        </p>
      </CardContent>
    </Card>
  );
}