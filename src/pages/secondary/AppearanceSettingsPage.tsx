/**
 * Appearance Settings Page
 * Theme and appearance settings
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/providers/ThemeProvider';

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose the appearance theme for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border ${
                theme === 'light' ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="text-sm font-medium">Light</div>
              <div className="text-xs text-muted-foreground">Bright theme</div>
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="text-sm font-medium">Dark</div>
              <div className="text-xs text-muted-foreground">Dark theme</div>
            </button>
            
            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-lg border ${
                theme === 'system' ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="text-sm font-medium">System</div>
              <div className="text-xs text-muted-foreground">Follow system</div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font Size</CardTitle>
          <CardDescription>
            Adjust the font size for better readability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Font size settings will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}