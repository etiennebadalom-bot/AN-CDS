const PREFIX = 'gga2026_';

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  remove: (key) => localStorage.removeItem(PREFIX + key),
  exportAll: () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX)) {
        try { data[key] = JSON.parse(localStorage.getItem(key)); } catch { data[key] = localStorage.getItem(key); }
      }
    }
    return data;
  },
  importAll: (data) => {
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith(PREFIX)) localStorage.setItem(key, JSON.stringify(value));
    });
  },
  clearAll: () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
};

export const DEFAULT_SETTINGS = {
  email: 'honneurgloire2021@gmail.com',
  companyName: 'GESTION GOMME ARABIQUE — CAMARA MAHAMADOU',
  year: 2026,
  currency: 'FCFA',
  weekStart: 1,
};

export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Samedi'];
export const JOURS_SHORT = ['Lu', 'Ma', 'Me', 'Je', 'Sa'];

export const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export const CATEGORIES_DEPENSES = [
  'Transport', 'Carburant', 'Maintenance', 'Fournitures', 'Alimentation',
  'Salaires extra', 'Équipement', 'Communication', 'Loyer', 'Divers'
];

export const TYPES_GOMME = ['Friable', 'Karaya', 'Mixte'];

export const STATUTS_PAIEMENT = ['À PAYER', 'PARTIELLEMENT PAYÉ', 'PAYÉ'];

export const ROLES_FRIABLE = ['Trieuse', 'Superviseuse', 'Manutentionnaire', 'Agent de nettoyage', 'Responsable qualité'];
export const ROLES_KARAYA = ['Trieuse', 'Superviseuse', 'Manutentionnaire', 'Agent de nettoyage', 'Responsable qualité'];

export const getWeekNumber = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export const getMondayOfWeek = (week, year = 2026) => {
  const jan1 = new Date(year, 0, 1);
  const day1 = jan1.getDay() || 7;
  const monday = new Date(year, 0, 1 + (week - 1) * 7 - (day1 - 1));
  return monday;
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatCurrency = (amount, currency = 'FCFA') => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' ' + currency;
};
