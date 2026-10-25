import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Courses from './pages/Courses.jsx';
import TeacherSession from './pages/TeacherSession.jsx';
import StudentCheckin from './pages/StudentCheckin.jsx';
import Analytics from './pages/Analytics.jsx';
import Guide from './pages/Guide.jsx';
import LiveWatcher from './components/LiveWatcher.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <>
      <LiveWatcher />
      <Routes>
        <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/courses" element={<Courses />} />
        <Route path="/sessions/:sessionId" element={<TeacherSession />} />
        <Route path="/checkin/:sessionId" element={<StudentCheckin />} />
        <Route path="/courses/:id/analytics" element={<Analytics />} />
        <Route path="/guide" element={<Guide />} />
      </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
