import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Package, Trash2, Settings, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import { formatDate, formatCurrency, MOIS, getWeekNumber, getMondayOfWeek } from '../utils/storage';

const MAGASINS_STOCK = [
  {
    key: 'eau',
    label: 'Magasin Eau',
    color: 'blue',
    produits: [
      { key: 'sachet', label: 'Eau en Sachet', unite: 'paquet' },
      { key: 'bidon', label: 'Eau en Bidon', unite: 'bidon' },
    ],
  },
  {
    key: 'ciment',
    label: 'Magasin Ciment',
    color: 'amber',
    produits: [
      { key: 'sac', label: 'Sacs de Ciment', unite: 'sac', parTonne: 20 },
    ],
  },
];

const PERIODES = [
  { key: 'jour', label: 'Jour' },
  { key: 'semaine', label: 'Semaine' },
  { key: 'mois', label: 'Mois' },
  { key: 'annee', label: 'Année' },
  { key: 'tout', label: 'Tout' },
];

const COLORS = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', active: 'bg-blue-50 text-blue-700 border-blue-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', active: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const PRINT_OPTIONS = [
  { key: 'ENTREE', label: 'État des Entrées en Stock', icon: '↑' },
  { key: 'SORTIE', label: 'État des Ventes / Sorties', icon: '↓' },
  { key: 'TOUT', label: 'Tous les Mouvements', icon: '⇅' },
];

const todayStr = new Date().toISOString().split('T')[0];

