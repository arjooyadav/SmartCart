import axios from "axios";
import { API_BASE } from "./config";

const API = axios.create({ baseURL: API_BASE });
delete API.defaults.headers.common["Authorization"];
export default API;
