import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import { formatDate, formatCurrency, TYPES_GOMME, STATUTS_PAIEMENT, getWeekNumber } from '../utils/storage';

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  semaine: getWeekNumber(),
  collecteur: '',
  typeGomme: 'Friable',
  quantite: '',
  prixKg: '',
  acomptePaye: '',
  datePaiement: '',
  statut: 'À PAYER',
  observations: '',
};

const STATUT_STYLES = {
  'À PAYER': { cls: 'bg-red-100 text-red-700', icon: <Clock size={12} /> },
  'PARTIELLEMENT PAYÉ': { cls: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle size={12} /> },
  'PAYÉ': { cls: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
};

export default function Collecteurs() {
  const { employes, livraisons, addLivraison, updateLivraison, deleteLivraison } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('livraisons');

  const collecteursNoms = employes.collecteurs.map(c => c.nom).filter(Boolean);

  const filtered = useMemo(() => livraisons.filter(l =>
    (!search || l.collecteur?.toLowerCase().includes(search.toLowerCase()) || l.observations?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterType || l.typeGomme === filterType) &&
    (!filterStatut || l.statut === filterStatut)
  ), [livraisons, search, filterType, filterStatut]);

  const dettes = useMemo(() => {
    const map = {};
    livraisons.filter(l => (l.resteAPayer || 0) > 0).forEach(l => {
      if (!map[l.collecteur]) map[l.collecteur] = { nom: l.collecteur, total: 0, count: 0 };
      map[l.collecteur].total += l.resteAPayer || 0;
      map[l.collecteur].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [livraisons]);

  const statsType = useMemo(() => {
    const f = livraisons.filter(l => l.typeGomme === 'Friable');
    const k = livraisons.filter(l => l.typeGomme === 'Karaya');
    return {
      friable: { kg: f.reduce((s, l) => s + (l.quantite || 0), 0), val: f.reduce((s, l) => s + (l.montantTotal || 0), 0) },
      karaya: { kg: k.reduce((s, l) => s + (l.quantite || 0), 0), val: k.reduce((s, l) => s + (l.montantTotal || 0), 0) },
    };
  }, [livraisons]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0], semaine: getWeekNumber() });
    setModalOpen(true);
  };

  const openEdit = (l) => {
    setEditingId(l.id);
    setForm({ date: l.date || '', semaine: l.semaine || '', collecteur: l.collecteur || '', typeGomme: l.typeGomme || 'Friable', quantite: l.quantite || '', prixKg: l.prixKg || '', acomptePaye: l.acomptePaye || '', datePaiement: l.datePaiement || '', statut: l.statut || 'À PAYER', observations: l.observations || '' });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const quantite = Number(form.quantite) || 0;
    const prixKg = Number(form.prixKg) || 0;
    const acomptePaye = Number(form.acomptePaye) || 0;
    const montantTotal = quantite * prixKg;
    const resteAPayer = Math.max(0, montantTotal - acomptePaye);
    const data = { ...form, quantite, prixKg, acomptePaye, montantTotal, resteAPayer, semaine: Number(form.semaine) };
    if (editingId) updateLivraison(editingId, data);
    else addLivraison(data);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-700">{statsType.friable.kg.toFixed(0)} kg</div>
          <div className="text-xs text-gray-500">Stock Friable</div>
          <div className="text-xs text-green-600 font-medium mt-1">{formatCurrency(statsType.friable.val)}</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-orange-700">{statsType.karaya.kg.toFixed(0)} kg</div>
          <div className="text-xs text-gray-500">Stock Karaya</div>
          <div className="text-xs text-orange-600 font-medium mt-1">{formatCurrency(statsType.karaya.val)}</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-red-600">{formatCurrency(dettes.reduce((s, d) => s + d.total, 0))}</div>
          <div className="text-xs text-gray-500">Total Dettes</div>
          <div className="text-xs text-gray-400 mt-1">{dettes.length} collecteurs</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{livraisons.length}</div>
          <div className="text-xs text-gray-500">Total Livraisons</div>
          <div className="text-xs text-gray-400 mt-1">Cette année</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[{ k: 'livraisons', l: `Livraisons (${livraisons.length})` }, { k: 'dettes', l: `Dettes (${dettes.length})` }].map(t => (
          <button
            key={t.k}
            onClick={() => setActiveTab(t.k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.k ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {activeTab === 'livraisons' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-40">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select w-auto">
              <option value="">Tous types</option>
              {TYPES_GOMME.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="form-select w-auto">
              <option value="">Tous statuts</option>
              {STATUTS_PAIEMENT.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16} /> Nouvelle Livraison
            </button>
          </div>

          {/* Table livraisons */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>S.</th>
                    <th>Collecteur</th>
                    <th>Type</th>
                    <th>Quantité</th>
                    <th>Prix/kg</th>
                    <th>Total</th>
                    <th>Acompte</th>
                    <th>Reste</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={12} className="py-12 text-center text-gray-400">Aucune livraison trouvée</td></tr>
                  ) : filtered.map((l, idx) => (
                    <tr key={l.id}>
                      <td className="text-gray-400 text-xs">{idx + 1}</td>
                      <td className="text-xs">{formatDate(l.date)}</td>
                      <td className="text-xs text-gray-500">S{String(l.semaine || 0).padStart(2, '0')}</td>
                      <td className="font-medium text-gray-900">{l.collecteur || '—'}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.typeGomme === 'Friable' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {l.typeGomme}
                        </span>
                      </td>
                      <td className="font-mono">{(l.quantite || 0).toFixed(1)} kg</td>
                      <td className="text-xs">{formatCurrency(l.prixKg)}</td>
                      <td className="font-semibold">{formatCurrency(l.montantTotal)}</td>
                      <td className="text-green-600">{l.acomptePaye > 0 ? formatCurrency(l.acomptePaye) : '—'}</td>
                      <td className={`font-semibold ${l.resteAPayer > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {formatCurrency(l.resteAPayer)}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_STYLES[l.statut]?.cls || 'bg-gray-100 text-gray-700'}`}>
                          {STATUT_STYLES[l.statut]?.icon}
                          {l.statut}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(l)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13} /></button>
                          <button onClick={() => setConfirmDelete(l.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Dettes par collecteur */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Collecteur</th>
                  <th>Nb Livraisons</th>
                  <th>Total Dû</th>
                  <th>Progression</th>
                </tr>
              </thead>
              <tbody>
                {dettes.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400">Aucune dette en cours</td></tr>
                ) : dettes.map((d, idx) => {
                  const max = dettes[0]?.total || 1;
                  return (
                    <tr key={d.nom}>
                      <td className="text-gray-400 text-xs">{idx + 1}</td>
                      <td className="font-medium text-gray-900">{d.nom}</td>
                      <td className="text-center">{d.count} livraison(s)</td>
                      <td className="font-bold text-red-600 text-base">{formatCurrency(d.total)}</td>
                      <td className="min-w-32">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${(d.total / max) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier la livraison' : 'Nouvelle livraison'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date *</label>
              <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Semaine N°</label>
              <input type="number" min={1} max={52} value={form.semaine} onChange={e => setForm(f => ({ ...f, semaine: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Collecteur *</label>
              {collecteursNoms.length > 0 ? (
                <select value={form.collecteur} onChange={e => setForm(f => ({ ...f, collecteur: e.target.value }))} className="form-select" required>
                  <option value="">-- Sélectionner --</option>
                  {collecteursNoms.map(n => <option key={n}>{n}</option>)}
                  <option value="__autre">Autre (saisie libre)</option>
                </select>
              ) : (
                <input required type="text" value={form.collecteur} onChange={e => setForm(f => ({ ...f, collecteur: e.target.value }))} className="form-input" placeholder="Nom du collecteur" />
              )}
            </div>
            {form.collecteur === '__autre' && (
              <div>
                <label className="form-label">Nom du collecteur</label>
                <input type="text" onChange={e => setForm(f => ({ ...f, collecteur: e.target.value === '__autre' ? '' : e.target.value }))} className="form-input" placeholder="Saisir le nom" />
              </div>
            )}
            <div>
              <label className="form-label">Type de Gomme</label>
              <select value={form.typeGomme} onChange={e => setForm(f => ({ ...f, typeGomme: e.target.value }))} className="form-select">
                {TYPES_GOMME.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Quantité (kg) *</label>
              <input required type="number" min={0} step={0.1} value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} className="form-input" placeholder="Ex: 150" />
            </div>
            <div>
              <label className="form-label">Prix / kg (FCFA)</label>
              <input type="number" min={0} value={form.prixKg} onChange={e => setForm(f => ({ ...f, prixKg: e.target.value }))} className="form-input" placeholder="Ex: 500" />
            </div>
            <div>
              <label className="form-label">Acompte Payé (FCFA)</label>
              <input type="number" min={0} value={form.acomptePaye} onChange={e => setForm(f => ({ ...f, acomptePaye: e.target.value }))} className="form-input" placeholder="Ex: 25000" />
            </div>
            <div>
              <label className="form-label">Statut Paiement</label>
              <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className="form-select">
                {STATUTS_PAIEMENT.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date de Paiement</label>
              <input type="date" value={form.datePaiement} onChange={e => setForm(f => ({ ...f, datePaiement: e.target.value }))} className="form-input" />
            </div>
          </div>
          {form.quantite && form.prixKg && (
            <div className="bg-blue-50 rounded-xl p-3 grid grid-cols-3 gap-3">
              <div><div className="text-xs text-gray-500">Montant Total</div><div className="font-bold text-blue-700">{formatCurrency(Number(form.quantite) * Number(form.prixKg))}</div></div>
              <div><div className="text-xs text-gray-500">Acompte</div><div className="font-bold text-green-700">{formatCurrency(Number(form.acomptePaye) || 0)}</div></div>
              <div><div className="text-xs text-gray-500">Reste à Payer</div><div className="font-bold text-red-700">{formatCurrency(Math.max(0, Number(form.quantite) * Number(form.prixKg) - (Number(form.acomptePaye) || 0)))}</div></div>
            </div>
          )}
          <div>
            <label className="form-label">Observations</label>
            <textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} className="form-input" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmer la suppression" size="sm">
        <p className="text-sm text-gray-600 mb-6">Supprimer cette livraison définitivement ?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Annuler</button>
          <button onClick={() => { deleteLivraison(confirmDelete); setConfirmDelete(null); }} className="btn-danger">Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
