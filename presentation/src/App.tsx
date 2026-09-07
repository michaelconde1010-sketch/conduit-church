import { useEffect, useState } from 'react'
import { OperatorView } from './components/operator/OperatorView'
import { OutputWindow } from './components/output/OutputWindow'

function getRoute() {
  return window.location.hash
}

export default function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const handler = () => setRoute(getRoute())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  if (route === '#/output') return <OutputWindow />
  return <OperatorView />
}
