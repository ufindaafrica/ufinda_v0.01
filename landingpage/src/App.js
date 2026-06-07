import React from 'react';
import LandingPage from './pages/landingPage'
import ResetPassword from './pages/resetPassword'
import Navbar from './components/shared/navbar'
import DownloadPage from "./pages/downloadPage"
import NotFound from './pages/notFound'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />}/>
          <Route path="/download" element={<DownloadPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
