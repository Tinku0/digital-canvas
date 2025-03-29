import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import DigitalArtCanvas from './pages/DigitalCanvas';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DigitalArtCanvas />} />
        <Route path="/digital-canvas" element={<DigitalArtCanvas />} />
      </Routes>
    </Router>
  )
}

export default App
