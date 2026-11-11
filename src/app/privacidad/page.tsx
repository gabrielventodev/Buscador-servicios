import { CONSENT_VERSION, config } from "@/lib/config";

export const metadata = { title: "Aviso de privacidad · Buscador de servicios" };

export default function Privacidad() {
  const contact = process.env.PRIVACY_CONTACT || "[completar: correo de contacto]";
  return (
    <main className="narrow stack">
      <h1>Aviso de privacidad</h1>
      <p className="muted">Versión {CONSENT_VERSION}</p>
      <p>
        <strong>Responsable:</strong> {config.senderName}, {config.cityName}, Buenos Aires. Contacto: {contact}.
      </p>
      <p>
        <strong>Qué datos guardamos de los prestadores:</strong> nombre, oficio, zona de trabajo y número de WhatsApp.
      </p>
      <p>
        <strong>Para qué:</strong> enviarte por WhatsApp pedidos de trabajo de vecinos de la zona y pedirte presupuesto.
        No vendemos ni cedemos tus datos a terceros ni los usamos para publicidad de otros.
      </p>
      <p>
        <strong>Tus derechos:</strong> podés pedir acceso, corrección o eliminación de tus datos, o dejar de recibir
        pedidos, en cualquier momento escribiendo al contacto de arriba. El acceso es gratuito cada seis meses, salvo
        interés legítimo (Ley 25.326, arts. 14 a 16).
      </p>
      <p>
        La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y
        reclamos de quienes resulten afectados en sus derechos por incumplimiento de las normas de protección de datos
        personales.
      </p>
    </main>
  );
}
