import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import ComponentsPage from '@/pages/Components';
import Home from '@/pages/Home';
import Schedule from '@/pages/Schedule';
import Rankings from '@/pages/RankingsPage';

const App: React.FC = () => (
  <Router>
    <Layout>
      <Routes>
        {/* All pages now use the same consistent shadcn UI layout */}
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/components" element={<ComponentsPage />} />
        
        {/* Redirect any other paths to the home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  </Router>
);

export default App;
