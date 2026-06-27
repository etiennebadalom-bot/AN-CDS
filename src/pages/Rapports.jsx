import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Printer, BarChart3 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, MOIS } from '../utils/storage';
import * as XLSX from 'xlsx';

export default function Rapports() {
  const { employes, livraisons, depenses, avances, presences } = useApp();
  const [moisSel, setMoisSel] = useState(new Date().getMonth());
  const [type, setType] = useState('mensuel');

  const statsParMois = useMemo(() => {
    return MOIS.map((nom, idx) => {
      const livMois = livraisons.filter(l => l.date && new Date(l.date).getMonth() === idx);
      const depMois = depenses.filter(d => d.date && new Date(d.date).getMonth() === idx);
      return {
        name: nom.slice(0, 3),
        friable: livMois.filter(l => l.typeGomme === 'Friable').reduce((s, l) => s + (l.quantite || 0), 0),
        karaya: livMois.filter(l => l.typeGomme === 'Karaya').reduce((s, l) => s + (l.quantite || 0), 0),
        valeur: livMois.reduce((s, l) => s + (l.montantTotal || 0), 0),
        depenses: depMois.reduce((s, d) => s + (d.montant || 0), 0),
      };
    });
  }, [livraisons, depenses]);

  const reportMois = useMemo(() => {
    const livMois = livraisons.filter(l => l.date && new Date(l.date).getMonth() === moisSel);
    const depMois = depenses.filter(d => d.date && new Date(d.date).getMonth() === moisSel);
    const friable = livMois.filter(l => l.typeGomme === 'Friable');
    const karaya = livMois.filter(l => l.typeGomme === 'Karaya');
    const collecteursMap = {};
    livMois.forEach(l => {
      if (!collecteursMap[l.collecteur]) collecteursMap[l.collecteur] = { count: 0, kg: 0, val: 0, reste: 0 };
      collecteursMap[l.collecteur].count++;
      collecteursMap[l.collecteur].kg += l.quantite || 0;
      collecteursMap[l.collecteur].val += l.montantTotal || 0;
      collecteursMap[l.collecteur].reste += l.resteAPayer || 0;
    });
    const catMap = {};
    depMois.forEach(d => {
      if (!catMap[d.categorie]) catMap[d.categorie] = 0;
      catMap[d.categorie] += d.montant || 0;
    });
    return {
      livraisons: livMois,
      depenses: depMois,
      kgFriable: friable.reduce((s, l) => s + (l.quantite || 0), 0),
      kgKaraya: karaya.reduce((s, l) => s + (l.quantite || 0), 0),
      valFriable: friable.reduce((s, l) => s + (l.montantTotal || 0), 0),
      valKaraya: karaya.reduce((s, l) => s + (l.montantTotal || 0), 0),
      dettes: livMois.reduce((s, l) => s + (l.resteAPayer || 0), 0),
      totalDep: depMois.reduce((s, d) => s + (d.montant || 0), 0),
      collecteurs: Object.entries(collecteursMap).sort((a, b) => b[1].kg - a[1].kg),
      categories: Object.entries(catMap).sort((a, b) => b[1] - a[1]),
    };
  }, [livraisons, depenses, moisSel]);

  const totalEmployes = employes.friable_femmes.length + employes.friable_garcons.length +
    employes.karaya_femmes.length + employes.karaya_garcons.length;

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Tableau de bord
    const dashData = [
      ['RAPPORT ANNUEL 2026 — GESTION GOMME ARABIQUE'],
      [],
      ['INDICATEURS CLÉS'],
      ['Total Employés', totalEmployes],
      ['Total Collecteurs', employes.collecteurs.length],
      ['Stock Friable (kg)', livraisons.filter(l => l.typeGomme === 'Friable').reduce((s, l) => s + (l.quantite || 0), 0)],
      ['Stock Karaya (kg)', livraisons.filter(l => l.typeGomme === 'Karaya').reduce((s, l) => s + (l.quantite || 0), 0)],
      ['Valeur Stock Friable', livraisons.filter(l => l.typeGomme === 'Friable').reduce((s, l) => s + (l.montantTotal || 0), 0)],
      ['Valeur Stock Karaya', livraisons.filter(l => l.typeGomme === 'Karaya').reduce((s, l) => s + (l.montantTotal || 0), 0)],
      ['Dettes Collecteurs', livraisons.reduce((s, l) => s + (l.resteAPayer || 0), 0)],
      ['Dépenses Totales', depenses.reduce((s, d) => s + (d.montant || 0), 0)],
      [],
      ['DONNÉES MENSUELLES'],
      ['Mois', 'Friable (kg)', 'Karaya (kg)', 'Valeur (FCFA)', 'Dépenses (FCFA)'],
      ...statsParMois.map(m => [m.name, m.friable, m.karaya, m.valeur, m.depenses]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dashData), 'Tableau de Bord');

    // Livraisons
    if (livraisons.length > 0) {
      const livData = [
        ['N°', 'Date', 'Semaine', 'Collecteur', 'Type', 'Quantité (kg)', 'Prix/kg', 'Montant Total', 'Acompte', 'Reste à Payer', 'Statut'],
        ...livraisons.map((l, i) => [i + 1, l.date, l.semaine, l.collecteur, l.typeGomme, l.quantite, l.prixKg, l.montantTotal, l.acomptePaye, l.resteAPayer, l.statut])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(livData), 'Livraisons');
    }

    // Dépenses
    if (depenses.length > 0) {
      const depData = [
        ['N°', 'Date', 'Semaine', 'Mois', 'Catégorie', 'Description', 'Magasin', 'Quantité', 'Prix Unit.', 'Montant'],
        ...depenses.map((d, i) => [i + 1, d.date, d.semaine, d.mois, d.categorie, d.description, d.magasin, d.quantite, d.prixUnit, d.montant])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(depData), 'Dépenses');
    }

    // Employés
    const empData = [
      ['Section', 'N°', 'Nom & Prénom', 'Rôle', 'Salaire/Jour', 'Téléphone', 'Statut'],
      ...(['friable_femmes', 'friable_garcons', 'karaya_femmes', 'karaya_garcons', 'collecteurs'].flatMap(s =>
        (employes[s] || []).map((e, i) => [s, i + 1, e.nom, e.role, e.salaireJour, e.telephone, e.statut])
      ))
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(empData), 'Employés');

    XLSX.writeFile(wb, `GGA_Rapport_2026_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {[{ k: 'mensuel', l: 'Rapport Mensuel' }, { k: 'annuel', l: 'Vue Annuelle' }].map(t => (
            <button key={t.k} onClick={() => setType(t.k)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${type === t.k ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.l}
            </button>
          ))}
        </div>
        {type === 'mensuel' && (
          <select value={moisSel} onChange={e => setMoisSel(Number(e.target.value))} className="form-select w-auto">
            {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary"><Printer size={16} /> Imprimer</button>
          <button onClick={exportExcel} className="btn-primary"><Download size={16} /> Export Excel</button>
        </div>
      </div>

      {type === 'annuel' ? (
        /* Vue annuelle */
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Livraisons par Mois (kg)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statsParMois} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="friable" fill="#22c55e" name="Friable (kg)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="karaya" fill="#f97316" name="Karaya (kg)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Valeur & Dépenses par Mois (FCFA)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statsParMois} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="valeur" fill="#6366f1" name="Valeur stock" radius={[3, 3, 0, 0]} />
                <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Récapitulatif par Mois</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Friable (kg)</th>
                    <th>Karaya (kg)</th>
                    <th>Valeur Stock</th>
                    <th>Dépenses</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statsParMois.map((m, i) => (
                    <tr key={i} className={i === new Date().getMonth() ? 'bg-brand-50' : ''}>
                      <td className="font-medium">{MOIS[i]}</td>
                      <td className="text-green-700 font-mono">{m.friable.toFixed(1)}</td>
                      <td className="text-orange-700 font-mono">{m.karaya.toFixed(1)}</td>
                      <td>{formatCurrency(m.valeur)}</td>
                      <td className="text-red-600">{formatCurrency(m.depenses)}</td>
                      <td className={m.valeur - m.depenses >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                        {formatCurrency(m.valeur - m.depenses)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-3 py-2">TOTAL</td>
                    <td className="px-3 py-2 text-green-700">{statsParMois.reduce((s, m) => s + m.friable, 0).toFixed(1)}</td>
                    <td className="px-3 py-2 text-orange-700">{statsParMois.reduce((s, m) => s + m.karaya, 0).toFixed(1)}</td>
                    <td className="px-3 py-2">{formatCurrency(statsParMois.reduce((s, m) => s + m.valeur, 0))}</td>
                    <td className="px-3 py-2 text-red-600">{formatCurrency(statsParMois.reduce((s, m) => s + m.depenses, 0))}</td>
                    <td className="px-3 py-2 text-green-700">{formatCurrency(statsParMois.reduce((s, m) => s + m.valeur - m.depenses, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Rapport mensuel */
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Rapport — {MOIS[moisSel]} 2026</h2>
            <p className="text-sm text-gray-500 mb-5">Résumé complet des activités du mois</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Stock Friable" value={`${reportMois.kgFriable.toFixed(0)} kg`} sub={formatCurrency(reportMois.valFriable)} color="text-green-700" />
              <Stat label="Stock Karaya" value={`${reportMois.kgKaraya.toFixed(0)} kg`} sub={formatCurrency(reportMois.valKaraya)} color="text-orange-700" />
              <Stat label="Dettes Créées" value={formatCurrency(reportMois.dettes)} sub={`${reportMois.livraisons.filter(l => l.resteAPayer > 0).length} livraisons`} color="text-red-700" />
              <Stat label="Dépenses" value={formatCurrency(reportMois.totalDep)} sub={`${reportMois.depenses.length} entrées`} color="text-purple-700" />
            </div>
          </div>

          {/* Collecteurs du mois */}
          {reportMois.collecteurs.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Collecteurs ce mois</h3></div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Collecteur</th><th>Livraisons</th><th>Total kg</th><th>Valeur</th><th>Reste à Payer</th></tr></thead>
                  <tbody>
                    {reportMois.collecteurs.map(([nom, d]) => (
                      <tr key={nom}>
                        <td className="font-medium">{nom || '—'}</td>
                        <td className="text-center">{d.count}</td>
                        <td className="font-mono">{d.kg.toFixed(1)}</td>
                        <td>{formatCurrency(d.val)}</td>
                        <td className={d.reste > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>{formatCurrency(d.reste)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dépenses par catégorie */}
          {reportMois.categories.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Dépenses par Catégorie</h3></div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Catégorie</th><th>Montant</th><th>%</th></tr></thead>
                  <tbody>
                    {reportMois.categories.map(([cat, total]) => (
                      <tr key={cat}>
                        <td className="font-medium">{cat}</td>
                        <td className="font-semibold">{formatCurrency(total)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(total / reportMois.totalDep) * 100}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-10">{((total / reportMois.totalDep) * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
