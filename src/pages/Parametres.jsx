import { useState, useRef } from 'react';
import { Save, Download, Upload, Trash2, Mail, Building, Shield, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import { storage } from '../utils/storage';

export default function Parametres() {
  const { settings, setSettings, showNotif } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef();

  const handleSave = (e) => {
    e.preventDefault();
    setSettings(form);
    showNotif('Paramètres enregistrés avec succès');
  };

  const handleExport = () => {
    const data = storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GGA_Sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif('Sauvegarde exportée avec succès');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        storage.importAll(data);
        showNotif('Données importées ! Rechargez la page pour voir les changements', 'info');
        setTimeout(() => window.location.reload(), 2000);
      } catch {
        showNotif('Fichier invalide', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    storage.clearAll();
    showNotif('Toutes les données ont été supprimées', 'warning');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Paramètres généraux */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Building size={18} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Informations Générales</h2>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="form-label">Nom de la Société / Entreprise</label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              className="form-input"
              placeholder="Ex: GESTION GOMME ARABIQUE — CAMARA MAHAMADOU"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Année de Gestion</label>
              <input
                type="number"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                className="form-input"
                min={2020} max={2030}
              />
            </div>
            <div>
              <label className="form-label">Devise</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="form-select">
                <option value="FCFA">FCFA (Franc CFA)</option>
                <option value="GNF">GNF (Franc Guinéen)</option>
                <option value="XOF">XOF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">
            <Save size={16} /> Enregistrer
          </button>
        </form>
      </div>

      {/* Email */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Mail size={18} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Adresse Email</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="form-label">Votre adresse email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="form-input"
              placeholder="Ex: votre@email.com"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Email actuellement configuré : <strong>{settings.email}</strong>
            </p>
          </div>
          <button onClick={() => { setSettings({ ...settings, email: form.email }); showNotif('Email mis à jour'); }} className="btn-primary">
            <Save size={16} /> Mettre à jour l'email
          </button>
        </div>
      </div>

      {/* Sauvegarde et restauration */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Shield size={18} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Sauvegarde & Restauration</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Toutes vos données sont sauvegardées localement sur cet appareil. Exportez régulièrement vos données pour éviter toute perte.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={handleExport} className="btn-secondary w-full justify-center py-3">
              <Download size={18} /> Exporter les données (.json)
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-secondary w-full justify-center py-3">
              <Upload size={18} /> Importer une sauvegarde
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
          <p className="text-xs text-gray-400">
            Le fichier exporté contient toutes vos données (employés, présences, livraisons, dépenses). Vous pouvez l'importer sur un autre appareil.
          </p>
        </div>
      </div>

      {/* Zone danger */}
      <div className="card overflow-hidden border-red-200">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100 bg-red-50">
          <AlertTriangle size={18} className="text-red-600" />
          <h2 className="text-sm font-semibold text-red-900">Zone Danger</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">
            La suppression de toutes les données est irréversible. Assurez-vous d'avoir exporté votre sauvegarde avant.
          </p>
          <button onClick={() => setConfirmReset(true)} className="btn-danger">
            <Trash2 size={16} /> Supprimer toutes les données
          </button>
        </div>
      </div>

      {/* Guide rapide */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <HelpCircle size={18} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Guide d'Utilisation Rapide</h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            { step: '1', title: 'Ajouter vos Employés', desc: 'Commencez par l\'onglet Employés : ajoutez toutes vos femmes et garçons pour chaque magasin, ainsi que vos collecteurs.' },
            { step: '2', title: 'Marquer la Présence', desc: 'Chaque semaine, allez dans Présence et cliquez sur les cases pour marquer Présent ou Absent. Les salaires se calculent automatiquement.' },
            { step: '3', title: 'Imprimer les Fiches de Paiement', desc: 'L\'onglet Paiement génère les fiches de paiement du vendredi. Vous pouvez les imprimer directement.' },
            { step: '4', title: 'Enregistrer les Livraisons', desc: 'Dans Collecteurs & Stock, enregistrez chaque livraison de gomme : quantité, prix, acompte versé.' },
            { step: '5', title: 'Suivre les Dépenses', desc: 'Ajoutez toutes vos dépenses dans l\'onglet Dépenses avec leur catégorie pour avoir un suivi complet.' },
            { step: '6', title: 'Consulter les Rapports', desc: 'L\'onglet Rapports vous donne des graphiques et tableaux mensuels/annuels. Exportez en Excel quand vous voulez.' },
          ].map(g => (
            <div key={g.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {g.step}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{g.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm reset */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Confirmer la suppression totale" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            ⚠️ Cette action va supprimer TOUTES vos données : employés, présences, livraisons, dépenses. Cette action est IRRÉVERSIBLE.
          </div>
          <p className="text-sm text-gray-600">Êtes-vous absolument certain ? Avez-vous exporté votre sauvegarde ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmReset(false)} className="btn-secondary">Non, annuler</button>
            <button onClick={handleReset} className="btn-danger">Oui, tout supprimer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
