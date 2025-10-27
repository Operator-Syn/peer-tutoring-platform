import React from 'react';
import TutorApplicationForm from './components/TutorApplication/TutorApplicationForm';
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="App">
      <TutorApplicationForm />
    </div>
    </>
  )
}

export default App
