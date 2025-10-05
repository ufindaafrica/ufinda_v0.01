import React from 'react';
import LandingPage from './pages/landingPage'
import Navbar from './components/shared/navbar'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

function App () {
  return (
    <Router>
        <div className="App">
            <Navbar />
            <Routes>
                <Route path="/" element={<LandingPage />} />
            </Routes>
        </div>
    </Router>
  )
}

export default App