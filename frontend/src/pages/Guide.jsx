import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

const TEACHER_STEPS = [
  ['1', 'Create a course', 'Courses → + New course. Give it a code (CS301) and a name. This is your container for sessions and students.'],
  ['2', 'Enroll students', 'From Analytics you can export CSVs; enrollment itself happens by email — students register with that email and you add them via the API/UI as you grow. Demo courses come pre-enrolled.'],
  ['3', 'Start a session', 'Course page → Start session with a start/end time. The QR panel appears instantly.'],
  ['4', 'Show the code', 'Project the screen. Students scan the QR or type the 6-character code. It rotates every 60 seconds — screenshots are useless.'],
  ['5', 'Mark anyone manually', 'Every roster row has P / A / E buttons — mark present, absent or excused for ANY student, even ones who never checked in. Every change is audited with your reason.'],
  ['6', 'Handle requests', 'Students who missed the code send an attendance request with a reason. Approve → they are marked present instantly, or reject.'],
  ['7', 'Close the session', 'Closing auto-marks everyone still unmarked as absent. Analytics and CSV export update immediately.'],
];

const STUDENT_STEPS = [
  ['1', 'Get enrolled', 'Register with the email your teacher uses for the course. You will see the course on your Courses page.'],
  ['2', 'Join the session', 'When class starts, open the course — your teacher will show a QR code and a 6-character code on screen.'],
  ['3', 'Check in', 'Scan the QR or type the code on the check-in page. One check-in per device; the code expires in 60 seconds, so be quick.'],
  ['4', 'Missed it? Send a request', 'If the code expired before you could enter, tap “Request attendance”, give your reason, and your teacher will approve it.'],
  ['5', 'Track your percentage', 'My attendance on each course shows your per-session status, your percentage and any below-75% warnings.'],
];

const FAQ = [
  ['Why can’t I just forward the code to a friend?', 'The code is generated from the current minute — by the time a screenshot reaches your friend, it has already changed. Each check-in is also bound to one device per student.'],
  ['What does the ⚠ device anomaly flag mean?', 'Two different students checked in from the same device in one session. The teacher sees the flag and decides.'],
  ['Can the teacher change my attendance afterwards?', 'Yes — with a mandatory reason that you can see. Every manual change is permanently audited.'],
];

export default function Guide() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const steps = isTeacher ? TEACHER_STEPS : STUDENT_STEPS;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="mono text-[10px] font-bold uppercase tracking-[0.35em] text-emerald">1-minute guide</p>
        <h1 className="display mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          How Attend<span className="text-emerald">Ease</span> works
          <span className="text-pencil"> — for {isTeacher ? 'teachers' : 'students'}</span>
        </h1>
        <p className="mt-3 text-ink-soft">
          {user ? '' : 'You are viewing the student guide. Log in as a teacher to see the teaching workflow.'}
        </p>

        <ol className="mt-10 space-y-4">
          {steps.map(([n, title, body], i) => (
            <li key={n} className="card flex gap-5 p-5" style={{ animation: `fadeUp .6s ${i * 0.06}s both` }}>
              <span className="serif grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-lg font-bold text-marker">{n}</span>
              <div>
                <h3 className="display text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="display mt-12 text-2xl font-bold">Common questions</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="mr-2 text-emerald group-open:hidden">▸</span>
                <span className="mr-2 hidden text-emerald group-open:inline">▾</span>
                {q}
              </summary>
              <p className="mt-2 pl-6 text-sm leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 flex gap-3">
          <Link to="/courses" className="btn-primary rounded-full px-7 py-3 font-bold">Go to my courses →</Link>
          <Link to="/" className="btn-ghost rounded-full px-7 py-3 font-semibold">Back to home</Link>
        </div>
      </main>
    </div>
  );
}
