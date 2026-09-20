import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import Advisor from './pages/Advisor';
import Consulting from './pages/Consulting';
import ProfileOnboarding from './components/ProfileOnboarding';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/listings"       element={<Browse />} />
        <Route path="/listings/:id"   element={<ListingDetail />} />
        <Route path="/advisor"        element={<Advisor />} />
        <Route path="/consulting"     element={<Consulting />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/dashboard/new"  element={<CreateListing />} />
        <Route path="*"               element={<Home />} />
      </Routes>
      {!loading && user?.profile_completed === false && <ProfileOnboarding />}
    </>
  );
}
