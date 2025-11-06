import React from 'react';
import LandingPage from './pages/landingPage'
import ResetPassword from './pages/resetPassword'
import Navbar from './components/shared/navbar'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

function App () {
  return (
    <Router>
        <div className="App">
            <Navbar />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
        </div>
    </Router>
  )
}

export default App