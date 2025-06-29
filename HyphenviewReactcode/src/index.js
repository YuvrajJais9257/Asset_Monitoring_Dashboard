import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import thunk from 'redux-thunk';
import App from './App';
import { applyMiddleware, compose, legacy_createStore } from 'redux';
import { Provider } from 'react-redux';
import reducers from './reducers';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';


const root = ReactDOM.createRoot(document.getElementById('root'));
const store = legacy_createStore(reducers, compose(applyMiddleware(thunk)));

root.render(
  <Provider store={store}>
  <Router>
    <App/>
  </Router>
  </Provider>
);

reportWebVitals();
