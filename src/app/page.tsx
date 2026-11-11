import { config } from "@/lib/config";

export default function Home() {
  return (
    <main className="narrow stack">
      <h1>Buscador de servicios</h1>
      <p>
        Estamos armando una app que conecta a vecinos de {config.cityName} con plomeros, electricistas, mecánicos y
        otros oficios de la zona.
      </p>
      <p className="muted">
        <a href="/privacidad">Aviso de privacidad</a>
      </p>
    </main>
  );
}
