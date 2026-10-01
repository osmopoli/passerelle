import { Link } from '../lib/router.jsx';

export default function NotFoundPage({ message = "Cette page n'existe pas." }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold">Introuvable</h1>
      <p className="mt-2 text-slate-600">{message}</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Voir les annonces
      </Link>
    </div>
  );
}
