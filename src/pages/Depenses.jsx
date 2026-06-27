import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Receipt, Filter } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import { formatDate, formatCurrency, CATEGORIES_DEPENSES, MOIS, getWeekNumber } from '../utils/storage';

const MAGASINS_DEP = ['Friable', 'Karaya', 'Les deux', 'Général'];
const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  semaine: getWeekNumber(),
  mois: new Date().getMonth() + 1,
  categorie: 'Transport',
  description: '',
  magasin: 'Général',
  quantite: '1',
  prixUnit: '',
  observations: '',
};

export default function Depenses() {
  const { depenses, addDepense, updateDepense, deleteDepense } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterMois, setFilterMois] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => depenses.filter(d =>
    (!search || d.description?.toLowerCase().includes(search.toLowerCase()) || d.categorie?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || d.categorie === filterCat) &&
    (!filterMois || String(d.mois) === filterMois)
  ), [depenses, search, filterCat, filterMois]);

  const totalFiltre = filtered.reduce((s, d) => s + (d.montant || 0), 0);
  const totalGeneral = depenses.reduce((s, d) => s + (d.montant || 0), 0);

  const parCategorie = useMemo(() => {
    const map = {};
    depenses.forEach(d => {
      if (!map[d.categorie]) map[d.categorie] = 0;
      map[d.categorie] += d.montant || 0;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [depenses]);

  const parMois = useMemo(() => {
    return MOIS.map((nom, idx) => ({
      nom: nom.slice(0, 3),
      total: depenses.filter(d => d.mois === idx + 1).reduce((s, d) => s + (d.montant || 0), 0)
    }));
  }, [depenses]);

  const openAdd = () => {
    setEditingId(null);
    const now = new Date();
    setForm({ ...EMPTY_FORM, date: now.toISOString().split('T')[0], semaine: getWeekNumber(), mois: now.getMonth() + 1 });
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditingId(d.id);
    setForm({ date: d.date || '', semaine: d.semaine || '', mois: d.mois || '', categorie: d.categorie || '', description: d.description || '', magasin: d.magasin || 'Général', quantite: d.quantite || '1', prixUnit: d.prixUnit || '', observations: d.observations || '' });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const quantite = Number(form.quantite) || 1;
    const prixUnit = Number(form.prixUnit) || 0;
    const montant = quantite * prixUnit;
    const data = { ...form, quantite, prixUnit, montant, semaine: Number(form.semaine), mois: Number(form.mois) };
    if (editingId) updateDepense(editingId, data);
    else addDepense(data);
    setModalOpen(false);
  };

  const CAT_COLORS = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700', 'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-700', 'bg-red-100 text-red-700'];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xl font-bold text-gray-900">{formatCurrency(totalGeneral)}</div>
          <div className="text-xs text-gray-500">Total Dépenses 2026</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-bold text-purple-700">{depenses.length}</div>
          <div className="text-xs text-gray-500">Entrées enregistrées</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-bold text-orange-700">{formatCurrency(totalGeneral / Math.max(1, new Date().getMonth() + 1))}</div>
          <div className="text-xs text-gray-500">Moyenne mensuelle</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-bold text-blue-700">{parCategorie.length}</div>
          <div className="text-xs text-gray-500">Catégories utilisées</div>
        </div>
      </div>

      {/* Répartition par catégorie */}
      {parCategorie.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Répartition par Catégorie</h3>
          <div className="flex flex-wrap gap-2">
            {parCategorie.map(([cat, total], i) => (
              <div key={cat} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${CAT_COLORS[i % CAT_COLORS.length]} cursor-pointer`}
                onClick={() => setFilterCat(filterCat === cat ? '' : cat)}>
                {cat}: {formatCurrency(total)}
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            {parCategorie.slice(0, 5).map(([cat, total]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 truncate">{cat}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(total / totalGeneral) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-28 text-right">{formatCurrency(total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="form-select w-auto">
          <option value="">Toutes catégories</option>
          {CATEGORIES_DEPENSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterMois} onChange={e => setFilterMois(e.target.value)} className="form-select w-auto">
          <option value="">Tous mois</option>
          {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Nouvelle Dépense
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between text-xs text-gray-500">
            <span>{filtered.length} entrée(s)</span>
            <span className="font-semibold text-gray-900">Total filtré: {formatCurrency(totalFiltre)}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>S.</th>
                <th>Mois</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Magasin</th>
                <th>Qté</th>
                <th>Prix Unit.</th>
                <th>Montant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="py-12 text-center text-gray-400">
                  {depenses.length === 0 ? 'Aucune dépense enregistrée' : 'Aucun résultat pour ces filtres'}
                </td></tr>
              ) : filtered.map((d, idx) => (
                <tr key={d.id}>
                  <td className="text-gray-400 text-xs">{idx + 1}</td>
                  <td className="text-xs">{formatDate(d.date)}</td>
                  <td className="text-xs text-gray-500">S{String(d.semaine || 0).padStart(2, '0')}</td>
                  <td className="text-xs">{MOIS[d.mois - 1]?.slice(0, 3) || '—'}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{d.categorie}</span>
                  </td>
                  <td className="max-w-40 truncate">{d.description || '—'}</td>
                  <td className="text-xs">{d.magasin}</td>
                  <td className="text-center">{d.quantite || 1}</td>
                  <td>{d.prixUnit ? d.prixUnit.toLocaleString('fr-FR') : '—'}</td>
                  <td className="font-semibold text-gray-900">{formatCurrency(d.montant)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13} /></button>
                      <button onClick={() => setConfirmDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={9} className="px-3 py-2 text-sm">Total</td>
                  <td className="px-3 py-2 text-base text-gray-900">{formatCurrency(totalFiltre)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier la dépense' : 'Nouvelle dépense'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date *</label>
              <input required type="date" value={form.date} onChange={e => {
                const d = new Date(e.target.value);
                setForm(f => ({ ...f, date: e.target.value, mois: d.getMonth() + 1 }));
              }} className="form-input" />
            </div>
            <div>
              <label className="form-label">Semaine N°</label>
              <input type="number" min={1} max={52} value={form.semaine} onChange={e => setForm(f => ({ ...f, semaine: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Catégorie</label>
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="form-select">
                {CATEGORIES_DEPENSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Magasin Concerné</label>
              <select value={form.magasin} onChange={e => setForm(f => ({ ...f, magasin: e.target.value }))} className="form-select">
                {MAGASINS_DEP.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description *</label>
              <input required type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input" placeholder="Ex: Carburant camion de livraison" />
            </div>
            <div>
              <label className="form-label">Quantité</label>
              <input type="number" min={1} step={0.01} value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Prix Unitaire (FCFA)</label>
              <input required type="number" min={0} value={form.prixUnit} onChange={e => setForm(f => ({ ...f, prixUnit: e.target.value }))} className="form-input" placeholder="Ex: 15000" />
            </div>
          </div>
          {form.quantite && form.prixUnit && (
            <div className="bg-purple-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">Montant Total</span>
              <span className="text-lg font-bold text-purple-700">{formatCurrency(Number(form.quantite) * Number(form.prixUnit))}</span>
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

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmer" size="sm">
        <p className="text-sm text-gray-600 mb-6">Supprimer cette dépense ?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Annuler</button>
          <button onClick={() => { deleteDepense(confirmDelete); setConfirmDelete(null); }} className="btn-danger">Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
