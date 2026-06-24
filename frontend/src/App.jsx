import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/listings"       element={<Browse />} />
        <Route path="/listings/:id"   element={<ListingDetail />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/dashboard/new"  element={<CreateListing />} />
        <Route path="*"               element={<Home />} />
      </Routes>
    </>
  );
}
