import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import Advisor from './pages/Advisor';
import Consulting from './pages/Consulting';
import Profile from './pages/Profile';
import ProfileOnboarding from './components/ProfileOnboarding';

import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import CreateBlogPost from './pages/CreateBlogPost';

import { useAuth } from './context/AuthContext';
import { pingBackend } from './api';

export default function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Warm up Render backend immediately upon initial app mount
    pingBackend();
  }, []);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Browse />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/advisor" element={<Advisor />} />
        <Route path="/consulting" element={<Consulting />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/new" element={<CreateListing />} />
        <Route path="/profile" element={<Profile />} />

        {/* Blog Routes */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/create" element={<CreateBlogPost />} />
        <Route path="/blog/:id/edit" element={<CreateBlogPost />} />
        <Route path="/blog/:id" element={<BlogPost />} />

        <Route path="*" element={<Home />} />
      </Routes>

      {!loading && user?.profile_completed === false && <ProfileOnboarding />}

      <Footer />
    </>
  );
}