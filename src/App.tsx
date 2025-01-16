import './App.css'
import MonacoEditor from './components/MonacoEditor'

function App() {

  return (
    <>
      <MonacoEditor width='100vw' height='50vh' value="import numpy as np\nprint('Hello world 1!')" />
      <MonacoEditor width='100vw' height='50vh' value="import sys as s\nprint('Hello world 2!')" />
    </>
  )
}

export default App
