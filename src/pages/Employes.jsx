import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, UserCheck, UserX, Phone, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import { ROLES_FRIABLE, ROLES_KARAYA } from '../utils/storage';

const SECTIONS = [
  { key: 'friable_femmes', label: 'Friable — Femmes', color: 'bg-green-100 text-green-800 border-green-200', roles: ROLES_FRIABLE, max: 100 },
  { key: 'friable_garcons', label: 'Friable — Garçons', color: 'bg-green-100 text-green-800 border-green-200', roles: ['Manutentionnaire', 'Chauffeur', 'Agent de sécurité', 'Superviseur', 'Chargeur'], max: 50 },
  { key: 'karaya_femmes', label: 'Karaya — Femmes', color: 'bg-orange-100 text-orange-800 border-orange-200', roles: ROLES_KARAYA, max: 100 },
  { key: 'karaya_garcons', label: 'Karaya — Garçons', color: 'bg-orange-100 text-orange-800 border-orange-200', roles: ['Manutentionnaire', 'Chauffeur', 'Agent de sécurité', 'Superviseur', 'Chargeur'], max: 50 },
  { key: 'collecteurs', label: 'Collecteurs / Fournisseurs', color: 'bg-blue-100 text-blue-800 border-blue-200', roles: ['Collecteur', 'Fournisseur principal', 'Transporteur', 'Agent de terrain'], max: 50 },
];

const EMPTY_FORM = { nom: '', role: '', salaireJour: '', telephone: '', dateEmbauche: '', statut: 'ACTIF', observations: '' };

export default function Employes() {
  const { employes, addEmploye, updateEmploye, deleteEmploye } = useApp();
  const [activeSection, setActiveSection] = useState('friable_femmes');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ friable_femmes: true });

  const section = SECTIONS.find(s => s.key === activeSection);
  const list = (employes[activeSection] || []).filter(e =>
    !search || e.nom?.toLowerCase().includes(search.toLowerCase()) ||
    e.role?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, role: section?.roles[0] || '' });
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditingId(emp.id);
    setForm({ nom: emp.nom || '', role: emp.role || '', salaireJour: emp.salaireJour || '', telephone: emp.telephone || '', dateEmbauche: emp.dateEmbauche || '', statut: emp.statut || 'ACTIF', observations: emp.observations || '' });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, salaireJour: Number(form.salaireJour) || 0 };
    if (editingId) updateEmploye(activeSection, editingId, data);
    else addEmploye(activeSection, data);
    setModalOpen(false);
  };

  const handleDelete = () => {
    deleteEmploye(activeSection, confirmDelete);
    setConfirmDelete(null);
  };

  const totalSection = Object.fromEntries(SECTIONS.map(s => [s.key, employes[s.key]?.length || 0]));

  return (
    <div className="space-y-4">
      {/* Section tabs mobile */}
      <div className="card p-1 flex gap-1 overflow-x-auto">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === s.key ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.label.split('—')[0].trim()}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeSection === s.key ? 'bg-white/20' : 'bg-gray-200'}`}>
              {totalSection[s.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 relative min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${section?.color}`}>
          {section?.label} ({list.length}/{section?.max})
        </span>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom & Prénom</th>
                <th>Rôle</th>
                {activeSection !== 'collecteurs' && <th>Sal./Jour</th>}
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    {search ? 'Aucun résultat trouvé' : 'Aucun employé dans cette section. Cliquez sur Ajouter.'}
                  </td>
                </tr>
              ) : list.map((emp, idx) => (
                <tr key={emp.id}>
                  <td className="text-gray-400 text-xs">{idx + 1}</td>
                  <td className="font-medium text-gray-900">{emp.nom || <span className="text-gray-300 italic">Sans nom</span>}</td>
                  <td className="text-gray-600">{emp.role || '—'}</td>
                  {activeSection !== 'collecteurs' && (
                    <td className="font-mono text-sm">{emp.salaireJour ? `${emp.salaireJour.toLocaleString('fr-FR')} FCFA` : '—'}</td>
                  )}
                  <td className="text-gray-600 text-xs">{emp.telephone || '—'}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {emp.statut === 'ACTIF' ? <UserCheck size={11} /> : <UserX size={11} />}
                      {emp.statut || 'ACTIF'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(emp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats section */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SECTIONS.map(s => (
          <div key={s.key} className={`card p-3 ${activeSection === s.key ? 'ring-2 ring-brand-500' : ''}`}>
            <div className="text-2xl font-bold text-gray-900">{totalSection[s.key]}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-xs text-gray-400">max {s.max}</div>
          </div>
        ))}
      </div>

      {/* Modal Ajout/Édition */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier l\'employé' : `Nouvel employé — ${section?.label}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom & Prénom *</label>
              <input
                required
                type="text"
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="form-input"
                placeholder="Ex: Bah Sita"
              />
            </div>
            <div>
              <label className="form-label">Rôle / Poste</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="form-select">
                {(section?.roles || []).map(r => <option key={r}>{r}</option>)}
                <option value="Autre">Autre</option>
              </select>
            </div>
            {activeSection !== 'collecteurs' && (
              <div>
                <label className="form-label">Salaire / Jour (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={form.salaireJour}
                  onChange={e => setForm(f => ({ ...f, salaireJour: e.target.value }))}
                  className="form-input"
                  placeholder="Ex: 2000"
                />
              </div>
            )}
            <div>
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="form-input"
                placeholder="Ex: 620 00 00 00"
              />
            </div>
            <div>
              <label className="form-label">Date d'embauche</label>
              <input
                type="date"
                value={form.dateEmbauche}
                onChange={e => setForm(f => ({ ...f, dateEmbauche: e.target.value }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Statut</label>
              <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className="form-select">
                <option>ACTIF</option>
                <option>INACTIF</option>
                <option>CONGÉ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Observations</label>
            <textarea
              value={form.observations}
              onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
              className="form-input"
              rows={2}
              placeholder="Notes supplémentaires..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmer la suppression" size="sm">
        <p className="text-sm text-gray-600 mb-6">Voulez-vous vraiment supprimer cet employé ? Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Annuler</button>
          <button onClick={handleDelete} className="btn-danger">Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
