import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { checkSupabaseConnection } from '@/lib/supabaseStatus';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

const Home: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    success?: boolean;
    error?: string;
  }>({
    checked: false
  });

  useEffect(() => {
    // Check Supabase connection on component mount
    async function runConnectionCheck() {
      try {
        const result = await checkSupabaseConnection();
        setConnectionStatus({
          checked: true,
          success: result.success,
          error: result.success ? undefined : String(result.error)
        });
      } catch (err) {
        setConnectionStatus({
          checked: true,
          success: false,
          error: String(err)
        });
      }
    }
    
    runConnectionCheck();
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Welcome to Laxbot</h1>
      
      {connectionStatus.checked && (
        <div className="mb-6">
          {connectionStatus.success ? (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/30">
              <AlertTitle className="text-green-800 dark:text-green-400">Connected to Supabase</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-500">
                Successfully connected to the Supabase database.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30">
              <AlertTitle className="text-red-800 dark:text-red-400">Connection Error</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-500">
                {connectionStatus.error || "Failed to connect to Supabase."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Live Scores & Schedule</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Get real-time scores and schedule updates for all lacrosse games.</p>
            <Button asChild>
              <Link to="/schedule">View Schedule</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Team Rankings</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">See the latest team rankings and statistics.</p>
            <Button asChild>
              <Link to="/standings">View Standings</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Component Library</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Browse the Laxbot UI component library.</p>
            <Button asChild>
              <Link to="/components">View Components</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Home; 