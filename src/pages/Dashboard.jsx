import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  Package, Users, TrendingUp, AlertTriangle, CreditCard,
  Receipt, ArrowUpRight, ArrowDownRight, Leaf, Activity
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, MOIS } from '../utils/storage';

function KpiCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

const COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7'];

export default function Dashboard() {
  const { employes, livraisons, depenses, getStatsGlobales } = useApp();
  const stats = getStatsGlobales();

  const totalEmployes = useMemo(() =>
    employes.friable_femmes.length + employes.friable_garcons.length +
    employes.karaya_femmes.length + employes.karaya_garcons.length,
    [employes]
  );

  const depensesMois = useMemo(() => {
    return MOIS.map((nom, idx) => {
      const total = depenses
        .filter(d => d.date && new Date(d.date).getMonth() === idx)
        .reduce((s, d) => s + (d.montant || 0), 0);
      return { name: nom.slice(0, 3), total };
    });
  }, [depenses]);

  const livraisonsSemaine = useMemo(() => {
    const byWeek = {};
    livraisons.forEach(l => {
      const w = `S${String(l.semaine || 0).padStart(2, '0')}`;
      if (!byWeek[w]) byWeek[w] = { name: w, friable: 0, karaya: 0 };
      if (l.typeGomme === 'Friable') byWeek[w].friable += l.quantite || 0;
      if (l.typeGomme === 'Karaya') byWeek[w].karaya += l.quantite || 0;
    });
    return Object.values(byWeek).sort((a, b) => a.name.localeCompare(b.name)).slice(-12);
  }, [livraisons]);

  const pieData = [
    { name: 'Friable (kg)', value: stats.totalFriable },
    { name: 'Karaya (kg)', value: stats.totalKaraya },
  ].filter(d => d.value > 0);

  const collecteursAvecDettes = livraisons.filter(l => l.resteAPayer > 0);
  const dettesParCollecteur = useMemo(() => {
    const map = {};
    collecteursAvecDettes.forEach(l => {
      if (!map[l.collecteur]) map[l.collecteur] = 0;
      map[l.collecteur] += l.resteAPayer;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [collecteursAvecDettes]);

  const dernieresLivraisons = livraisons.slice(0, 5);
  const dernieresDepenses = depenses.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Stock Friable"
          value={`${stats.totalFriable.toFixed(0)} kg`}
          sub={`Valeur: ${formatCurrency(stats.valeurFriable)}`}
          icon={Leaf}
          color="bg-green-500"
        />
        <KpiCard
          label="Stock Karaya"
          value={`${stats.totalKaraya.toFixed(0)} kg`}
          sub={`Valeur: ${formatCurrency(stats.valeurKaraya)}`}
          icon={Package}
          color="bg-orange-500"
        />
        <KpiCard
          label="Dettes Collecteurs"
          value={formatCurrency(stats.dettesTotal)}
          sub={`${collecteursAvecDettes.length} livraisons impayées`}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <KpiCard
          label="Dépenses Annuelles"
          value={formatCurrency(stats.depensesTotal)}
          sub={`${depenses.length} entrées`}
          icon={Receipt}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Employés"
          value={totalEmployes}
          sub={`${employes.collecteurs.length} collecteurs`}
          icon={Users}
          color="bg-blue-500"
        />
        <KpiCard
          label="Total Livraisons"
          value={`${stats.totalDelivres.toFixed(0)} kg`}
          sub={`${livraisons.length} livraisons`}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <KpiCard
          label="Valeur Totale Stock"
          value={formatCurrency(stats.valeurFriable + stats.valeurKaraya)}
          sub="Friable + Karaya"
          icon={CreditCard}
          color="bg-indigo-500"
        />
        <KpiCard
          label="Balance"
          value={formatCurrency(stats.valeurFriable + stats.valeurKaraya - stats.depensesTotal)}
          sub="Valeur stock − Dépenses"
          icon={Activity}
          color={(stats.valeurFriable + stats.valeurKaraya - stats.depensesTotal) >= 0 ? 'bg-teal-500' : 'bg-rose-500'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Livraisons par semaine */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Livraisons par Semaine (kg)</h3>
          {livraisonsSemaine.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={livraisonsSemaine} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} kg`]} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="friable" fill="#22c55e" name="Friable" radius={[3, 3, 0, 0]} />
                <Bar dataKey="karaya" fill="#f97316" name="Karaya" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Ajoutez des livraisons pour voir le graphique" />
          )}
        </div>

        {/* Répartition stock */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Répartition Stock</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v.toFixed(0)} kg`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Aucune livraison enregistrée" />
          )}
        </div>
      </div>

      {/* Dépenses par mois */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Dépenses par Mois (FCFA)</h3>
        {depenses.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={depensesMois} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [formatCurrency(v)]} />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Dépenses" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Ajoutez des dépenses pour voir la courbe" />
        )}
      </div>

      {/* Tables rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières livraisons */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Dernières Livraisons</h3>
          </div>
          {dernieresLivraisons.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {dernieresLivraisons.map(l => (
                <div key={l.id} className="flex items-center px-5 py-3 gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.typeGomme === 'Friable' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{l.collecteur || '—'}</div>
                    <div className="text-xs text-gray-500">{l.typeGomme} · {l.quantite} kg</div>
                  </div>
                  <span className={`badge-${(l.statut || 'apayer').toLowerCase().replace(' ', '').replace('à', 'a')}`}>
                    {l.statut || 'À PAYER'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Aucune livraison enregistrée</p>
          )}
        </div>

        {/* Top dettes collecteurs */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Dettes Collecteurs (Top 5)</h3>
          </div>
          {dettesParCollecteur.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {dettesParCollecteur.map(([nom, dette]) => (
                <div key={nom} className="flex items-center px-5 py-3 gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
                    {nom?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{nom}</div>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${Math.min(100, (dette / stats.dettesTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-600 text-right">
                    {formatCurrency(dette)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Aucune dette collecteur</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
