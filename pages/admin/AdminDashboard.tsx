import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Student, Event, Club } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Database } from 'lucide-react';

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date Range State
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 8, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear() + 1, 6, 30).toISOString().split('T')[0]);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        const [s, e, c] = await Promise.all([
            dataService.getStudents(),
            dataService.getEvents(),
            dataService.getClubs()
        ]);
        setStudents(s);
        setEvents(e);
        setClubs(c);
        setLoading(false);
    };
    loadData();
  }, []);

  const handleSeed = async () => {
      if(confirm("Voulez-vous remplir la base de données Firebase avec les données de test ?")) {
          await dataService.seedDatabase();
          window.location.reload();
      }
  };

  // Filter Data based on Date Range
  const filteredData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredStudents = students.filter(s => {
      if (!s.hasPaid || !s.paymentDate) return true;
      const pDate = new Date(s.paymentDate);
      return pDate >= start && pDate <= end;
    });

    const paidStudentsInPeriod = filteredStudents.filter(s => s.hasPaid && s.paymentDate && new Date(s.paymentDate) >= start && new Date(s.paymentDate) <= end);

    const filteredEvents = events.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= start && eDate <= end;
    });

    return {
      students: filteredStudents,
      paidStudents: paidStudentsInPeriod,
      events: filteredEvents,
      totalCollected: paidStudentsInPeriod.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    };
  }, [startDate, endDate, students, events]);

  const getBarData = () => {
    const data: Record<string, number> = {};
    filteredData.paidStudents.forEach(s => {
      if (s.paymentDate) {
        const date = new Date(s.paymentDate);
        const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        data[key] = (data[key] || 0) + (s.amount || 0);
      }
    });
    return Object.keys(data).map(key => ({ name: key, amount: data[key] }));
  };

  const getPieData = () => {
    const paid = filteredData.paidStudents.length;
    const unpaid = students.length - paid; 
    if (paid === 0 && unpaid === 0) return [{ name: 'Aucune donnée', value: 1 }];
    return [
      { name: 'Payé', value: paid },
      { name: 'Non Payé', value: unpaid },
    ];
  };

  const COLORS = ['#10B981', '#E74A67', '#CBD5E1'];
  const dateInputStyle = "bg-bde-navy text-white border border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-bde-rose outline-none";
  const unpaidCount = students.length - filteredData.paidStudents.length;

  if (loading) return <AdminLayout><div className="p-10 text-center">Chargement des données...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>
          <p className="text-gray-500">Vue d'ensemble sur la période sélectionnée</p>
        </div>
        
        <div className="flex gap-4">
             {/* Dev Button to Seed DB */}
            <button onClick={handleSeed} className="text-xs flex items-center gap-1 bg-gray-200 hover:bg-gray-300 px-2 rounded text-gray-700" title="Remplir la BDD (Dev)">
                <Database size={12} /> Init DB
            </button>

            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-2">
                <Calendar size={16} className="text-gray-400"/>
                <span className="text-sm font-medium text-gray-600">Période :</span>
            </div>
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className={dateInputStyle}
            />
            <span className="text-gray-400">-</span>
            <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className={dateInputStyle}
            />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
          <p className="text-sm text-gray-500 font-medium">Cotisations (Période)</p>
          <p className="text-2xl font-bold text-bde-navy mt-2">{filteredData.totalCollected.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
          <p className="text-sm text-gray-500 font-medium">Étudiants à jour</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{filteredData.paidStudents.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500 font-medium">Étudiants non à jour</p>
          <p className="text-2xl font-bold text-red-500 mt-2">{unpaidCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
          <p className="text-sm text-gray-500 font-medium">Clubs Actifs</p>
          <p className="text-2xl font-bold text-bde-rose mt-2">{clubs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
          <p className="text-sm text-gray-500 font-medium">Événements (Période)</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{filteredData.events.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Évolution des Cotisations</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getBarData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`${value} FCFA`, 'Montant']}
                />
                <Bar dataKey="amount" fill="#E74A67" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">État Global des paiements</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPieData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4 text-sm font-medium text-gray-600">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div>Payé</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-bde-rose rounded-full"></div>Non payé</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;