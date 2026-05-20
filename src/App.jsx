import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import InputGame from './pages/InputGame'
import Predict from './pages/Predict'
import Analysis from './pages/Analysis'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/input" element={<InputGame />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/analysis" element={<Analysis />} />
      </Route>
    </Routes>
  )
}

export default App
