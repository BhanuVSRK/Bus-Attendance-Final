import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bus, 
  QrCode, 
  FileText, 
  LogOut, 
  LayoutDashboard,
  UserPlus,
  History,
  Camera,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { format } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---
type Role = 'admin' | 'driver' | 'student';

interface User {
  username?: string;
  student_id?: string;
  name?: string;
  role: Role;
  bus_number?: string;
  department?: string;
}

interface BusData {
  bus_number: string;
  driver_name: string;
  driver_phone?: string;
  route: string;
  route_from_to?: string;
  capacity: number;
  current_occupancy?: number;
  password?: string;
}

interface StudentData {
  student_id: string;
  name: string;
  department: string;
  bus_number: string;
  phone: string;
}

interface AttendanceRecord {
  attendance_id: number;
  student_id: string;
  student_name?: string;
  bus_number: string;
  date: string;
  time: string;
  scan_type: 'BOARD' | 'DROP';
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className, title, ...props }: any) => (
  <div 
    {...props}
    className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}
  >
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'student' as Role });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setView(data.user.role === 'admin' ? 'dashboard' : data.user.role === 'driver' ? 'scanner' : 'student-qr');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-indigo-600 rounded-2xl shadow-xl mb-4">
              <Bus size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">College Bus System</h1>
            <p className="text-slate-500 mt-2">Smart Attendance Management</p>
          </div>

          <Card className="shadow-xl border-0">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User Role</label>
                <select 
                  value={loginForm.role}
                  onChange={e => setLoginForm({...loginForm, role: e.target.value as Role})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="student">Student</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {loginForm.role === 'student' ? 'Student ID' : loginForm.role === 'driver' ? 'Bus Number' : 'Username'}
                </label>
                <input 
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: loginForm.role === 'driver' ? e.target.value.toUpperCase() : e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder={loginForm.role === 'student' ? 'e.g. 21CS101' : loginForm.role === 'driver' ? 'e.g. BUS01' : 'Enter username'}
                />
              </div>
              {(loginForm.role === 'admin' || loginForm.role === 'driver') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-40">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          <Menu size={24} />
        </button>
        <span className="font-bold text-slate-900 ml-3">SmartBus Admin</span>
      </div>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Bus size={20} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 truncate">SmartBus Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {user.role === 'admin' && (
            <>
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }} />
              <SidebarItem icon={Users} label="Students" active={view === 'students'} onClick={() => { setView('students'); setMobileMenuOpen(false); }} />
              <SidebarItem icon={UserPlus} label="Drivers" active={view === 'drivers'} onClick={() => { setView('drivers'); setMobileMenuOpen(false); }} />
              <SidebarItem icon={Bus} label="Buses" active={view === 'buses'} onClick={() => { setView('buses'); setMobileMenuOpen(false); }} />
              <SidebarItem icon={History} label="Attendance" active={view === 'attendance'} onClick={() => { setView('attendance'); setMobileMenuOpen(false); }} />
            </>
          )}
          {user.role === 'driver' && (
            <>
              <SidebarItem icon={Camera} label="Scanner" active={view === 'scanner'} onClick={() => { setView('scanner'); setMobileMenuOpen(false); }} />
              <SidebarItem icon={History} label="Recent Scans" active={view === 'recent-scans'} onClick={() => { setView('recent-scans'); setMobileMenuOpen(false); }} />
            </>
          )}
          {user.role === 'student' && (
            <>
              <SidebarItem icon={QrCode} label="My QR Code" active={view === 'student-qr'} onClick={() => { setView('student-qr'); setMobileMenuOpen(false); }} />
              <SidebarItem icon={History} label="My History" active={view === 'student-history'} onClick={() => { setView('student-history'); setMobileMenuOpen(false); }} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {user.name?.[0] || user.username?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name || user.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => { setUser(null); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && <AdminDashboard />}
          {view === 'students' && <StudentManagement />}
          {view === 'drivers' && <DriverManagement />}
          {view === 'buses' && <BusManagement />}
          {view === 'attendance' && <Reports />}
          {view === 'scanner' && <DriverScanner user={user} setView={setView} />}
          {view === 'recent-scans' && <RecentScans user={user} />}
          {view === 'student-qr' && <StudentQR user={user} />}
          {view === 'student-history' && <StudentHistory user={user} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- View Components ---

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [busStats, setBusStats] = useState<BusData[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const refreshStats = () => {
    fetch(`/api/stats/summary?date=${selectedDate}`).then(res => res.json()).then(setStats);
    fetch(`/api/buses/stats?date=${selectedDate}`).then(res => res.json()).then(setBusStats);
  };

  useEffect(() => {
    refreshStats();
  }, [selectedDate]);

  const handleSeed = async () => {
    if (!confirm('This will clear existing student and attendance data and seed 100 sample students. Continue?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        refreshStats();
      }
    } catch (e) {
      alert('Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  if (!stats) return <div className="animate-pulse space-y-4">
    <div className="h-32 bg-slate-200 rounded-2xl" />
    <div className="grid grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
    </div>
  </div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm">Monitor your college bus fleet in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open('/api/export/all-json', '_blank')}
            className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
          >
            <Download size={14} />
            Full Backup (JSON)
          </button>
          <button 
            onClick={() => window.open('/api/export/db', '_blank')}
            className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <Download size={14} />
            Backup DB
          </button>
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : 'Seed Sample Data'}
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-500">Date:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Buses" value={stats.totalBuses} icon={Bus} color="bg-blue-500" />
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="bg-indigo-500" />
        <StatCard label={isToday ? "Boarded Today" : "Boarded (Date)"} value={stats.todayBoardings} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label={isToday ? "Mid-Route Drops" : "Drops (Date)"} value={stats.todayDrops} icon={AlertCircle} color="bg-amber-500" />
      </div>

      {stats.totalStudents === 0 && (
        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-2xl text-center">
          <Users size={48} className="mx-auto text-indigo-400 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-indigo-900 mb-2">No Students Registered Yet</h3>
          <p className="text-indigo-600 mb-6 max-w-md mx-auto">
            Your dashboard is currently empty. You can register students manually or use the "Seed Sample Data" button above to populate the system for testing.
          </p>
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
          >
            {seeding ? 'Seeding...' : 'Seed Sample Data Now'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Bus Occupancy (Live)">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bus_number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="current_occupancy" radius={[4, 4, 0, 0]}>
                  {busStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry.current_occupancy || 0) > 45 ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="All Bus Status">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {busStats.map((bus, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Bus size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{bus.bus_number}</p>
                    <p className="text-xs text-slate-500">{bus.driver_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{bus.current_occupancy}/50</p>
                  <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", (bus.current_occupancy || 0) > 45 ? 'bg-red-500' : 'bg-indigo-500')}
                      style={{ width: `${((bus.current_occupancy || 0) / 50) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function StudentManagement() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState({ student_id: '', name: '', department: '', bus_number: '', phone: '' });

  const fetchStudents = () => fetch('/api/students').then(res => res.json()).then(setStudents);

  useEffect(() => {
    fetchStudents();
    fetch('/api/buses').then(res => res.json()).then(setBuses);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingStudent ? `/api/students/${editingStudent.student_id}` : '/api/students';
    const method = editingStudent ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowAdd(false);
      setEditingStudent(null);
      setFormData({ student_id: '', name: '', department: '', bus_number: '', phone: '' });
      fetchStudents();
    }
  };

  const handleEdit = (student: StudentData) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      department: student.department,
      bus_number: student.bus_number,
      phone: student.phone
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student? This will also remove their attendance records.')) return;
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (res.ok) fetchStudents();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Student Directory</h2>
        <button 
          onClick={() => {
            setEditingStudent(null);
            setFormData({ student_id: '', name: '', department: '', bus_number: '', phone: '' });
            setShowAdd(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <UserPlus size={18} />
          Register Student
        </button>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bus No</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Phone</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-indigo-600">{s.student_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.department}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">
                      {s.bus_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(s)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.student_id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card title={editingStudent ? "Edit Student" : "Register New Student"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student ID</label>
                    <input 
                      required 
                      disabled={!!editingStudent}
                      value={formData.student_id} 
                      onChange={e => setFormData({...formData, student_id: e.target.value})} 
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400" 
                      placeholder="21CS101" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label>
                  <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Computer Science" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bus Assignment</label>
                  <select required value={formData.bus_number} onChange={e => setFormData({...formData, bus_number: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200">
                    <option value="">Select Bus</option>
                    {buses.map(b => <option key={b.bus_number} value={b.bus_number}>{b.bus_number} - {b.route}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="+91 9876543210" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowAdd(false); setEditingStudent(null); }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">{editingStudent ? "Update" : "Register"}</button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function DriverManagement() {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBus, setEditingBus] = useState<BusData | null>(null);
  const [formData, setFormData] = useState({ 
    bus_number: '', 
    driver_name: '', 
    driver_phone: '', 
    route: '', 
    route_from_to: '', 
    capacity: 50,
    password: 'driver123'
  });

  const fetchBuses = () => fetch('/api/buses').then(res => res.json()).then(setBuses);

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBus ? `/api/buses/${editingBus.bus_number}` : '/api/buses';
    const method = editingBus ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowAdd(false);
      setEditingBus(null);
      setFormData({ bus_number: '', driver_name: '', driver_phone: '', route: '', route_from_to: '', capacity: 50, password: 'driver123' });
      fetchBuses();
    }
  };

  const handleEdit = (bus: BusData) => {
    setEditingBus(bus);
    setFormData({
      bus_number: bus.bus_number,
      driver_name: bus.driver_name,
      driver_phone: bus.driver_phone || '',
      route: bus.route,
      route_from_to: bus.route_from_to || '',
      capacity: bus.capacity,
      password: bus.password || 'driver123'
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver/bus?')) return;
    const res = await fetch(`/api/buses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchBuses();
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to delete');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Driver Directory</h2>
        <button 
          onClick={() => {
            setEditingBus(null);
            setFormData({ bus_number: '', driver_name: '', driver_phone: '', route: '', route_from_to: '', capacity: 50, password: 'driver123' });
            setShowAdd(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <UserPlus size={18} />
          Register Driver
        </button>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Driver Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bus No</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mobile Number</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Route</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buses.map((b) => (
                <tr key={b.bus_number} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{b.driver_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">
                      {b.bus_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{b.driver_phone || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="max-w-xs truncate" title={b.route_from_to}>
                      {b.route_from_to || b.route}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(b)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b.bus_number)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card title={editingBus ? "Edit Driver Details" : "Register New Driver"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input required value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bus Number</label>
                    <input 
                      required 
                      disabled={!!editingBus}
                      value={formData.bus_number} 
                      onChange={e => setFormData({...formData, bus_number: e.target.value.toUpperCase()})} 
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 disabled:bg-slate-50" 
                      placeholder="BUS01" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                    <input required value={formData.driver_phone} onChange={e => setFormData({...formData, driver_phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bus Capacity</label>
                    <input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route Name</label>
                  <input required value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Route 1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Login Password</label>
                  <input required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="driver123" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route (From - To)</label>
                  <textarea required value={formData.route_from_to} onChange={e => setFormData({...formData, route_from_to: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Campus to Main Gate" rows={2} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowAdd(false); setEditingBus(null); }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">{editingBus ? "Update" : "Register"}</button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function BusManagement() {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBus, setEditingBus] = useState<BusData | null>(null);
  const [selectedBusStudents, setSelectedBusStudents] = useState<{ bus: string; students: StudentData[] } | null>(null);
  const [formData, setFormData] = useState({ 
    bus_number: '', 
    driver_name: '', 
    driver_phone: '', 
    route: '', 
    route_from_to: '', 
    capacity: 50,
    password: 'driver123'
  });

  const fetchBuses = () => fetch('/api/buses').then(res => res.json()).then(setBuses);

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBus ? `/api/buses/${editingBus.bus_number}` : '/api/buses';
    const method = editingBus ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowAdd(false);
      setEditingBus(null);
      setFormData({ bus_number: '', driver_name: '', driver_phone: '', route: '', route_from_to: '', capacity: 50, password: 'driver123' });
      fetchBuses();
    }
  };

  const handleEdit = (bus: BusData) => {
    setEditingBus(bus);
    setFormData({
      bus_number: bus.bus_number,
      driver_name: bus.driver_name,
      driver_phone: bus.driver_phone || '',
      route: bus.route,
      route_from_to: bus.route_from_to || '',
      capacity: bus.capacity,
      password: bus.password || 'driver123'
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;
    const res = await fetch(`/api/buses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchBuses();
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to delete bus');
    }
  };

  const viewStudents = async (bus_number: string) => {
    const res = await fetch(`/api/buses/${bus_number}/students`);
    const students = await res.json();
    setSelectedBusStudents({ bus: bus_number, students });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Bus Fleet Management</h2>
        <button 
          onClick={() => {
            setEditingBus(null);
            setFormData({ bus_number: '', driver_name: '', driver_phone: '', route: '', route_from_to: '', capacity: 50, password: 'driver123' });
            setShowAdd(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Bus size={18} />
          Add New Bus
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buses.map((bus) => (
          <Card key={bus.bus_number} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => viewStudents(bus.bus_number)}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Bus size={24} className="text-indigo-600" />
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => handleEdit(bus)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(bus.bus_number)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-1">{bus.bus_number}</h3>
            <p className="text-sm font-medium text-indigo-600 mb-4">{bus.route}</p>
            
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-slate-400" />
                <span className="text-slate-500">Driver:</span>
                <span className="font-semibold text-slate-800">{bus.driver_name}</span>
              </div>
              {bus.driver_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800">{bus.driver_phone}</span>
                </div>
              )}
              {bus.route_from_to && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <span className="text-slate-500">Route:</span>
                  <span className="font-semibold text-slate-800 flex-1">{bus.route_from_to}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                  Capacity: {bus.capacity}
                </span>
                <span className="text-xs text-indigo-600 font-bold group-hover:underline">View Students →</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card title={editingBus ? "Edit Bus/Driver" : "Add New Bus/Driver"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bus Number</label>
                    <input 
                      required 
                      disabled={!!editingBus}
                      value={formData.bus_number} 
                      onChange={e => setFormData({...formData, bus_number: e.target.value.toUpperCase()})} 
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 disabled:bg-slate-50" 
                      placeholder="BUS01" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Capacity</label>
                    <input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Name</label>
                    <input required value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="John Driver" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Phone</label>
                    <input value={formData.driver_phone} onChange={e => setFormData({...formData, driver_phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="+91 98765..." />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route Name</label>
                  <input required value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Route 1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Login Password</label>
                  <input required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="driver123" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route Details (From - To)</label>
                  <textarea value={formData.route_from_to} onChange={e => setFormData({...formData, route_from_to: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Campus to Main Gate" rows={2} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowAdd(false); setEditingBus(null); }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">{editingBus ? "Update" : "Add Bus"}</button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}

      {selectedBusStudents && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl">
            <Card title={`Students Assigned to ${selectedBusStudents.bus}`}>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBusStudents.students.map(s => (
                      <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-indigo-600">{s.student_id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.department}</td>
                      </tr>
                    ))}
                    {selectedBusStudents.students.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400">No students assigned to this bus</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedBusStudents(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Close</button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function DriverScanner({ user, setView }: { user: User, setView: (view: string) => void }) {
  const [busNumber, setBusNumber] = useState(user.bus_number || '');
  const [scanType, setScanType] = useState<'BOARD' | 'DROP'>('BOARD');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [scanning, setScanning] = useState<'camera' | 'upload' | null>(null);

  async function onScanSuccess(decodedText: string) {
    setScanning(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: decodedText, bus_number: busNumber, scan_type: scanType })
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setResult({ success: false, message: 'Scan failed' });
    }
  }

  function onScanError(err: any) {}

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const html5QrCode = new Html5Qrcode("reader");
      try {
        const decodedText = await html5QrCode.scanFile(file, true);
        onScanSuccess(decodedText);
      } catch (err) {
        setResult({ success: false, message: 'Failed to scan image' });
      } finally {
        html5QrCode.clear();
      }
    }
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (scanning === 'camera') {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, videoConstraints: { facingMode: "environment" } }, false);
      scanner.render(onScanSuccess, onScanError);
    }
    return () => scanner?.clear();
  }, [scanning, busNumber, scanType]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto space-y-6 text-white">
      <div className="flex items-center gap-4">
        <button onClick={() => setView('recent-scans')} className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold">Back</button>
        <h2 className="text-2xl font-bold">Attendance Scanner</h2>
      </div>
      <Card title="Attendance Scanner" className="bg-slate-900 border-slate-800 text-white">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Bus Number</label>
            <input 
              value={busNumber}
              onChange={e => setBusNumber(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
              placeholder="e.g. BUS01"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setScanType('BOARD')}
              className={cn("flex-1 py-2 rounded-lg font-bold text-sm transition-all", scanType === 'BOARD' ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300")}
            >
              BOARDING
            </button>
            <button 
              onClick={() => setScanType('DROP')}
              className={cn("flex-1 py-2 rounded-lg font-bold text-sm transition-all", scanType === 'DROP' ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300")}
            >
              MID-ROUTE DROP
            </button>
          </div>

          <div className="relative aspect-square bg-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4">
            {scanning === 'camera' ? (
              <div id="reader" className="w-full h-full" />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => setScanning('camera')}
                  className="flex flex-col items-center gap-3 text-white bg-indigo-600 px-6 py-4 rounded-xl"
                >
                  <Camera size={48} />
                  <span className="font-bold">Scan from Camera</span>
                </button>
                <label className="flex flex-col items-center gap-3 text-white bg-slate-700 px-6 py-4 rounded-xl cursor-pointer">
                  <FileText size={48} />
                  <span className="font-bold">Upload from Device</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={cn("p-4 rounded-xl flex items-center gap-3", result.success ? "bg-emerald-900 text-emerald-100" : "bg-red-900 text-red-100")}
            >
              {result.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-semibold">{result.message}</span>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function StudentQR({ user }: { user: User }) {
  const qrValue = `${user.student_id}|${user.bus_number}`;

  const downloadQR = () => {
    const canvas = document.getElementById('student-qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${user.student_id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto space-y-6">
      <Card className="text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
          <p className="text-slate-500">{user.student_id} • {user.department}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-inner border border-slate-100 inline-block mb-6">
          <QRCodeCanvas id="student-qr-canvas" value={qrValue} size={200} level="H" includeMargin />
        </div>

        <div className="bg-indigo-50 p-4 rounded-2xl mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Assigned Bus</p>
          <p className="text-xl font-bold text-indigo-900">{user.bus_number}</p>
        </div>

        <button 
          onClick={downloadQR}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          <Download size={20} />
          Download QR Code Image
        </button>
      </Card>
      
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
        <AlertCircle className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          Show this QR code to the driver when boarding. If you get down mid-route, please scan it again with the driver.
        </p>
      </div>
    </motion.div>
  );
}

function StudentHistory({ user }: { user: User }) {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetch(`/api/attendance?student_id=${user.student_id}`).then(res => res.json()).then(setHistory);
  }, [user.student_id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Attendance History</h2>
      <div className="space-y-3">
        {history.map((record) => (
          <div key={record.attendance_id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-2 rounded-lg", record.scan_type === 'BOARD' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                {record.scan_type === 'BOARD' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <p className="font-bold text-slate-900">{record.scan_type}</p>
                <p className="text-xs text-slate-500">{record.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{record.time}</p>
              <p className="text-xs text-slate-400">{record.bus_number}</p>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <History size={48} className="mx-auto mb-3 opacity-20" />
            <p>No attendance records found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Reports() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState({ date: format(new Date(), 'yyyy-MM-dd'), bus_number: '' });
  const [buses, setBuses] = useState<BusData[]>([]);

  useEffect(() => {
    fetch('/api/buses').then(res => res.json()).then(setBuses);
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    const params = new URLSearchParams(filter);
    fetch(`/api/attendance?${params}`).then(res => res.json()).then(setRecords);
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Time', 'Student ID', 'Student Name', 'Bus No', 'Type'];
    const rows = records.map(r => [
      `"${r.date}"`, 
      `"${r.time}"`, 
      `"${r.student_id}"`, 
      `"${r.student_name}"`, 
      `"${r.bus_number}"`, 
      `"${r.scan_type}"`
    ]);
    
    const csvString = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${filter.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Attendance Reports</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => window.open('/api/export/attendance', '_blank')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Download size={18} />
            Full History
          </button>
          <button 
            onClick={() => window.open('/api/export/students', '_blank')}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-600 transition-colors"
          >
            <Download size={18} />
            Student List
          </button>
          <button 
            onClick={() => window.open('/api/export/buses', '_blank')}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Download size={18} />
            Bus List
          </button>
          <button 
            onClick={downloadCSV}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Download size={18} />
            Export Filtered
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Date</label>
            <input 
              type="date" 
              value={filter.date} 
              onChange={e => setFilter({...filter, date: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Bus</label>
            <select 
              value={filter.bus_number} 
              onChange={e => setFilter({...filter, bus_number: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="">All Buses</option>
              {buses.map(b => <option key={b.bus_number} value={b.bus_number}>{b.bus_number}</option>)}
            </select>
          </div>
          <button 
            onClick={fetchRecords}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
          >
            Generate
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Time</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Student</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bus</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.attendance_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{r.time}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{r.student_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{r.student_id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">{r.bus_number}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      r.scan_type === 'BOARD' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {r.scan_type}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No records found for the selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

function RecentScans({ user }: { user: User }) {
  const [scans, setScans] = useState<any[]>([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetch(`/api/attendance?date=${today}&bus_number=${user.bus_number}`)
      .then(res => res.json())
      .then(setScans);
  }, [user.bus_number, today]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Today's Scans</h2>
        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
          {user.bus_number}
        </div>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Time</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Student</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scans.map((s) => (
                <tr key={s.attendance_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{s.time}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{s.student_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{s.student_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      s.scan_type === 'BOARD' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {s.scan_type}
                    </span>
                  </td>
                </tr>
              ))}
              {scans.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    No scans recorded today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