export default function Stocks() {
  const { stocks, addMouvementStock, deleteMouvementStock, prixStock, updatePrixStock, settings } = useApp();

  const [magasin, setMagasin] = useState('eau');
  const [produitKey, setProduitKey] = useState('sachet');
  const [periode, setPeriode] = useState('semaine');
  const [navDate, setNavDate] = useState(todayStr);
  const [navSemaine, setNavSemaine] = useState(() => getWeekNumber());
  const [navMois, setNavMois] = useState(new Date().getMonth() + 1);
  const [navAnnee, setNavAnnee] = useState(new Date().getFullYear());

  const [showMouvModal, setShowMouvModal] = useState(false);
  const [showPrixModal, setShowPrixModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ type: 'ENTREE', quantite: '', prixUnitaire: '', date: todayStr, note: '' });
  const [prixForm, setPrixForm] = useState({});

  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printFilter, setPrintFilter] = useState('TOUT');
  const [printTrigger, setPrintTrigger] = useState(0);
  const printMenuRef = useRef(null);

  const mag = MAGASINS_STOCK.find(m => m.key === magasin);
  const prod = mag.produits.find(p => p.key === produitKey);
  const prixKey = `${magasin}_${produitKey}`;
  const prixActuel = prixStock[prixKey] || 0;
  const c = COLORS[mag.color];
  const hasTonne = !!prod.parTonne;

  useEffect(() => {
    if (printTrigger > 0) window.print();
  }, [printTrigger]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target)) {
        setShowPrintMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMagasin = (key) => {
    setMagasin(key);
    setProduitKey(MAGASINS_STOCK.find(m => m.key === key).produits[0].key);
  };

  const filteredMouvements = useMemo(() =>
    (stocks || []).filter(m => {
      if (m.magasin !== magasin || m.produit !== produitKey) return false;
      const [y, mo] = (m.date || '').split('-').map(Number);
      if (periode === 'jour') return m.date === navDate;
      if (periode === 'semaine') return m.semaine === navSemaine && m.annee === navAnnee;
      if (periode === 'mois') return mo === navMois && y === navAnnee;
      if (periode === 'annee') return y === navAnnee;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [stocks, magasin, produitKey, periode, navDate, navSemaine, navMois, navAnnee]
  );

  const stockTotal = useMemo(() =>
    (stocks || [])
      .filter(m => m.magasin === magasin && m.produit === produitKey)
      .reduce((s, m) => m.type === 'ENTREE' ? s + m.quantite : s - m.quantite, 0),
    [stocks, magasin, produitKey]
  );

  const entrees = filteredMouvements.filter(m => m.type === 'ENTREE').reduce((s, m) => s + m.quantite, 0);
  const sorties = filteredMouvements.filter(m => m.type === 'SORTIE').reduce((s, m) => s + m.quantite, 0);
  const chiffreAffaires = filteredMouvements.filter(m => m.type === 'SORTIE').reduce((s, m) => s + (m.montant || 0), 0);

  const printRows = useMemo(() =>
    filteredMouvements.filter(m => printFilter === 'TOUT' || m.type === printFilter),
    [filteredMouvements, printFilter]
  );
  const printEntrees = printRows.filter(m => m.type === 'ENTREE').reduce((s, m) => s + m.quantite, 0);
  const printSorties = printRows.filter(m => m.type === 'SORTIE').reduce((s, m) => s + m.quantite, 0);
  const printCA = printRows.filter(m => m.type === 'SORTIE').reduce((s, m) => s + (m.montant || 0), 0);
  const printLabel = PRINT_OPTIONS.find(o => o.key === printFilter)?.label || '';

  const navigatePrev = () => {
    if (periode === 'semaine') {
      if (navSemaine <= 1) { setNavAnnee(y => y - 1); setNavSemaine(52); }
      else setNavSemaine(s => s - 1);
    } else if (periode === 'mois') {
      if (navMois === 1) { setNavMois(12); setNavAnnee(y => y - 1); }
      else setNavMois(m => m - 1);
    } else if (periode === 'annee') setNavAnnee(y => y - 1);
  };

  const navigateNext = () => {
    if (periode === 'semaine') {
      if (navSemaine >= 52) { setNavAnnee(y => y + 1); setNavSemaine(1); }
      else setNavSemaine(s => s + 1);
    } else if (periode === 'mois') {
      if (navMois === 12) { setNavMois(1); setNavAnnee(y => y + 1); }
      else setNavMois(m => m + 1);
    } else if (periode === 'annee') setNavAnnee(y => y + 1);
  };

  const getPeriodeLabel = () => {
    if (periode === 'jour') return formatDate(navDate);
    if (periode === 'semaine') {
      const mon = getMondayOfWeek(navSemaine, navAnnee);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return `Sem. ${String(navSemaine).padStart(2, '0')} — ${formatDate(mon)} au ${formatDate(sun)}`;
    }
    if (periode === 'mois') return `${MOIS[navMois - 1]} ${navAnnee}`;
    if (periode === 'annee') return `Année ${navAnnee}`;
    return 'Toutes les périodes';
  };

  const handlePrint = (filter) => {
    setPrintFilter(filter);
    setShowPrintMenu(false);
    setPrintTrigger(t => t + 1);
  };

  const openAddModal = () => {
    setForm({ type: 'ENTREE', quantite: '', prixUnitaire: prixActuel || '', date: todayStr, note: '' });
    setShowMouvModal(true);
  };

  const handleSubmit = () => {
    const qty = Number(form.quantite);
    if (!qty || qty <= 0) return;
    const d = new Date(form.date + 'T12:00:00');
    addMouvementStock({
      magasin,
      produit: produitKey,
      type: form.type,
      quantite: qty,
      prixUnitaire: Number(form.prixUnitaire) || 0,
      montant: qty * (Number(form.prixUnitaire) || 0),
      date: form.date,
      semaine: getWeekNumber(d),
      annee: d.getFullYear(),
      note: form.note,
    });
    setShowMouvModal(false);
  };

  const openPrixModal = () => {
    const init = {};
    MAGASINS_STOCK.forEach(m => m.produits.forEach(p => {
      init[`${m.key}_${p.key}`] = prixStock[`${m.key}_${p.key}`] ?? '';
    }));
    setPrixForm(init);
    setShowPrixModal(true);
  };

  const handleSavePrix = () => {
    Object.entries(prixForm).forEach(([k, v]) => {
      if (v !== '') updatePrixStock(k, Number(v));
    });
    setShowPrixModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-3 no-print">
        <div className="flex gap-2 flex-wrap">
          {MAGASINS_STOCK.map(m => {
            const mc = COLORS[m.color];
            return (
              <button
                key={m.key}
                onClick={() => handleMagasin(m.key)}
                className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${
                  magasin === m.key ? mc.active : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <button onClick={openPrixModal} className="btn-secondary gap-1.5 text-xs">
          <Settings size={14} /> Configurer les prix
        </button>

        {/* Print button with dropdown */}
        <div className="relative" ref={printMenuRef}>
          <button
            onClick={() => setShowPrintMenu(v => !v)}
            className="btn-secondary gap-1.5"
          >
            <Printer size={16} /> Imprimer ▾
          </button>
          {showPrintMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-56 py-1 overflow-hidden">
              {PRINT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handlePrint(opt.key)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <span className={`text-base font-bold ${opt.key === 'ENTREE' ? 'text-green-600' : opt.key === 'SORTIE' ? 'text-red-600' : 'text-blue-600'}`}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={openAddModal} className="btn-primary">
          <Plus size={16} /> Nouveau mouvement
        </button>
      </div>

      {/* Product sub-tabs */}
      {mag.produits.length > 1 && (
        <div className="flex gap-2 no-print">
          {mag.produits.map(p => (
            <button
              key={p.key}
              onClick={() => setProduitKey(p.key)}
              className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${
                produitKey === p.key ? c.active : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="card p-4">
          <div className={`text-xl font-bold ${stockTotal < 0 ? 'text-red-600' : 'text-blue-600'}`}>
            {stockTotal.toLocaleString('fr-FR')} {prod.unite}s
          </div>
          {hasTonne && <div className="text-xs text-gray-400">≈ {(stockTotal / prod.parTonne).toFixed(2)} t</div>}
          <div className="text-xs text-gray-500 mt-0.5">Stock Actuel</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-bold text-green-600">+{entrees.toLocaleString('fr-FR')} {prod.unite}s</div>
          {hasTonne && <div className="text-xs text-gray-400">≈ {(entrees / prod.parTonne).toFixed(2)} t</div>}
          <div className="text-xs text-gray-500 mt-0.5">Entrées</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-bold text-red-600">-{sorties.toLocaleString('fr-FR')} {prod.unite}s</div>
          {hasTonne && <div className="text-xs text-gray-400">≈ {(sorties / prod.parTonne).toFixed(2)} t</div>}
          <div className="text-xs text-gray-500 mt-0.5">Sorties / Ventes</div>
        </div>
        <div className="card p-4">
          <div className="text-xl font-bold text-purple-600">{formatCurrency(chiffreAffaires)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Chiffre d'Affaires</div>
        </div>
      </div>

      {/* Period filter */}
      <div className="card p-3 flex flex-wrap items-center gap-3 no-print">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODES.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriode(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                periode === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periode === 'jour' && (
          <input
            type="date"
            value={navDate}
            onChange={e => setNavDate(e.target.value)}
            className="form-input py-1.5 text-sm w-auto"
          />
        )}

        {['semaine', 'mois', 'annee'].includes(periode) && (
          <div className="flex items-center gap-2">
            <button onClick={navigatePrev} className="btn-secondary p-1.5"><ChevronLeft size={14} /></button>
            <span className="text-sm font-medium text-gray-700 min-w-56 text-center">{getPeriodeLabel()}</span>
            <button onClick={navigateNext} className="btn-secondary p-1.5"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>

      {/* Movements table */}
      <div className="card overflow-hidden no-print">
        <div className={`px-4 py-3 ${c.bg} border-b ${c.border} flex items-center justify-between`}>
          <h3 className={`font-semibold ${c.text}`}>{prod.label} — {getPeriodeLabel()}</h3>
          <span className="text-xs text-gray-500">{filteredMouvements.length} mouvement{filteredMouvements.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredMouvements.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Aucun mouvement pour cette période</p>
            <p className="text-gray-400 text-sm mt-1">Cliquez sur "Nouveau mouvement" pour commencer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Quantité</th>
                  {hasTonne && <th className="text-right">Tonnes</th>}
                  <th className="text-right">Prix Unit.</th>
                  <th className="text-right">Montant</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredMouvements.map(m => (
                  <tr key={m.id}>
                    <td className="text-sm text-gray-600">{formatDate(m.date)}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        m.type === 'ENTREE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.type === 'ENTREE' ? '↑ Entrée' : '↓ Sortie'}
                      </span>
                    </td>
                    <td className="text-right font-semibold">
                      {m.quantite.toLocaleString('fr-FR')} {prod.unite}{m.quantite > 1 ? 's' : ''}
                    </td>
                    {hasTonne && (
                      <td className="text-right text-gray-500 text-xs">
                        {(m.quantite / prod.parTonne).toFixed(2)} t
                      </td>
                    )}
                    <td className="text-right text-gray-500 text-sm">
                      {m.prixUnitaire ? `${m.prixUnitaire.toLocaleString('fr-FR')} F` : '—'}
                    </td>
                    <td className={`text-right font-semibold ${m.type === 'ENTREE' ? 'text-green-700' : 'text-purple-700'}`}>
                      {m.montant ? formatCurrency(m.montant) : '—'}
                    </td>
                    <td className="text-gray-500 text-sm max-w-xs truncate">{m.note || '—'}</td>
                    <td>
                      <button onClick={() => setDeleteId(m.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-sm">
                  <td colSpan={2} className="px-3 py-3">TOTAUX</td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-green-700">+{entrees.toLocaleString('fr-FR')}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-red-600">-{sorties.toLocaleString('fr-FR')}</span>
                  </td>
                  {hasTonne && (
                    <td className="px-3 py-3 text-right text-gray-500 text-xs">
                      +{(entrees / prod.parTonne).toFixed(2)} / -{(sorties / prod.parTonne).toFixed(2)} t
                    </td>
                  )}
                  <td></td>
                  <td className="px-3 py-3 text-right text-purple-700">{formatCurrency(chiffreAffaires)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ===================== PRINT LAYOUT (hidden on screen) ===================== */}
      <div className="print-only hidden">
        {/* En-tête */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {settings?.companyName || 'GESTION GOMME ARABIQUE'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', textTransform: 'uppercase' }}>
                {printLabel}
              </div>
              <div style={{ fontSize: '13px', marginTop: '4px', color: '#333' }}>
                {mag.label} — {prod.label}
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                Période : {getPeriodeLabel()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {printFilter !== 'ENTREE' && (
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{formatCurrency(printCA)}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Chiffre d'Affaires</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '12px' }}>
          {(printFilter === 'TOUT' || printFilter === 'ENTREE') && (
            <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#16a34a' }}>
                {printEntrees.toLocaleString('fr-FR')} {prod.unite}s
              </div>
              {hasTonne && <div style={{ fontSize: '11px', color: '#666' }}>≈ {(printEntrees / prod.parTonne).toFixed(2)} t</div>}
              <div style={{ color: '#666' }}>Total Entrées</div>
            </div>
          )}
          {(printFilter === 'TOUT' || printFilter === 'SORTIE') && (
            <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#dc2626' }}>
                {printSorties.toLocaleString('fr-FR')} {prod.unite}s
              </div>
              {hasTonne && <div style={{ fontSize: '11px', color: '#666' }}>≈ {(printSorties / prod.parTonne).toFixed(2)} t</div>}
              <div style={{ color: '#666' }}>Total Sorties</div>
            </div>
          )}
          <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{printRows.length}</div>
            <div style={{ color: '#666' }}>Mouvements</div>
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: printSorties - printEntrees > stockTotal ? '#dc2626' : '#2563eb' }}>
              {stockTotal.toLocaleString('fr-FR')} {prod.unite}s
            </div>
            {hasTonne && <div style={{ fontSize: '11px', color: '#666' }}>≈ {(stockTotal / prod.parTonne).toFixed(2)} t</div>}
            <div style={{ color: '#666' }}>Stock Actuel</div>
          </div>
        </div>

        {/* Table */}
        {printRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#999', border: '1px dashed #ccc', borderRadius: '6px' }}>
            Aucun mouvement pour cette période
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'left', fontWeight: '600' }}>#</th>
                <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                {printFilter === 'TOUT' && (
                  <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                )}
                <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>Quantité</th>
                {hasTonne && <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>Tonnes</th>}
                <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>Prix Unit.</th>
                <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>Montant (FCFA)</th>
                <th style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'left', fontWeight: '600' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {printRows.map((m, idx) => (
                <tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px', color: '#9ca3af' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px' }}>{formatDate(m.date)}</td>
                  {printFilter === 'TOUT' && (
                    <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px', fontWeight: '600', color: m.type === 'ENTREE' ? '#16a34a' : '#dc2626' }}>
                      {m.type === 'ENTREE' ? '↑ Entrée' : '↓ Sortie'}
                    </td>
                  )}
                  <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px', textAlign: 'right', fontWeight: '600' }}>
                    {m.quantite.toLocaleString('fr-FR')} {prod.unite}{m.quantite > 1 ? 's' : ''}
                  </td>
                  {hasTonne && (
                    <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px', textAlign: 'right', color: '#6b7280' }}>
                      {(m.quantite / prod.parTonne).toFixed(2)} t
                    </td>
                  )}
                  <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px', textAlign: 'right', color: '#6b7280' }}>
                    {m.prixUnitaire ? m.prixUnitaire.toLocaleString('fr-FR') + ' F' : '—'}
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px', textAlign: 'right', fontWeight: '600' }}>
                    {m.montant ? m.montant.toLocaleString('fr-FR') : '—'}
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '5px 10px', color: '#6b7280' }}>{m.note || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                <td colSpan={printFilter === 'TOUT' ? 3 : 2} style={{ border: '1px solid #d1d5db', padding: '6px 10px' }}>
                  TOTAUX
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'right' }}>
                  {printFilter === 'TOUT' && (
                    <>
                      <span style={{ color: '#16a34a' }}>+{printEntrees.toLocaleString('fr-FR')}</span>
                      {' / '}
                      <span style={{ color: '#dc2626' }}>-{printSorties.toLocaleString('fr-FR')}</span>
                    </>
                  )}
                  {printFilter === 'ENTREE' && (
                    <span style={{ color: '#16a34a' }}>{printEntrees.toLocaleString('fr-FR')} {prod.unite}s</span>
                  )}
                  {printFilter === 'SORTIE' && (
                    <span style={{ color: '#dc2626' }}>{printSorties.toLocaleString('fr-FR')} {prod.unite}s</span>
                  )}
                </td>
                {hasTonne && (
                  <td style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'right', color: '#6b7280' }}>
                    {printFilter !== 'SORTIE' && `+${(printEntrees / prod.parTonne).toFixed(2)}`}
                    {printFilter === 'TOUT' && ' / '}
                    {printFilter !== 'ENTREE' && `-${(printSorties / prod.parTonne).toFixed(2)}`} t
                  </td>
                )}
                <td style={{ border: '1px solid #d1d5db', padding: '6px 10px' }}></td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 10px', textAlign: 'right', color: '#7c3aed', fontSize: '13px' }}>
                  {printCA > 0 ? printCA.toLocaleString('fr-FR') + ' FCFA' : '—'}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 10px' }}></td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Signature + footer */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <div>
            <div style={{ color: '#666' }}>Imprimé le {formatDate(new Date())}</div>
            <div style={{ color: '#666', marginTop: '2px' }}>{settings?.companyName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '24px', color: '#666' }}>Signature & Cachet :</div>
            <div style={{ borderBottom: '1px solid #333', width: '160px', marginLeft: 'auto' }}></div>
          </div>
        </div>
      </div>
      {/* ===================== END PRINT LAYOUT ===================== */}

      {/* Modal: Add movement */}
      <Modal open={showMouvModal} onClose={() => setShowMouvModal(false)} title={`Nouveau mouvement — ${prod.label}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Type de mouvement</label>
            <div className="flex gap-2">
              {[
                { key: 'ENTREE', label: '↑ Entrée en stock' },
                { key: 'SORTIE', label: '↓ Sortie / Vente' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setForm(f => ({ ...f, type: t.key }))}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                    form.type === t.key
                      ? t.key === 'ENTREE'
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Quantité ({prod.unite}s)</label>
              <input
                type="number" min="1" value={form.quantite}
                onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                className="form-input" placeholder="0" autoFocus
              />
              {hasTonne && form.quantite && Number(form.quantite) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  ≈ {(Number(form.quantite) / prod.parTonne).toFixed(2)} tonne(s)
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Prix unitaire (FCFA)</label>
              <input
                type="number" min="0" value={form.prixUnitaire}
                onChange={e => setForm(f => ({ ...f, prixUnitaire: e.target.value }))}
                className="form-input" placeholder={prixActuel > 0 ? String(prixActuel) : '0'}
              />
            </div>
          </div>

          {form.quantite && Number(form.quantite) > 0 && form.prixUnitaire && Number(form.prixUnitaire) > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 font-medium">
              Montant total : {formatCurrency(Number(form.quantite) * Number(form.prixUnitaire))}
            </div>
          )}

          <div>
            <label className="form-label">Date</label>
            <input
              type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Note (optionnel)</label>
            <input
              type="text" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="form-input" placeholder="Fournisseur, référence, client..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowMouvModal(false)} className="btn-secondary">Annuler</button>
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={!form.quantite || Number(form.quantite) <= 0}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Configure prices */}
      <Modal open={showPrixModal} onClose={() => setShowPrixModal(false)} title="Configurer les prix de vente" size="sm">
        <div className="space-y-5">
          {MAGASINS_STOCK.map(m => (
            <div key={m.key}>
              <h4 className="font-semibold text-gray-800 mb-3">{m.label}</h4>
              <div className="space-y-3 pl-2">
                {m.produits.map(p => (
                  <div key={p.key} className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 flex-1">{p.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0"
                        value={prixForm[`${m.key}_${p.key}`] ?? ''}
                        onChange={e => setPrixForm(f => ({ ...f, [`${m.key}_${p.key}`]: e.target.value }))}
                        className="form-input w-28 text-right"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-400 whitespace-nowrap">FCFA/{p.unite}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setShowPrixModal(false)} className="btn-secondary">Annuler</button>
            <button onClick={handleSavePrix} className="btn-primary">Enregistrer les prix</button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirm delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer ce mouvement ?" size="sm">
        <p className="text-gray-600 mb-6">Cette action est irréversible. Le mouvement sera définitivement supprimé.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Annuler</button>
          <button
            onClick={() => { deleteMouvementStock(deleteId); setDeleteId(null); }}
            className="btn-danger"
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
