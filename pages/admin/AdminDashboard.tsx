
import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Student, Event, Club } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, DollarSign, Users, Briefcase } from 'lucide-react';

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date Range State (Defaults to current year/school year)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 8, 1).toISOString().split('T')[0]); 
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear() + 1, 6, 30).toISOString().split('T')[0]); 

  useEffect(() => {
    const loadData = async () => {
        const s = await dataService.fetchStudents();
        const e = await dataService.fetchEvents();
        const c = await dataService.fetchClubs();
        setStudents(s);
        setEvents(e);
        setClubs(c);
        setLoading(false);
    };
    loadData();
  }, []);

  // Filter Data based on Date Range
  const stats = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Filter students who paid within range
    const paidStudents = students.filter(s => {
      if (!s.hasPaid || !s.paymentDate) return false; 
      const pDate = new Date(s.paymentDate);
      return pDate >= start && pDate <= end;
    });

    const totalRevenue = paidStudents.reduce((acc, s) => acc + (s.amount || 0), 0);
    const totalPaidCount = paidStudents.length;

    // Events in range
    const eventsInRange = events.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= start && eDate <= end;
    });

    return {
        totalRevenue,
        totalPaidCount,
        eventsCount: eventsInRange.length,
        clubsCount: clubs.length,
        totalStudents: students.length
    };
  }, [students, events, clubs, startDate, endDate]);

  const chartData = useMemo(() => {
    // Simple distribution by level
    const distribution: Record<string, number> = {};
    students.forEach(s => {
        distribution[s.level] = (distribution[s.level] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [students]);

  if (loading) {
      return (
          <AdminLayout>
              <div className="flex items-center justify-center h-full">Chargement...</div>
          </AdminLayout>
      )
  }

  return (
    <AdminLayout>
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord</h2>
                <p className="text-gray-500">Aperçu global des activités du BDE</p>
            </div>
            
            <div className="flex gap-2 items-center bg-bde-navy p-2 rounded-lg border border-gray-600 shadow-sm">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="bg-bde-navy text-white text-sm border-none focus:ring-0 outline-none [color-scheme:dark] cursor-pointer"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="bg-bde-navy text-white text-sm border-none focus:ring-0 outline-none [color-scheme:dark] cursor-pointer"
                />
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Recettes Cotisations</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalRevenue.toLocaleString()} F</h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Étudiants Cotisants</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalPaidCount} <span className="text-sm text-gray-400 font-normal">/ {stats.totalStudents}</span></h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <Briefcase size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Clubs Actifs</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.clubsCount}</h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <Calendar size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Événements (Période)</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.eventsCount}</h3>
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-gray-800 mb-6">Répartition des Étudiants par Niveau</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#E74A67" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-gray-800 mb-6">Statut des Paiements</h3>
                <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Payé', value: stats.totalPaidCount },
                                    { name: 'Non Payé', value: stats.totalStudents - stats.totalPaidCount },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                <Cell fill="#4ADE80" />
                                <Cell fill="#F87171" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="absolute flex flex-col gap-2 ml-48 text-sm">
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-green-400"></div> Payé
                        </div>
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-400"></div> Non Payé
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </AdminLayout>
  );
};

export default AdminDashboard;
