import React from 'react'
import ReactDOM from 'react-dom/client'
import Scroller from './Scroller'

// Create a container for our extension
const rootElement = document.createElement('div');
rootElement.id = "simple-drag-scroller-root";

// Attach it to the body
document.body.appendChild(rootElement);

// Create React Root
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Scroller />
  </React.StrictMode>,
)