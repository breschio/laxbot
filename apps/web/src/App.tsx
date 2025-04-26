import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import Home from './pages/Home';
import Teams from './pages/Teams';
import Standings from './pages/Standings';
import Login from './pages/Login';

const App: React.FC = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Layout>
  </Router>
);

export default App;
