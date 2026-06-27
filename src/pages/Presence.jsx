import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Users, Calendar, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getWeekNumber, getMondayOfWeek, formatDate, formatCurrency, JOURS, JOURS_SHORT } from '../utils/storage';

const MAGASINS = [
  { key: 'friable', label: 'Magasin Friable', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', sections: ['friable_femmes', 'friable_garcons'] },
  { key: 'karaya', label: 'Magasin Karaya', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', sections: ['karaya_femmes', 'karaya_garcons'] },
];

const JOURS_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'samedi'];

export default function Presence() {
  const { employes, presences, setPresence, setPresenceMasse, calcSalaireEmployee } = useApp();
  const [semaine, setSemaine] = useState(() => getWeekNumber());
  const [magasin, setMagasin] = useState('friable');

  const mag = MAGASINS.find(m => m.key === magasin);
  const monday = getMondayOfWeek(semaine);
  const saturday = new Date(monday); saturday.setDate(monday.getDate() + 5);

  const allEmployes = useMemo(() =>
    mag.sections.flatMap(s => employes[s] || []).filter(e => e.nom),
    [mag, employes]
  );

  const presKey = `${semaine}_${magasin}`;
  const presMap = presences[presKey] || {};

  const getPresence = (empId, jour) => presMap[empId]?.[jour] || '';
  const isPresent = (empId, jour) => getPresence(empId, jour) === 'PRÉSENT';
  const toggle = (empId, jour) => {
    const cur = getPresence(empId, jour);
    setPresence(semaine, magasin, empId, jour, cur === 'PRÉSENT' ? 'ABSENT' : 'PRÉSENT');
  };

  const totals = useMemo(() => {
    const t = { joursPresent: 0, salaireBrut: 0, avances: 0, netAPayer: 0 };
    allEmployes.forEach(e => {
      const s = calcSalaireEmployee(e, semaine, magasin);
      t.joursPresent += s.joursPresent;
      t.salaireBrut += s.salaireBrut;
      t.avances += s.avance;
      t.netAPayer += s.netAPayer;
    });
    return t;
  }, [allEmployes, calcSalaireEmployee, semaine, magasin]);

  const presentsToday = (jour) => allEmployes.filter(e => isPresent(e.id, jour)).length;
  const totalPresentsWeek = allEmployes.reduce((s, e) => {
    return s + JOURS_KEYS.filter(j => isPresent(e.id, j)).length;
  }, 0);

  const toggleAll = (present) => {
    allEmployes.forEach(e => {
      JOURS_KEYS.forEach(j => setPresence(semaine, magasin, e.id, j, present ? 'PRÉSENT' : 'ABSENT'));
    });
  };

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSemaine(s => Math.max(1, s - 1))} className="btn-secondary p-2">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center min-w-32">
            <div className="font-semibold text-gray-900">Semaine {String(semaine).padStart(2, '0')}</div>
            <div className="text-xs text-gray-500">{formatDate(monday)} → {formatDate(saturday)}</div>
          </div>
          <button onClick={() => setSemaine(s => Math.min(52, s + 1))} className="btn-secondary p-2">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex gap-2 flex-1 flex-wrap">
          {MAGASINS.map(m => (
            <button
              key={m.key}
              onClick={() => setMagasin(m.key)}
              className={`flex-1 min-w-28 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                magasin === m.key
                  ? `${m.bg} ${m.color} ${m.border}`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)} className="btn-success text-xs px-3 py-1.5">
            <CheckSquare size={14} /> Tout présent
          </button>
          <button onClick={() => toggleAll(false)} className="btn-secondary text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50">
            <Square size={14} /> Tout absent
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Employés" value={allEmployes.length} icon={Users} color="text-blue-600" />
        <StatCard label="Jours-présences" value={totalPresentsWeek} icon={Calendar} color="text-green-600" />
        <StatCard label="Masse salariale" value={formatCurrency(totals.salaireBrut)} icon={null} color="text-purple-600" />
        <StatCard label="Net à payer" value={formatCurrency(totals.netAPayer)} icon={null} color="text-emerald-600" />
      </div>

      {/* Presence table */}
      <div className="card overflow-hidden">
        {allEmployes.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Aucun employé dans ce magasin</p>
            <p className="text-gray-400 text-sm mt-1">Ajoutez des employés dans l'onglet Employés d'abord</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-gray-50 z-10">#</th>
                  <th className="sticky left-8 bg-gray-50 z-10 min-w-40">Nom & Prénom</th>
                  <th>Sal./Jour</th>
                  {JOURS.map((j, i) => (
                    <th key={j} className="text-center">
                      <div>{JOURS_SHORT[i]}</div>
                      <div className="font-normal text-gray-400 text-xs">{presentsToday(JOURS_KEYS[i])}/{allEmployes.length}</div>
                    </th>
                  ))}
                  <th>Jrs</th>
                  <th>Brut</th>
                  <th>Avance</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {allEmployes.map((emp, idx) => {
                  const sal = calcSalaireEmployee(emp, semaine, magasin);
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="text-gray-400 text-xs sticky left-0 bg-white">{idx + 1}</td>
                      <td className="font-medium text-gray-900 sticky left-8 bg-white min-w-40">{emp.nom}</td>
                      <td className="text-xs text-gray-500">{emp.salaireJour?.toLocaleString('fr-FR')} F</td>
                      {JOURS_KEYS.map(jour => (
                        <td key={jour} className="text-center p-1">
                          <button
                            onClick={() => toggle(emp.id, jour)}
                            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center mx-auto ${
                              isPresent(emp.id, jour)
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : getPresence(emp.id, jour) === 'ABSENT'
                                ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                            }`}
                            title={isPresent(emp.id, jour) ? 'Présent — cliquer pour Absent' : 'Absent — cliquer pour Présent'}
                          >
                            {isPresent(emp.id, jour) ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </button>
                        </td>
                      ))}
                      <td className="font-bold text-center">{sal.joursPresent}</td>
                      <td className="text-sm">{sal.salaireBrut.toLocaleString('fr-FR')}</td>
                      <td className="text-sm text-red-600">{sal.avance > 0 ? `-${sal.avance.toLocaleString('fr-FR')}` : '—'}</td>
                      <td className="font-bold text-green-700">{sal.netAPayer.toLocaleString('fr-FR')}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-sm">TOTAUX</td>
                  {JOURS_KEYS.map(j => (
                    <td key={j} className="text-center text-sm py-2">
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
                        {presentsToday(j)}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-sm">{totals.joursPresent}</td>
                  <td className="px-3 py-2 text-sm">{totals.salaireBrut.toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2 text-sm text-red-600">-{totals.avances.toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2 text-sm text-green-700">{totals.netAPayer.toLocaleString('fr-FR')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Cliquez sur une cellule pour basculer Présent / Absent. Les calculs sont automatiques.
      </p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-4">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
