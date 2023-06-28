import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Counting App</h1>
      {count}
      <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
    </div>
  );
}
