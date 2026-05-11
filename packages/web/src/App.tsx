import { Event } from "@eventflow/shared";
import { useState, useEffect } from "react";

import { API_URL } from "./config";

function App(): JSX.Element {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to fetch events:", err));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>EventFlow</h1>
      <h2>Events</h2>
      {events.length === 0 ? (
        <p>Loading events...</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.name}</strong> - {event.date}
              {event.description && <p>{event.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
