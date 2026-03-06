import axios from 'axios';

// ATLAN PATCH: Vite sets import.meta.env.BASE_URL from the `base` config option.
// When built with VITE_BASE_PATH=/api/capacitor/, BASE_URL = '/api/capacitor/'.
// Stripping the trailing slash gives the prefix for all API calls.
// e.g. /api/fluxState → /api/capacitor/api/fluxState
// Kong then strips /api/capacitor before forwarding to the Go server, which sees /api/fluxState.
const API_BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default class CapacitorClient {
  constructor(onError) {
    this.onError = onError
  }

  URL = () => this.url;

  getFluxState = () => this.get(`${API_BASE}/api/fluxState`);

  getFluxEvents = () => this.get(`${API_BASE}/api/fluxEvents`);

  getServices = () => this.get(`${API_BASE}/api/services`);

  describeConfigmap = (namespace, name) => this.get(`${API_BASE}/api/describeConfigmap?namespace=${namespace}&name=${name}`);

  describeSecret = (namespace, name) => this.get(`${API_BASE}/api/describeSecret?namespace=${namespace}&name=${name}`);

  describeDeployment = (namespace, name) => this.get(`${API_BASE}/api/describeDeployment?namespace=${namespace}&name=${name}`);

  describePod = (namespace, name) => this.get(`${API_BASE}/api/describePod?namespace=${namespace}&name=${name}`);

  podLogsRequest = (namespace, deployment) => this.get(`${API_BASE}/api/logs?namespace=${namespace}&deploymentName=${deployment}`);

  stopPodLogsRequest = (namespace, deployment) => this.get(`${API_BASE}/api/stopLogs?namespace=${namespace}&deploymentName=${deployment}`);

  suspend = (resource, namespace, name) => this.post(`${API_BASE}/api/suspend?resource=${resource}&namespace=${namespace}&name=${name}`);

  resume = (resource, namespace, name) => this.post(`${API_BASE}/api/resume?resource=${resource}&namespace=${namespace}&name=${name}`);

  reconcile = (resource, namespace, name) => this.post(`${API_BASE}/api/reconcile?resource=${resource}&namespace=${namespace}&name=${name}`);

  get = async (path) => {
    try {
      const { data } = await axios.get(path, {
        credentials: 'include'
      });
      return data;
    } catch (error) {
      this.onError(error.response);
      throw error.response;
    }
  }

  post = async (path, body) => {
    try {
      const { data } = await axios
        .post(path, body, {
          credentials: 'include',
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
      return data;
    } catch (error) {
      this.onError(error.response);
      throw error.response;
    }
  }

}
