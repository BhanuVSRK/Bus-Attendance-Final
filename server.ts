import express from "express";
import { createServer as createViteServer } from "vite";
import db, { initDb } from "./src/db.ts";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  try {
    console.log("Initializing database...");
    await initDb();
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // In production, we might want to exit if the DB is critical
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  const app = express();
  const PORT = 3000;

  // Helper to get Kolkata date/time
  const getKolkataDate = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
  const getKolkataTime = () => new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}).format(new Date());

  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", async (req, res) => {
    const { username, password, role } = req.body;
    try {
      if (role === 'admin') {
        const admin = await db('admins').whereRaw('LOWER(username) = ?', [username.toLowerCase()]).where({ password }).first();
        if (admin) return res.json({ success: true, user: { username: admin.username, role: 'admin' } });
      } else if (role === 'student') {
        const student = await db('students').where({ student_id: username }).first();
        if (student) return res.json({ success: true, user: { ...student, role: 'student' } });
      } else if (role === 'driver') {
        const bus = await db('buses').where({ bus_number: username, password }).first();
        if (bus) return res.json({ success: true, user: { ...bus, role: 'driver' } });
      }
      res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await db('students').select('*');
      res.json(students);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    const { student_id, name, department, bus_number, phone } = req.body;
    try {
      await db('students').insert({ student_id, name, department, bus_number, phone });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    const { id } = req.params;
    const { name, department, bus_number, phone } = req.body;
    try {
      const updated = await db('students').where({ student_id: id }).update({ name, department, bus_number, phone });
      if (!updated) return res.status(404).json({ success: false, message: "Student not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db('attendance').where({ student_id: id }).del();
      await db('students').where({ student_id: id }).del();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  // Buses
  app.get("/api/buses", async (req, res) => {
    try {
      const buses = await db('buses').select('*');
      res.json(buses);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/buses", async (req, res) => {
    const { bus_number, driver_name, driver_phone, route, route_from_to, capacity, password } = req.body;
    try {
      await db('buses').insert({ 
        bus_number, 
        driver_name, 
        driver_phone, 
        route, 
        route_from_to, 
        capacity: capacity || 50,
        password: password || 'driver123'
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.put("/api/buses/:bus_number", async (req, res) => {
    const { bus_number } = req.params;
    const { driver_name, driver_phone, route, route_from_to, capacity, password } = req.body;
    try {
      const updated = await db('buses').where({ bus_number }).update({ 
        driver_name, 
        driver_phone, 
        route, 
        route_from_to, 
        capacity,
        password
      });
      if (!updated) return res.status(404).json({ success: false, message: "Bus not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/buses/:bus_number", async (req, res) => {
    const { bus_number } = req.params;
    try {
      const studentCount = await db('students').where({ bus_number }).count('student_id as count').first();
      if (Number(studentCount?.count) > 0) {
        return res.status(400).json({ success: false, message: "Cannot delete bus with assigned students" });
      }
      await db('buses').where({ bus_number }).del();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.get("/api/buses/:bus_number/students", async (req, res) => {
    const { bus_number } = req.params;
    try {
      const students = await db('students').where({ bus_number });
      res.json(students);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/buses/stats", async (req, res) => {
    const date = req.query.date || getKolkataDate();
    try {
      const buses = await db('buses').select('bus_number', 'capacity');
      const stats = await Promise.all(buses.map(async (bus) => {
        const occupancy = await db('attendance')
          .where({ bus_number: bus.bus_number, date, scan_type: 'BOARD' })
          .count('attendance_id as count')
          .first();
        return {
          ...bus,
          current_occupancy: Number(occupancy?.count || 0)
        };
      }));
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Attendance
  app.get("/api/attendance", async (req, res) => {
    const { date, bus_number, student_id } = req.query;
    try {
      let query = db('attendance as a')
        .join('students as s', 'a.student_id', 's.student_id')
        .select('a.*', 's.name as student_name');
      
      if (date) query = query.where('a.date', date);
      if (bus_number) query = query.where('a.bus_number', bus_number);
      if (student_id) query = query.where('a.student_id', student_id);
      
      const records = await query;
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/scan", async (req, res) => {
    const { qrData, bus_number: driverBus, scan_type } = req.body;
    const [student_id] = qrData.split('|');
    const today = getKolkataDate();
    const now = getKolkataTime();

    try {
      const student = await db('students').where({ student_id }).first();
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      if (student.bus_number !== driverBus) {
        return res.status(400).json({ success: false, message: `Wrong Bus! Student assigned to ${student.bus_number}` });
      }

      if (scan_type === 'BOARD') {
        const alreadyBoarded = await db('attendance').where({ student_id, date: today, scan_type: 'BOARD' }).first();
        if (alreadyBoarded) return res.status(400).json({ success: false, message: "Already boarded today" });

        const occupancy = await db('attendance').where({ bus_number: driverBus, date: today, scan_type: 'BOARD' }).count('attendance_id as count').first();
        const bus = await db('buses').where({ bus_number: driverBus }).first();
        if (Number(occupancy?.count || 0) >= (bus?.capacity || 50)) {
          return res.status(400).json({ success: false, message: `Bus capacity exceeded` });
        }
      } else if (scan_type === 'DROP') {
        const alreadyDropped = await db('attendance').where({ student_id, date: today, scan_type: 'DROP' }).first();
        if (alreadyDropped) return res.status(400).json({ success: false, message: "Already marked as dropped today" });
      }

      await db('attendance').insert({ student_id, bus_number: driverBus, date: today, time: now, scan_type });
      res.json({ success: true, message: `${scan_type} recorded for ${student.name}` });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Dashboard Stats
  app.get("/api/stats/summary", async (req, res) => {
    const date = req.query.date || getKolkataDate();
    try {
      const totalBuses = await db('buses').count('bus_number as count').first();
      const totalStudents = await db('students').count('student_id as count').first();
      const todayBoardings = await db('attendance').where({ date, scan_type: 'BOARD' }).count('attendance_id as count').first();
      const todayDrops = await db('attendance').where({ date, scan_type: 'DROP' }).count('attendance_id as count').first();

      res.json({
        totalBuses: Number(totalBuses?.count || 0),
        totalStudents: Number(totalStudents?.count || 0),
        todayBoardings: Number(todayBoardings?.count || 0),
        todayDrops: Number(todayDrops?.count || 0)
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Seed Data
  app.post("/api/seed", async (req, res) => {
    try {
      await db('attendance').del();
      await db('students').del();

      const departments = ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics'];
      const students = [];
      for (let i = 1; i <= 100; i++) {
        students.push({
          student_id: `21CS${i.toString().padStart(3, '0')}`,
          name: `Student ${i}`,
          department: departments[Math.floor(Math.random() * departments.length)],
          bus_number: `BUS${(Math.floor(Math.random() * 31) + 1).toString().padStart(2, '0')}`,
          phone: `+91 98765${i.toString().padStart(5, '0')}`
        });
      }
      await db('students').insert(students);

      const today = getKolkataDate();
      const attendance = students.slice(0, 60).map((s, idx) => ({
        student_id: s.student_id,
        bus_number: s.bus_number,
        date: today,
        time: `08:${(10 + idx % 40).toString().padStart(2, '0')}:00`,
        scan_type: 'BOARD'
      }));
      await db('attendance').insert(attendance);

      res.json({ success: true, message: "Sample data seeded successfully" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Export All Attendance
  app.get("/api/export/attendance", async (req, res) => {
    try {
      const records = await db('attendance as a')
        .join('students as s', 'a.student_id', 's.student_id')
        .select('a.*', 's.name as student_name');
      
      const headers = ['Date', 'Time', 'Student ID', 'Student Name', 'Bus No', 'Type'];
      const rows = records.map(r => [
        r.date, 
        r.time, 
        r.student_id, 
        r.student_name, 
        r.bus_number, 
        r.scan_type
      ]);
      
      const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=all_attendance.csv');
      res.send(csv);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Export All Students
  app.get("/api/export/students", async (req, res) => {
    try {
      const students = await db('students').select('*');
      const headers = ['Student ID', 'Name', 'Department', 'Bus No', 'Phone'];
      const rows = students.map(s => [
        s.student_id, 
        s.name, 
        s.department, 
        s.bus_number, 
        s.phone
      ]);
      
      const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=all_students.csv');
      res.send(csv);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Export All Buses
  app.get("/api/export/buses", async (req, res) => {
    try {
      const buses = await db('buses').select('*');
      const headers = ['Bus No', 'Driver Name', 'Phone', 'Route', 'Capacity'];
      const rows = buses.map(b => [
        b.bus_number, 
        b.driver_name, 
        b.driver_phone, 
        b.route, 
        b.capacity
      ]);
      
      const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=all_buses.csv');
      res.send(csv);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Export All Data as JSON
  app.get("/api/export/all-json", async (req, res) => {
    try {
      const students = await db('students').select('*');
      const buses = await db('buses').select('*');
      const attendance = await db('attendance').select('*');
      
      const data = {
        export_date: new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long'}).format(new Date()),
        students,
        buses,
        attendance
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=bus_system_full_backup.json');
      res.send(JSON.stringify(data, null, 2));
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Export Database File
  app.get("/api/export/db", async (req, res) => {
    try {
      res.download('bus_attendance.db');
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
