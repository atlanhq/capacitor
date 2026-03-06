import {Component} from "react";

let URL = '';
if (typeof window !== 'undefined') {
  let protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  URL = protocol + '://' + window.location.hostname;

  let port = window.location.port
  // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  //   port = 9000
  // }
  if (port && port !== '') {
    URL = URL + ':' + port
  }
}

// ATLAN PATCH: Prefix the WebSocket path with the sub-path base.
// import.meta.env.BASE_URL is set by Vite from the `base` config option at build time.
// Trailing slash stripped so the path stays clean: /api/capacitor + /ws/ = /api/capacitor/ws/
// Kong strip-path:true then strips /api/capacitor before forwarding to Go server's /ws/ handler.
const WS_BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default class StreamingBackend extends Component {
  componentDidMount() {
    console.log("Connecting to " + URL + WS_BASE + '/ws/')

    this.ws = new WebSocket(URL + WS_BASE + '/ws/');
    this.ws.onopen = this.onOpen;
    this.ws.onmessage = this.onMessage;
    this.ws.onclose = this.onClose;

    this.onClose = this.onClose.bind(this);
  }

  render() {
    return null;
  }

  onOpen = () => {
    console.log('connected');
  };

  onClose = (evt) => {
    console.log('disconnected: ' + evt.code + ': ' + evt.reason);
    const ws = new WebSocket(URL + WS_BASE + '/ws/');
    ws.onopen = this.onOpen;
    ws.onmessage = this.onMessage;
    ws.onclose = this.onClose;
    this.setState({
      ws
    });
  }

  onMessage = (evt) => {
    evt.data.split('\n').forEach((line) => {
      const message = JSON.parse(line);
      this.props.store.dispatch(message);
    });
  }
}
