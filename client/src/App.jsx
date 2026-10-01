import { useEffect, useState } from 'react';

export default function App() {
  const [api, setApi] = useState('chargement…');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setApi(data.status))
      .catch(() => setApi('injoignable'));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow text-center">
        <h1 className="text-3xl font-bold text-emerald-700">PASSERELLE</h1>
        <p className="mt-3 text-slate-600">
          Proposez ou trouvez un objet, un service ou un coup de main près de chez vous.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          API : <span className={api === 'ok' ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{api}</span>
        </p>
      </div>
    </main>
  );
}
