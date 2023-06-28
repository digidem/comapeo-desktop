import { createRoot } from "react-dom/client";

import "./index.css";
import { App } from "./App";

// @ts-expect-error
const root = createRoot(document.getElementById("app"));

root.render(<App />);
