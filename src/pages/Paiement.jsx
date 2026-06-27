import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Printer, Download, Plus, CreditCard } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import { getWeekNumber, getMondayOfWeek, formatDate, formatCurrency, JOURS_SHORT } from '../utils/storage';

const MAGASINS = [
  { key: 'friable', label: 'Magasin Friable', color: 'green', sections: ['friable_femmes', 'friable_garcons'] },
  { key: 'karaya', label: 'Magasin Karaya', color: 'orange', sections: ['karaya_femmes', 'karaya_garcons'] },
];
const JOURS_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'samedi'];

export default function Paiement() {
  const { employes, presences, avances, addAvance, settings } = useApp();
  const [semaine, setSemaine] = useState(() => getWeekNumber());
  const [magasin, setMagasin] = useState('friable');
  const [avanceModal, setAvanceModal] = useState(null);
  const [avanceMontant, setAvanceMontant] = useState('');
  const printRef = useRef();

  const mag = MAGASINS.find(m => m.key === magasin);
  const monday = getMondayOfWeek(semaine);
  const saturday = new Date(monday); saturday.setDate(monday.getDate() + 5);

  const allEmployes = useMemo(() =>
    mag.sections.flatMap(s => employes[s] || []).filter(e => e.nom),
    [mag, employes]
  );

  const presMap = presences[`${semaine}_${magasin}`] || {};
  const calcRow = (emp) => {
    const pres = presMap[emp.id] || {};
    const joursPresent = JOURS_KEYS.filter(j => pres[j] === 'PRÉSENT').length;
    const salaireBrut = (emp.salaireJour || 0) * joursPresent;
    const avance = avances[`${emp.id}_${semaine}`] || 0;
    const netAPayer = Math.max(0, salaireBrut - avance);
    return { joursPresent, salaireBrut, avance, netAPayer, pres };
  };

  const rows = useMemo(() => allEmployes.map(e => ({ emp: e, ...calcRow(e) })), [allEmployes, presMap, avances, semaine]);

  const totaux = rows.reduce((t, r) => ({
    joursPresent: t.joursPresent + r.joursPresent,
    salaireBrut: t.salaireBrut + r.salaireBrut,
    avance: t.avance + r.avance,
    netAPayer: t.netAPayer + r.netAPayer,
  }), { joursPresent: 0, salaireBrut: 0, avance: 0, netAPayer: 0 });

  const handleAddAvance = () => {
    const montant = Number(avanceMontant);
    if (avanceModal && montant > 0) {
      addAvance(avanceModal.id, semaine, montant);
      setAvanceModal(null);
      setAvanceMontant('');
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-4 no-print">
        <div className="flex items-center gap-2">
          <button onClick={() => setSemaine(s => Math.max(1, s - 1))} className="btn-secondary p-2"><ChevronLeft size={16} /></button>
          <div className="text-center min-w-32">
            <div className="font-semibold text-gray-900">Semaine {String(semaine).padStart(2, '0')}</div>
            <div className="text-xs text-gray-500">{formatDate(monday)} → {formatDate(saturday)}</div>
          </div>
          <button onClick={() => setSemaine(s => Math.min(52, s + 1))} className="btn-secondary p-2"><ChevronRight size={16} /></button>
        </div>
        <div className="flex gap-2 flex-1 flex-wrap">
          {MAGASINS.map(m => (
            <button
              key={m.key}
              onClick={() => setMagasin(m.key)}
              className={`flex-1 min-w-28 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                magasin === m.key
                  ? m.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button onClick={handlePrint} className="btn-secondary">
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* Fiche de paiement */}
      <div className="card overflow-hidden" ref={printRef}>
        {/* En-tête imprimable */}
        <div className={`p-4 ${mag.color === 'green' ? 'bg-green-50 border-b border-green-100' : 'bg-orange-50 border-b border-orange-100'}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className={`text-lg font-bold ${mag.color === 'green' ? 'text-green-800' : 'text-orange-800'}`}>
                FICHE DE PAIEMENT — {mag.label.toUpperCase()}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Semaine N° {semaine} | Du {formatDate(monday)} au {formatDate(saturday)}
              </p>
              <p className="text-xs text-gray-500">{settings.companyName}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totaux.netAPayer)}</div>
              <div className="text-xs text-gray-500">Total Net à Payer</div>
            </div>
          </div>
        </div>

        {/* Table */}
        {allEmployes.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucun employé dans ce magasin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom & Prénom</th>
                  <th>Sal./Jour</th>
                  {JOURS_SHORT.map(j => <th key={j} className="text-center">{j}</th>)}
                  <th className="text-center">Jrs</th>
                  <th>Brut (FCFA)</th>
                  <th>Avance</th>
                  <th className="text-green-700">Net à Payer</th>
                  <th className="no-print">Signature</th>
                  <th className="no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.emp.id}>
                    <td className="text-gray-400 text-xs">{idx + 1}</td>
                    <td className="font-medium text-gray-900">{row.emp.nom}</td>
                    <td className="text-xs text-gray-500">{row.emp.salaireJour?.toLocaleString('fr-FR')}</td>
                    {JOURS_KEYS.map(j => (
                      <td key={j} className="text-center">
                        <span className={`text-xs font-medium ${row.pres[j] === 'PRÉSENT' ? 'text-green-600' : 'text-gray-300'}`}>
                          {row.pres[j] === 'PRÉSENT' ? '✓' : '×'}
                        </span>
                      </td>
                    ))}
                    <td className="text-center font-bold">{row.joursPresent}</td>
                    <td>{row.salaireBrut.toLocaleString('fr-FR')}</td>
                    <td className="text-red-600 text-sm">{row.avance > 0 ? `-${row.avance.toLocaleString('fr-FR')}` : '—'}</td>
                    <td className="font-bold text-green-700">{row.netAPayer.toLocaleString('fr-FR')}</td>
                    <td className="no-print">
                      <div className="w-24 border-b border-gray-300" />
                    </td>
                    <td className="no-print">
                      <button
                        onClick={() => { setAvanceModal(row.emp); setAvanceMontant(''); }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Plus size={12} /> Avance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold text-sm">
                  <td colSpan={3} className="px-3 py-3">TOTAUX SEMAINE {semaine}</td>
                  <td colSpan={5}></td>
                  <td className="px-3 py-3 text-center">{totaux.joursPresent}</td>
                  <td className="px-3 py-3">{totaux.salaireBrut.toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-3 text-red-600">-{totaux.avance.toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-3 text-green-700 text-base">{totaux.netAPayer.toLocaleString('fr-FR')}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Footer imprimable */}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between print-only hidden">
          <span>Imprimé le {formatDate(new Date())}</span>
          <span>{settings.companyName}</span>
        </div>
      </div>

      {/* Modal Avance */}
      <Modal open={!!avanceModal} onClose={() => setAvanceModal(null)} title={`Enregistrer une avance — ${avanceModal?.nom}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Montant de l'avance (FCFA)</label>
            <input
              type="number"
              min="0"
              value={avanceMontant}
              onChange={e => setAvanceMontant(e.target.value)}
              className="form-input text-lg"
              placeholder="Ex: 5000"
              autoFocus
            />
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            Cette avance sera déduite du salaire net de la semaine {semaine}.
            {avanceModal && avances[`${avanceModal.id}_${semaine}`] > 0 && (
              <span className="block mt-1">Avance existante: {formatCurrency(avances[`${avanceModal.id}_${semaine}`])}</span>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setAvanceModal(null)} className="btn-secondary">Annuler</button>
            <button onClick={handleAddAvance} className="btn-primary" disabled={!avanceMontant || Number(avanceMontant) <= 0}>
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
