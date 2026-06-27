import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, DEFAULT_SETTINGS } from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(() => storage.get('settings', DEFAULT_SETTINGS));
  const [employes, setEmployes] = useState(() => storage.get('employes', {
    friable_femmes: [], friable_garcons: [], karaya_femmes: [], karaya_garcons: [], collecteurs: []
  }));
  const [presences, setPresences] = useState(() => storage.get('presences', {}));
  const [paiements, setPaiements] = useState(() => storage.get('paiements', {}));
  const [avances, setAvances] = useState(() => storage.get('avances', {}));
  const [livraisons, setLivraisons] = useState(() => storage.get('livraisons', []));
  const [depenses, setDepenses] = useState(() => storage.get('depenses', []));
  const [notification, setNotification] = useState(null);

  const save = useCallback((key, val) => storage.set(key, val), []);

  useEffect(() => { save('settings', settings); }, [settings, save]);
  useEffect(() => { save('employes', employes); }, [employes, save]);
  useEffect(() => { save('presences', presences); }, [presences, save]);
  useEffect(() => { save('paiements', paiements); }, [paiements, save]);
  useEffect(() => { save('avances', avances); }, [avances, save]);
  useEffect(() => { save('livraisons', livraisons); }, [livraisons, save]);
  useEffect(() => { save('depenses', depenses); }, [depenses, save]);

  const showNotif = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addEmploye = useCallback((section, employe) => {
    setEmployes(prev => ({
      ...prev,
      [section]: [...prev[section], { ...employe, id: Date.now().toString() }]
    }));
    showNotif('Employé ajouté avec succès');
  }, [showNotif]);

  const updateEmploye = useCallback((section, id, data) => {
    setEmployes(prev => ({
      ...prev,
      [section]: prev[section].map(e => e.id === id ? { ...e, ...data } : e)
    }));
    showNotif('Employé modifié');
  }, [showNotif]);

  const deleteEmploye = useCallback((section, id) => {
    setEmployes(prev => ({
      ...prev,
      [section]: prev[section].filter(e => e.id !== id)
    }));
    showNotif('Employé supprimé', 'warning');
  }, [showNotif]);

  const setPresence = useCallback((semaine, magasin, employeId, jour, value) => {
    setPresences(prev => ({
      ...prev,
      [`${semaine}_${magasin}`]: {
        ...(prev[`${semaine}_${magasin}`] || {}),
        [employeId]: {
          ...((prev[`${semaine}_${magasin}`] || {})[employeId] || {}),
          [jour]: value
        }
      }
    }));
  }, []);

  const setPresenceMasse = useCallback((semaine, magasin, employeId, present) => {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'samedi', 'dimanche'];
    setPresences(prev => ({
      ...prev,
      [`${semaine}_${magasin}`]: {
        ...(prev[`${semaine}_${magasin}`] || {}),
        [employeId]: Object.fromEntries(jours.map(j => [j, present ? 'PRÉSENT' : 'ABSENT']))
      }
    }));
  }, []);

  const addAvance = useCallback((employeId, semaine, montant) => {
    const key = `${employeId}_${semaine}`;
    setAvances(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + montant
    }));
    showNotif('Avance enregistrée');
  }, [showNotif]);

  const addLivraison = useCallback((livraison) => {
    setLivraisons(prev => [{ ...livraison, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev]);
    showNotif('Livraison enregistrée');
  }, [showNotif]);

  const updateLivraison = useCallback((id, data) => {
    setLivraisons(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    showNotif('Livraison modifiée');
  }, [showNotif]);

  const deleteLivraison = useCallback((id) => {
    setLivraisons(prev => prev.filter(l => l.id !== id));
    showNotif('Livraison supprimée', 'warning');
  }, [showNotif]);

  const addDepense = useCallback((depense) => {
    setDepenses(prev => [{ ...depense, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev]);
    showNotif('Dépense enregistrée');
  }, [showNotif]);

  const updateDepense = useCallback((id, data) => {
    setDepenses(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    showNotif('Dépense modifiée');
  }, [showNotif]);

  const deleteDepense = useCallback((id) => {
    setDepenses(prev => prev.filter(d => d.id !== id));
    showNotif('Dépense supprimée', 'warning');
  }, [showNotif]);

  const getPresenceSemaine = useCallback((semaine, magasin) => {
    return presences[`${semaine}_${magasin}`] || {};
  }, [presences]);

  const calcSalaireEmployee = useCallback((employe, semaine, magasin) => {
    const pres = presences[`${semaine}_${magasin}`]?.[employe.id] || {};
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'samedi', 'dimanche'];
    const joursPresent = jours.filter(j => pres[j] === 'PRÉSENT').length;
    const salaireBrut = (employe.salaireJour || 0) * joursPresent;
    const avance = avances[`${employe.id}_${semaine}`] || 0;
    const netAPayer = Math.max(0, salaireBrut - avance);
    return { joursPresent, salaireBrut, avance, netAPayer };
  }, [presences, avances]);

  const getStatsGlobales = useCallback(() => {
    const totalDelivres = livraisons.reduce((s, l) => s + (l.quantite || 0), 0);
    const totalFriable = livraisons.filter(l => l.typeGomme === 'Friable').reduce((s, l) => s + (l.quantite || 0), 0);
    const totalKaraya = livraisons.filter(l => l.typeGomme === 'Karaya').reduce((s, l) => s + (l.quantite || 0), 0);
    const dettesTotal = livraisons.reduce((s, l) => s + (l.resteAPayer || 0), 0);
    const depensesTotal = depenses.reduce((s, d) => s + (d.montant || 0), 0);
    const valeurFriable = livraisons.filter(l => l.typeGomme === 'Friable').reduce((s, l) => s + (l.montantTotal || 0), 0);
    const valeurKaraya = livraisons.filter(l => l.typeGomme === 'Karaya').reduce((s, l) => s + (l.montantTotal || 0), 0);
    return { totalDelivres, totalFriable, totalKaraya, dettesTotal, depensesTotal, valeurFriable, valeurKaraya };
  }, [livraisons, depenses]);

  return (
    <AppContext.Provider value={{
      settings, setSettings,
      employes, addEmploye, updateEmploye, deleteEmploye,
      presences, setPresence, setPresenceMasse, getPresenceSemaine,
      paiements, setPaiements,
      avances, addAvance,
      livraisons, addLivraison, updateLivraison, deleteLivraison,
      depenses, addDepense, updateDepense, deleteDepense,
      calcSalaireEmployee, getStatsGlobales,
      notification, showNotif,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
